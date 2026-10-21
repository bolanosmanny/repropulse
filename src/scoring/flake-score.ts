export type TestOutcome = "passed" | "failed" | "error" | "skipped";

export type ScorableTestExecution = {
    githubWorkflowRunId: number;
    headSha: string;
    runAttempt: number;
    outcome: TestOutcome;
};

export type FlakeScore = {
    completedAttempts: number;
    transientFailures: number;
    rerunResolvedCommits: number;
    scorePercent: number;
};

function isFailure(outcome: TestOutcome): boolean {
    return outcome === "failed" || outcome === "error";
}

function isCompletedAttempt(outcome: TestOutcome): boolean {
    return outcome !== "skipped";
}

export function calculateFlakeScore(
    executions: ScorableTestExecution[]
): FlakeScore {
    const executionsByRun = new Map<number, ScorableTestExecution[]>();

    for (const execution of executions) {
        const runExecutions =
            executionsByRun.get(execution.githubWorkflowRunId) ?? [];

        runExecutions.push(execution);
        executionsByRun.set(execution.githubWorkflowRunId, runExecutions);
    }

    let completedAttempts = 0;
    let transientFailures = 0;
    const resolvedCommits = new Set<string>();

    for (const runExecutions of executionsByRun.values()) {
        const orderedExecutions = [...runExecutions].sort(
            (left, right) => left.runAttempt - right.runAttempt
        );

        completedAttempts += orderedExecutions.filter((execution) =>
            isCompletedAttempt(execution.outcome)
        ).length;

        for (const execution of orderedExecutions) {

            if (!isFailure(execution.outcome)) {
                continue;
            }

            if (orderedExecutions.some(
                (laterExecution) =>
                    laterExecution.outcome === "passed" &&
                    laterExecution.headSha === execution.headSha &&
                    laterExecution.runAttempt > execution.runAttempt
            )) {
                transientFailures += 1;
                resolvedCommits.add(execution.headSha);
            }
        }
    }

    return {
        completedAttempts,
        transientFailures,
        rerunResolvedCommits: resolvedCommits.size,
        scorePercent:
            completedAttempts === 0
                ? 0
                : Number(
                      ((transientFailures / completedAttempts) * 100).toFixed(2)
                  ),
    };
}
