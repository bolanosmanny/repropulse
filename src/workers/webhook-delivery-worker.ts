import { Worker } from "bullmq";
import pino from "pino";
import { 
    findWebhookDeliveryByDeliveryId,
    markWebhookDeliveryProcessed,
    markWebhookDeliveryFailed,
} from "../webhooks/delivery-repository.js";
import { redisConnection } from "../queue/redis-connection.js";
import type { ProcessWebhookDeliveryJob } from "../queue/webhook-delivery-queue.js";
import { parseWorkflowRunWebhookPayload } from "../workflows/workflow-run-payload.js";
import { upsertWorkflowRun } from "../workflows/workflow-run-repository.js";
import { deadLetterQueue } from "../queue/dead-letter-queue.js";

const logger = pino({
    name: "webhook-delivery-worker",
});

const worker = new Worker<ProcessWebhookDeliveryJob>(
    "webhook-deliveries",
    async (job) => { 
        const delivery = await findWebhookDeliveryByDeliveryId(
            job.data.deliveryId
        );

        if (delivery == null) { 
            throw new Error(`Webhook delivery ${job.data.deliveryId} was not found`);
        }

        if (delivery.status === "processed") { 
            logger.info(
                { deliveryId: delivery.deliveryId },
                "Webhook delivery was already processed"
            );
            return;
        }

        if (delivery.eventName === "workflow_run") { 
            const payload = parseWorkflowRunWebhookPayload(delivery.payload);

            const workflowRun = await upsertWorkflowRun(payload);

            logger.info(
                {
                    deliveryId: delivery.deliveryId,
                    githubWorkflowRunId: workflowRun.githubWorkflowRunId,
                },
                "Workflow run stored"
            );
        } else { 
            logger.info(
                {
                    deliveryId: delivery.deliveryId,
                    eventName: delivery.eventName,
                },
                "Ignoring unsupported webhook event type"
            );
        }


        logger.info(
            {
                deliveryId: delivery.deliveryId,
                eventName: delivery.eventName,
            },
            "Processing webhook delivery"
        );

        await markWebhookDeliveryProcessed(delivery.deliveryId);

        logger.info(
            { deliveryId: delivery.deliveryId },
            "Webhook delivery processed"
        );
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

worker.on("failed", (job, error) => { 
    logger.error(
        {
            jobId: job?.id,
            err: error,
        },
        "Webhook delivery job failed"
    );

    if (job == null || job.attemptsMade < (job.opts.attempts ?? 1)) { 
        return;
    }
    
    void markWebhookDeliveryFailed(job.data.deliveryId).catch((statusError) => { 
        logger.error(
            { deliveryId: job.data.deliveryId, err: statusError },
            "Failed to mark webhook delivery as failed"
        );
    });

    void deadLetterQueue
        .add(
            "webhook-deliveries-failed",
            {
                sourceQueue: "webhook-deliveries",
                sourceJobId: job.id,
                jobName: job.name,
                attemptsMade: job.attemptsMade,
                failedReason: error.message,
                failedAt: new Date().toISOString(),
            },
            {
                jobId: `dead-letter-webhook-${job.id}`,
            }
        )
        .catch((deadLetterError) => { 
            logger.error(
                { jobId: job.id, err: deadLetterError },
                "Failed to record dead-letter job"
            );
        });
});
