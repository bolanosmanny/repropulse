import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { 
    testDefinitions,
    testExecutions,
    workflowRuns,
} from "../db/schema.js";
import type { ParsedJUnitTest } from "../ingestion/junit-parser.js";

export async function storeTestReport(
    githubWorkflowRunId: number,
    parsedTests: ParsedJUnitTest[]
): Promise<{ storedTestCount: number }> { 
    const [workflowRun] = await db
        .select({
            id: workflowRuns.id,
            repositoriesId: workflowRuns.repositoryId,
        })
        .from(workflowRuns)
        .where(
            eq(workflowRuns.githubWorkflowRunId, githubWorkflowRunId)
        )
        .limit(1);

    if (workflowRun == null) { 
        throw new Error(
            `Workflow run ${githubWorkflowRunId} was not found`
        );
    }

    await db.transaction(async (transaction) => { 
        for (const parsedTest of parsedTests) { 
            const [testDefinition] = await transaction
                .insert(testDefinitions)
                .values({
                    repositoryId: workflowRun.repositoriesId,
                    suiteName: parsedTest.suiteName,
                    className: parsedTest.className,
                    testName: parsedTest.testName,
                    sourceFile: parsedTest.sourceFile,
                })
                .onConflictDoUpdate({
                    target: [
                        testDefinitions.repositoryId,
                        testDefinitions.suiteName,
                        testDefinitions.className,
                        testDefinitions.testName,
                    ],
                    set: { 
                        ...(parsedTest.sourceFile == null
                            ? {}
                            : { sourceFile: parsedTest.sourceFile }),
                        updatedAt: new Date(),
                    },
                })
                .returning();

            if ( testDefinition == null) { 
                throw new Error("Failed to save test definition");
            }

            await transaction
                .insert(testExecutions)
                .values({
                    workflowRunId: workflowRun.id,
                    testDefinitionId: testDefinition.id,
                    outcome: parsedTest.outcome,
                    durationMs: parsedTest.durationMs,
                    failureType: parsedTest.failureType,
                    failureMessage: parsedTest.failureMessage,
                })
                .onConflictDoUpdate({
                    target: [
                        testExecutions.workflowRunId,
                        testExecutions.testDefinitionId,
                    ],
                    set: {
                        outcome: parsedTest.outcome,
                        durationMs: parsedTest.durationMs,
                        failureType: parsedTest.failureType,
                        failureMessage: parsedTest.failureMessage,
                    },
                });
        }
    });

    return { 
        storedTestCount: parsedTests.length,
    };
}