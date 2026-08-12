import { db } from "../db/client.js";
import { webhookDeliveries } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

export async function findWebhookDeliveryByDeliveryId(deliveryId: string) { 
    const [delivery] = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.deliveryId, deliveryId))
        .limit(1);

    return delivery ?? null;
}

export async function markWebhookDeliveryProcessed(deliveryId: string) { 
    await db
        .update(webhookDeliveries)
        .set({
            status: "processed",
            processedAt: new Date(),
        })
        .where(eq(webhookDeliveries.deliveryId, deliveryId));
}

export async function markWebhookDeliveryFailed(deliveryId: string) { 
    await db
        .update(webhookDeliveries)
        .set({
            status: "failed", 
        })
        .where(eq(webhookDeliveries.deliveryId, deliveryId));
}