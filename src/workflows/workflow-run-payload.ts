import { z } from "zod";

export const workflowRunWebhookPayloadSchema = z.object({
    repository: z.object({
        id: z.number(),
        full_name: z.string(),
        default_branch: z.string().nullable(),
    }),
    workflow_run: z.object({
        id: z.number(),
        name: z.string(),
        status: z.string(),
        conclusion: z.string().nullable(),
        head_sha: z.string(),
        head_branch: z.string().nullable(),
        run_attempt: z.number(),
        run_started_at: z.string().nullable(),
        updated_at: z.string(),
    }),
});

export type WorkflowRunWebhookPayload = z.infer<
    typeof workflowRunWebhookPayloadSchema
>;

export function parseWorkflowRunWebhookPayload(
    payload: unknown
): WorkflowRunWebhookPayload {
    return workflowRunWebhookPayloadSchema.parse(payload);
}

