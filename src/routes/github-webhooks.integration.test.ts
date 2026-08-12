import { createHmac, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { env } from "../config.js";
import { db } from "../db/client.js";
import { webhookDeliveries } from "../db/schema.js";
import { webhookDeliveryQueue } from "../queue/webhook-delivery-queue.js";
import { eq } from "drizzle-orm";

const app = buildApp();
const deliveryId = `integration-${randomUUID()}`;
const jobId = `delivery-${deliveryId}`;

function sign(payload: string) { 
    const digest = createHmac("sha256", env.GITHUB_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");

    return `sha256=${digest}`;
}

afterAll(async () => { 
    await webhookDeliveryQueue.remove(jobId).catch(() => undefined);

    await db
        .delete(webhookDeliveries)
        .where(eq(webhookDeliveries.deliveryId, deliveryId));

    await app.close();
});

describe("POST /webhooks/github", () => { 
    it("accepts a singed delivery once and treats the retry as a duplicate", async () => {
        const payload = JSON.stringify({
            action: "created",
            installation: {
                id: 12345,
            },
        });

        const headers = { 
            "content-type": "application/json",
            "x-github-delivery": deliveryId,
            "x-github-event": "installation",
            "x-hub-signature-256": sign(payload),
        };

        const firstResponse = await app.inject({
            method: "POST",
            url: "/webhooks/github",
            headers,
            payload,
        });

        expect(firstResponse.statusCode).toBe(202);
        expect(firstResponse.json()).toEqual({
            accepted: true,
            duplicate: false,
        });

        const duplicateResponse = await app.inject({
            method: "POST",
            url: "/webhooks/github",
            headers,
            payload,
        });

        expect(duplicateResponse.statusCode).toBe(200);
        expect(duplicateResponse.json()).toEqual({
            accepted: true,
            duplicate: true,
        });

        const deliveries = await db
            .select({
                deliveryId: webhookDeliveries.deliveryId,
                eventName: webhookDeliveries.eventName,
            })
            .from(webhookDeliveries)
            .where(eq(webhookDeliveries.deliveryId, deliveryId));

            expect(deliveries).toEqual([
                {
                    deliveryId,
                    eventName: "installation",
                },
            ]);
    });
});
