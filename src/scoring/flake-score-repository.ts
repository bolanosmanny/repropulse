import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { 
    testDefinitions,
    testExecutions,
    workflowRuns,
} from "../db/schema.js"
import {
    calculateFlakeScore,
    type FlakeScore,
    type TestOutcome,
} from "./flake-score.js";

export type TestFlakeScore = { 
    testDefinitionId: number;
    suiteName: string;
    className: string;
    testName: string;
    flakeScore: FlakeScore;
};

function toTestOutcome(outcome: string) : TestOutcome { 
    if ( 
        outcome === "passed" ||
        outcome === "failed" ||
        outcome === "error" || 
        outcome === "skipped"
    ) { 
        return outcome;
    }
    
    throw new Error(`Unsupported test outcome: ${outcome}`);
}

export async function getFlakeScoresForRepository(
    repositoryId: number
) : Promise<TestFlakeScore[]> {
    const rows = await db
        .select({
            testDefinitionId: testDefinitions.id,
            suiteName: testDefinitions.suiteName,
            className: testDefinitions.className,
            testName: testDefinitions.testName,
            headSha: workflowRuns.headSha,
            runAttempt: workflowRuns.runAttempt,
            outcome: testExecutions.outcome,
        })
        .from(testDefinitions)
        .innerJoin(
            testExecutions,
            eq(testExecutions.testDefinitionId, testDefinitions.id)
        )
        .innerJoin(
            workflowRuns,
            eq(workflowRuns.id, testExecutions.workflowRunId)
        )
        .where(eq(testDefinitions.repositoryId, repositoryId));

    const executionsByTest = new Map<
        number,
        {
            suiteName: string;
            className: string;
            testName: string;
            executions: {
                headSha: string;
                runAttempt: number;
                outcome: TestOutcome;
            }[];
        }
    >();

    for (const row of rows) { 
        const existingTest = executionsByTest.get(row.testDefinitionId);

        if (existingTest == null) { 
            executionsByTest.set(row.testDefinitionId, { 
                suiteName: row.suiteName,
                className: row.className,
                testName: row.testName,
                executions: [
                    {
                        headSha: row.headSha,
                        runAttempt: row.runAttempt,
                        outcome: toTestOutcome(row.outcome),
                    },
                ],
            });

            continue;
        }

        existingTest.executions.push({
            headSha: row.headSha,
            runAttempt: row.runAttempt,
            outcome: toTestOutcome(row.outcome),
        });
    }

    return [...executionsByTest.entries()]
        .map(([testDefinitionId, test]) => ({
            testDefinitionId,
            suiteName: test.suiteName,
            className: test.className,
            testName: test.testName,
            flakeScore: calculateFlakeScore(test.executions),
        }))
        .sort(
            (left, right) =>
                right.flakeScore.scorePercent - left.flakeScore.scorePercent
        );
}

