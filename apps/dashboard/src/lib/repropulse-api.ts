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