import { Worker } from "bullmq";
import pino from "pino";
import { 
    findWebhookDeliveryByDeliveryId,
    markWebhookDeliveryProcessed,
} from "../webhooks/delivery-repository.js";
import { redisConnection } from "../queue/redis-connection.js";
import type { ProcessWebhookDeliveryJob } from "../queue/webhook-delivery-queue.js";
import { parseWorkflowRunWebhookPayload } from "../workflows/workflow-run-payload.js";
import { upsertWorkflowRun } from "../workflows/workflow-run-repository.js";

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
});