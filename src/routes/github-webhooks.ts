import type { FastifyPluginAsync } from "fastify";
import { createWebhookDelivery } from "../webhooks/delivery-repository.js";
import { verifyGitHubSignature } from "../webhooks/signature-verifier.js";
import { webhookDeliveryQueue } from "../queue/webhook-delivery-queue.js";

type GitHubWebhookRequest = { 
    Headers: { 
        "x-github-delivery": string;
        "x-github-event": string;
        "x-hub-signature-256": string;
    };
    Body: string;
};

export const githubWebhooksRoutes: FastifyPluginAsync = async (app) => { 
    app.post<GitHubWebhookRequest>(
        "/webhooks/github",
        {
            schema: { 
                headers: { 
                    type: "object",
                    properties: { 
                        "x-github-delivery": { type: "string" },
                        "x-github-event": { type: "string" },
                        "x-hub-signature-256": { type: "string" },
                    },
                    required: [
                        "x-github-delivery", 
                        "x-github-event",
                        "x-hub-signature-256"
                    ],
                },
            },
        },
        async (request, reply) => {
            const isValid = await verifyGitHubSignature(
                request.body,
                request.headers["x-hub-signature-256"]
            );

            if (!isValid) { 
                return reply.code(401).send({
                    error: "Invalid webhook signature",
                });
            }

            let payload: Record<string, unknown>;

            try { 
                payload = JSON.parse(request.body) as Record<string, unknown>;
            } catch { 
                return reply.code(400).send({
                    error: "Invalid JSON payload",
                });
            }

            const delivery = await createWebhookDelivery({
                deliveryId: request.headers["x-github-delivery"],
                eventName: request.headers["x-github-event"],
                payload,
            });

            if (delivery != null) { 
                await webhookDeliveryQueue.add(
                    "process-webhook-delivery",
                    {
                        deliveryId: request.headers["x-github-delivery"],
                    },
                    {
                        jobId: `delivery-${request.headers["x-github-delivery"]}`,
                        attempts: 5,
                        backoff: { 
                            type: "exponential",
                            delay: 1000,
                        },
                        removeOnComplete: 1000,
                        removeOnFail: 1000,
                    }
                );
            }

            if (delivery == null) { 
                return reply.code(200).send({
                    accepted: true,
                    duplicate: true,
                });
            }

            return reply.code(202).send({
                accepted: true,
                duplicate: false,
            });
        }
    );
};