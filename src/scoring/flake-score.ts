export type TestOutcome = "passed" | "failed" | "error" | "skipped";

export type ScorableTestExecution = {
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
    const executionsByCommit = new Map<string, ScorableTestExecution[]>();

    for (const execution of executions) {
        const commitExecutions =
            executionsByCommit.get(execution.headSha) ?? [];

        commitExecutions.push(execution);
        executionsByCommit.set(execution.headSha, commitExecutions);
    }

    let completedAttempts = 0;
    let transientFailures = 0;
    let rerunResolvedCommits = 0;

    for (const commitExecutions of executionsByCommit.values()) {
        const orderedExecutions = [...commitExecutions].sort(
            (left, right) => left.runAttempt - right.runAttempt
        );

        completedAttempts += orderedExecutions.filter((execution) =>
            isCompletedAttempt(execution.outcome)
        ).length;

        let resolvedFailureExists = false;

        for (const [index, execution] of orderedExecutions.entries()) {

            if (!isFailure(execution.outcome)) {
                continue;
            }

            const passesLaterOnSameCommit = orderedExecutions
                .slice(index + 1)
                .some((laterExecution) => laterExecution.outcome === "passed");

            if (passesLaterOnSameCommit) {
                transientFailures += 1;
                resolvedFailureExists = true;
            }
        }

        if (resolvedFailureExists) {
            rerunResolvedCommits += 1;
        }
    }

    return {
        completedAttempts,
        transientFailures,
        rerunResolvedCommits,
        scorePercent:
            completedAttempts === 0
                ? 0
                : Number(
                      ((transientFailures / completedAttempts) * 100).toFixed(2)
                  ),
    };
}