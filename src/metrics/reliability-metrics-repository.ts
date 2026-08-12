import { count, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  testDefinitions,
  testExecutions,
  webhookDeliveries,
  workflowRuns,
} from "../db/schema.js";
import { getFlakeScoresForRepository } from "../scoring/flake-score-repository.js";

function percentile95(values: number[]) {
    if (values.length === 0) { 
        return null;
    }

    const sortedValues = [...values].sort((left, right) => left - right);
    const index = Math.ceil(sortedValues.length * 0.95) -1;

    return sortedValues[index] ?? null;
}

function isFailure(outcome: string) { 
    return outcome === "failed" || outcome === "error";
}

export async function getReliabilityMetrics(repositoryId: number) { 
    const [
        [workflowRunCount],
        [testExecutionCount],
        [processedWebhookCount],
        [failedWebhookCount],
        latencyRows,
        flakeScores,
        executionRows,
    ] = await Promise.all([
        db
            .select({ value: count() })
            .from(workflowRuns)
            .where(eq(workflowRuns.repositoryId, repositoryId)),

        db
            .select({ value: count() })
            .from(testExecutions)
            .innerJoin(
                testDefinitions,
                eq(testDefinitions.id, testExecutions.testDefinitionId)
            )
            .where(eq(testDefinitions.repositoryId, repositoryId)),

        db
            .select({ value: count() })
            .from(webhookDeliveries)
            .where(eq(webhookDeliveries.status, "processed")),

        db
            .select({ value: count() })
            .from(webhookDeliveries)
            .where(eq(webhookDeliveries.status, "failed")),

        db
            .select({
                latencyMs: sql<number>`
                    extract(
                        epoch from (
                        ${webhookDeliveries.processedAt} - ${webhookDeliveries.receivedAt}
                        )
                    ) * 1000
                `.mapWith(Number),
            })
            .from(webhookDeliveries)
            .where(eq(webhookDeliveries.status, "processed")),
        
        getFlakeScoresForRepository(repositoryId),

        db
            .select({
                testDefinitionId: testDefinitions.id,
                outcome: testExecutions.outcome,
                durationMs: testExecutions.durationMs,
                headSha: workflowRuns.headSha,
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
            .where(eq(testDefinitions.repositoryId, repositoryId)),
    ]);

    const processsedWebhooks = processedWebhookCount?.value ?? 0;
    const failedWebhooks = failedWebhookCount?.value ?? 0;
    const completedWebhookDeliveries = processsedWebhooks + failedWebhooks;

    const latencies = latencyRows
        .map((row) => row.latencyMs)
        .filter((latency): latency is number => Number.isFinite(latency));

    const executionsByTest = new Map<
        number,
        {
            headSha: string;
            runAttempt: number;
            outcome: string;
            durationMs: number | null;
        }[]
    >();

    const failureTrendByDate = new Map<
        string,
        {
            date: string;
            passed: number;
            failed: number;
            skipped: number;
        }
    >();

    for (const execution of executionRows) {
        const testExecutions = 
            executionsByTest.get(execution.testDefinitionId) ?? [];

        testExecutions.push({
            headSha: execution.headSha,
            runAttempt: execution.runAttempt,
            outcome: execution.outcome,
            durationMs: execution.durationMs,
        });

        executionsByTest.set(execution.testDefinitionId, testExecutions);

        if (execution.completedAt != null) {
            const date = execution.completedAt.toISOString().slice(0, 10);

            const trend = failureTrendByDate.get(date) ?? {
                date,
                passed: 0,
                failed: 0,
                skipped: 0,
            };

            if (execution.outcome === "passed") { 
                trend.passed += 1;   
            } else if (isFailure(execution.outcome)) {
                trend.failed += 1;
            } else {
                trend.skipped += 1;
            }

            failureTrendByDate.set(date, trend);
        }
    }

    let estimatedCiTimeWastedMs = 0;

    for (const testExecutions of executionsByTest.values()) { 
        const executionsByCommit = new Map<string, typeof testExecutions>();

        for (const execution of testExecutions) { 
            const commitExecutions = 
                executionsByCommit.get(execution.headSha) ?? [];

            commitExecutions.push(execution);
            executionsByCommit.set(execution.headSha, commitExecutions);
        }

        for (const commitExecutions of executionsByCommit.values()) { 
            const orderedExecutions = [...commitExecutions].sort(
                (left, right) => left.runAttempt - right.runAttempt
            );

            for (const [index, execution] of orderedExecutions.entries()) {
                const laterPassExists = orderedExecutions
                    .slice(index+1)
                    .some((laterExecution) => laterExecution.outcome === "passed");

                if (isFailure(execution.outcome) && laterPassExists) { 
                    estimatedCiTimeWastedMs += execution.durationMs ?? 0;
                }
            }
        }
    }

    const failureTrend = [...failureTrendByDate.values()].sort(
        (left, right) => left.date.localeCompare(right.date)
    );

    return { 
        repositoryId,
        workflowRunCount: workflowRunCount?.value ?? 0,
        testExecutionsStored: testExecutionCount?.value ?? 0,
        flakyTestsDetected: flakeScores.filter(
            (score) => score.flakeScore.rerunResolvedCommits > 0
        ).length,
        estimatedCiTimeWastedMs,
        failureTrend,
        webhookProcessing: { 
            processed: processsedWebhooks,
            failed: failedWebhooks,
            successRatePercent:
                completedWebhookDeliveries === 0
                ? null
                : Number(
                    ((processsedWebhooks / completedWebhookDeliveries) * 100).toFixed(2)
                ),
            p95LatencyMs: percentile95(latencies),
        },
    };
}
