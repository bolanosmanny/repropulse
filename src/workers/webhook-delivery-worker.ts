import { Worker } from "bullmq";
import pino from "pino";
import { 
    findWebhookDeliveryByDeliveryId,
    markWebhookDeliveryProcessed,
} from "../webhooks/delivery-repository.js";
import { redisConnection } from "../queue/redis-connection.js";
import type { ProcessWebhookDeliveryJob } from "../queue/webhook-delivery-queue.js";

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

        // Future step: dispatch workflow events and process test results here.


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