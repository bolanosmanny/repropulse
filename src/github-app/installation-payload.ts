import { z } from "zod";

const installationActionSchema = z.enum([
    "created",
    "deleted",
    "suspend",
    "unsuspend",
]);

export const installationWebhookPayloadSchema = z.object({
    action: installationActionSchema,
    installation: z.object({
        id: z.number(),
        suspended_at: z.string().nullable(),
        account: z.object({
            login: z.string(),
            type: z.string(),
        }),
    }),
});

export type InstallationWebhookPayload = z.infer<
    typeof installationWebhookPayloadSchema
>;

export function parseInstallationWebhookPayload(payload: unknown) { 
    return installationWebhookPayloadSchema.parse(payload);
}
