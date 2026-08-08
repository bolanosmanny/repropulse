import { Queue } from 'bullmq';
import { redisConnection } from "./redis-connection.js"

export type ProcessWebhookDeliveryJob = { 
    deliveryId: string;
};

export const webhookDeliveryQueue = new Queue<ProcessWebhookDeliveryJob>(
    "webhook-deliveries",
    {
        connection: redisConnection,
    }
);