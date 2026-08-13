import { z } from "zod";

const evaluatedPullRequestActions = new Set([
    "opened",
    "reopened",
    "synchronize",
]);

export const pullRequestWebhookPayloadSchema = z.object({
    action: z.string().min(1),
    number: z.number().int().positive(),
    installation: z.object({
        id: z.number().int().positive(),
    }),
    repository: z.object({
        id: z.number().int().positive(),
        full_name: z.string().min(1),
    }),
    pull_request: z.object({
        head: z.object({
            sha: z.string().min(1),
        }),
        base: z.object({
            ref: z.string().min(1),
        }),
    }),
});

export type PullRequestWebhookPayload = z.infer<
    typeof pullRequestWebhookPayloadSchema
>;

export function parsePullRequestWebhookPayload(payload: unknown) { 
    return pullRequestWebhookPayloadSchema.parse(payload);
}

export function shouldEvaluatePullRequest(
    payload: PullRequestWebhookPayload
) : boolean {
    return evaluatedPullRequestActions.has(payload.action);
}
