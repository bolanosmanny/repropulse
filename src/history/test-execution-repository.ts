import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
    testDefinitions,
    testExecutions,
    workflowRuns,
} from "../db/schema.js";

type ListTestExecutionsOptions = { 
    limit: number;
    testDefinitionId?: number;
};

export async function listTestExecutionsForRepository(
    repositoryId: number,
    options: ListTestExecutionsOptions
) {
     const filters = [
        eq(testDefinitions.repositoryId, repositoryId),
     ];

     if (options.testDefinitionId != null) {
        filters.push(
            eq(testExecutions.testDefinitionId, options.testDefinitionId)
        );
     }

     return db
        .select({
            testDefinitionId: testDefinitions.id,
            suiteName: testDefinitions.suiteName,
            className: testDefinitions.className,
            testName: testDefinitions.testName,
            outcome: testExecutions.outcome,
            durationMs: testExecutions.durationMs,
            failureType: testExecutions.failureType,
            failureMessage: testExecutions.failureMessage,
            githubWorkflowRunId: workflowRuns.id,
            workflowName: workflowRuns.workflowName,
            headSha: workflowRuns.headSha,
            headBranch: workflowRuns.headBranch,
            runAttempt: workflowRuns.runAttempt,
            completedAt: workflowRuns.completedAt,
        })
        .from(testExecutions)
        .innerJoin(
            testDefinitions,
            eq(testDefinitions.id, testExecutions.testDefinitionId)
        )
        .innerJoin(
            workflowRuns,
            eq(workflowRuns.id, testExecutions.workflowRunId)
        )
        .where(and(...filters))
        .orderBy(desc(workflowRuns.completedAt), desc(testExecutions.id))
        .limit(options.limit);
}

