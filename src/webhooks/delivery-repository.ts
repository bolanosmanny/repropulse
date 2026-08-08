import { db } from "../db/client.js";
import { webhookDeliveries } from "../db/schema.js";

type CreateWebhookDeliveryInput = { 
    deliveryId: string;
    eventName: string;
    payload: Record<string, unknown>;
};

export async function createWebhookDelivery(
    input: CreateWebhookDeliveryInput
) { 
    const [delivery] = await db
        .insert(webhookDeliveries)
        .values(input)
        .onConflictDoNothing({
            target: webhookDeliveries.deliveryId,
        })
        .returning({
            id: webhookDeliveries.id,
        });

    return delivery ?? null;
}