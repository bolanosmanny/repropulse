export type FlakeScore = {
    completedAttempts: number;
    transientFailures: number;
    rerunResolvedCommits: number;
    scorePercent: number;
};

export type FlakeScoreItem = { 
    testDefinitionId: string;
    suiteName: string;
    className: string;
    testName: string;
    flakeScore: FlakeScore;
};

export type WorkflowRun = { 
    githubWorkflowRunId: number;
    workflowName: string;
    status: string;
    conclusion: string | null;
    headSha: string;
    headBranch: string | null;
    runAttempt: number;
    startedAt: string | null;
    completedAt: string | null;
};

export type TestExecution = {
    testDefinitionId: string;
    suiteName: string;
    className: string;
    testName: string;
    outcome: "passed" | "failed" | "error" | "skipped";
    durationMs: number | null;
    failureType: string | null;
    failureMessage: string | null;
    githubWorkflowRunId: number;
    workflowName: string;
    headSha: string;
    headBranch: string | null;
    runAttempt: number;
    completedAt: string | null;
}

export type QueueJobCounts = { 
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
};

export type FailedQueueJob = { 
    id: string | undefined;
    name: string;
    attemptsMade: number;
    failedReason: string | undefined;
    timestamp: number;
};

export type IngestionQueueStatus = { 
    queueName: string;
    counts: QueueJobCounts;
    failedJobs: FailedQueueJob[];
};

export type DeadLetterJob = {
    id: string | undefined;
    sourceQueue: "webhook-deliveries" | "test-report-ingestion";
    sourceJobId: string | undefined;
    jobName: string;
    attemptsMade: number;
    failedReason: string;
    failedAt: string;
}

export type ReliabilityMetrics = {
    repositoryId: number;
    workflowRunCount: number;
    testExecutionsStored: number;
    flakyTestsDetected: number;
    estimatedCiTimeWastedMs: number;
    failureTrend : {
        date: string;
        passed: number;
        failed: number;
        skipped: number;
    }[];
    webhookProcessing: {
        processed: number;
        failed: number;
        successRatePercent: number | null;
        p95LatencyMs: number | null;
    };
};

const apiBaseUrl = 
    process.env.REPROPULSE_API_URL ?? "http://localhost:3001";

async function getJson<T>(path: string): Promise<T> { 
    const response = await fetch(`${apiBaseUrl}${path}`, {
        cache: "no-store",
    });

    if (!response.ok) { 
        throw new Error(`ReproPulse API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export async function getDashboardData(repositoryId: number) { 
    const [flakeScoreResponse, workflowRunsResponse] = await Promise.all([
        getJson<{ repositoryId: number; scores: FlakeScoreItem[] }>(
            `/api/v1/repositories/${repositoryId}/flake-scores`
        ),
        getJson<{ repositoryId: number; workflowRuns: WorkflowRun[] }>(
            `/api/v1/repositories/${repositoryId}/workflow-runs`
        ),
    ]);

    return { 
        scores: flakeScoreResponse.scores,
        workflowRuns: workflowRunsResponse.workflowRuns,
    }
}

export async function getTestExecutions(repositoryId: number) { 
    const response = await getJson<{
        repositoryId: number;
        executions: TestExecution[];
    }>(`/api/v1/repositories/${repositoryId}/test-executions?limit=100`);
    
    return response.executions;
}

export async function getIngestionQueueStatus() { 
    return getJson<{
        queues: IngestionQueueStatus[];
        deadLetterJobs: DeadLetterJob[];   
    }>("/api/v1/operations/ingestion-jobs");
}

export async function getReliabilityMetrics(repositoryId: number) {
    return getJson<ReliabilityMetrics>(
        `/api/v1/repositories/${repositoryId}/reliability-metrics`
    );
}
