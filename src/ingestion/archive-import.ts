import { z } from "zod";
import {
  parseWorkflowRunWebhookPayload,
  type WorkflowRunWebhookPayload,
} from "../workflows/workflow-run-payload.js";

const githubRunSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  status: z.string(),
  conclusion: z.string().nullable(),
  head_sha: z.string(),
  head_branch: z.string().nullable(),
  run_attempt: z.number().int().positive(),
  run_started_at: z.string().nullable(),
  updated_at: z.string(),
  repository: z.object({
    id: z.number().int().positive(),
    full_name: z.string(),
    // The run-attempt endpoint may omit this field even for public repos.
    default_branch: z.string().nullish(),
  }),
});

export function githubRunAttemptUrl(
  repository: string,
  runId: number,
  attempt: number
): string {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("Repository must be OWNER/NAME");
  }
  if (!Number.isSafeInteger(runId) || runId < 1) {
    throw new Error("Run ID must be a positive integer");
  }
  if (!Number.isSafeInteger(attempt) || attempt < 1) {
    throw new Error("Attempt must be a positive integer");
  }
  return `https://api.github.com/repos/${repository}/actions/runs/${runId}/attempts/${attempt}`;
}

export function workflowPayloadFromGitHubRun(
  value: unknown,
  repository: string,
  runId: number,
  attempt: number
): WorkflowRunWebhookPayload {
  const run = githubRunSchema.parse(value);
  if (
    run.id !== runId ||
    run.run_attempt !== attempt ||
    run.repository.full_name.toLowerCase() !== repository.toLowerCase()
  ) {
    throw new Error("GitHub workflow metadata does not match the requested archive");
  }
  if (run.status !== "completed") {
    throw new Error("Only completed workflow attempts can be backfilled");
  }
  return parseWorkflowRunWebhookPayload({
    repository: {
      ...run.repository,
      default_branch: run.repository.default_branch ?? null,
    },
    workflow_run: run,
  });
}
