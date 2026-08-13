import type { TestFlakeScore } from "../scoring/flake-score-repository.js";

export const HIGH_FLAKE_SCORE_PERCENT = 50;

export type PullRequestFlakeRisk = { 
    testDefinitionId: number,
    suiteName: string;
    className: string;
    testName: string;
    sourceFile: string;
    scorePercent: number;
    transientFailures: number;
    rerunResolvedCommits: number;
};

function normalizePath(path: string): string { 
    return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function findPullRequestFlakeRisks(
    changedFiles: string[],
    flakeScores: TestFlakeScore[]
) : PullRequestFlakeRisk[] { 
    const changedFileSet = new Set(
        changedFiles.map(normalizePath)
    );

    return flakeScores
        .filter((test) => {
            const score = test.flakeScore;

            return (
                test.sourceFile != null &&
                changedFileSet.has(normalizePath(test.sourceFile)) &&
                score.scorePercent >= HIGH_FLAKE_SCORE_PERCENT &&
                score.rerunResolvedCommits > 0
            );
        })
        .map((test) => ({
            testDefinitionId: test.testDefinitionId,
            suiteName: test.suiteName,
            className: test.className,
            testName: test.testName,
            sourceFile: test.sourceFile as string,
            scorePercent: test.flakeScore.scorePercent,
            transientFailures: test.flakeScore.transientFailures,
            rerunResolvedCommits: test.flakeScore.rerunResolvedCommits
        }));
}