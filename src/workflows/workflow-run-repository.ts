import { db } from "../db/client.js";
import { repositories, workflowRuns } from "../db/schema.js";
import type { WorkflowRunWebhookPayload } from "./workflow-run-payload.js";

export async function upsertWorkflowRun(
    payload: WorkflowRunWebhookPayload
) { 
    const { repository, workflow_run: workflowRun } = payload;

    const [savedRepository] = await db
        .insert(repositories)
        .values({
            githubRepositoryId: repository.id,
            fullName: repository.full_name,
            defaultBranch: repository.default_branch,
        })
        .onConflictDoUpdate({
            target: repositories.githubRepositoryId,
            set: { 
                fullName: repository.full_name,
                defaultBranch: repository.default_branch,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (savedRepository == null) { 
        throw new Error("Failed to save repository")
    }

    const [savedWorkflowRun] = await db
        .insert(workflowRuns)
        .values({
            githubWorkflowRunId: workflowRun.id,
            repositoryId: savedRepository.id,
            workflowName: workflowRun.name,
            status: workflowRun.status,
            conclusion: workflowRun.conclusion,
            headSha: workflowRun.head_sha,
            headBranch: workflowRun.head_branch,
            runAttempt: workflowRun.run_attempt,
            startedAt: workflowRun.run_started_at
                ? new Date(workflowRun.run_started_at)
                : null,
            completedAt: new Date(workflowRun.updated_at),
        })
        .onConflictDoUpdate({
            target: workflowRuns.githubWorkflowRunId,
            set: { 
                workflowName: workflowRun.name,
                status: workflowRun.status,
                conclusion: workflowRun.conclusion,
                headSha: workflowRun.head_sha,
                headBranch: workflowRun.head_branch,
                runAttempt: workflowRun.run_attempt,
                startedAt: workflowRun.run_started_at
                    ? new Date(workflowRun.run_started_at)
                    : null,
                completedAt: new Date(workflowRun.updated_at),
            },
        })
        .returning();

    if (savedWorkflowRun == null) { 
        throw new Error("Failed to save workflow run");
    }

    return savedWorkflowRun;
}