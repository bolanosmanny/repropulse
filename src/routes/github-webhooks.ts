import type { FastifyPluginAsync } from "fastify";
import { createWebhookDelivery } from "../webhooks/delivery-repository.js";

type GitHubWebhookRequest = { 
    Headers: { 
        "x-github-delivery": string;
        "x-github-event": string;
    };
    Body: Record<string, unknown>;
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
                    },
                    required: ["x-github-delivery", "x-github-event"],
                },
            },
        },
        async (request, reply) => {
            const delivery = await createWebhookDelivery({
                deliveryId: request.headers["x-github-delivery"],
                eventName: request.headers["x-github-event"],
                payload: request.body,
            });

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