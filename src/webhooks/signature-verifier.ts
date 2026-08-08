import { Webhooks } from "@octokit/webhooks";
import { env } from "../config.js";

const webhooks = new Webhooks({
    secret: env.GITHUB_WEBHOOK_SECRET,
});

export function verifyGitHubSignature(
    rawPayload: string,
    signature: string
) { 
    return webhooks.verify(rawPayload, signature);
}