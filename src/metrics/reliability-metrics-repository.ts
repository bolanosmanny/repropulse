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

export async function getReliabilityMetrics(repositoryId: number) { 
    const [
        [workflowRunCount],
        [testExecutionCount],
        [processedWebhookCount],
        [failedWebhookCount],
        latencyRows,
        flakeScores,
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
    ]);

    const processsedWebhooks = processedWebhookCount?.value ?? 0;
    const failedWebhooks = failedWebhookCount?.value ?? 0;
    const completedWebhookDeliveries = processsedWebhooks + failedWebhooks;

    const latencies = latencyRows
        .map((row) => row.latencyMs)
        .filter((latency): latency is number => Number.isFinite(latency));

    return { 
        repositoryId,
        workflowRunCount: workflowRunCount?.value ?? 0,
        testExecutionsStored: testExecutionCount?.value ?? 0,
        flakyTestsDetected: flakeScores.filter(
            (score) => score.flakeScore.rerunResolvedCommits > 0
        ).length,
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
