import { describe, expect, it } from "vitest";
import type { TestFlakeScore } from "../scoring/flake-score-repository.js";
import {
    findPullRequestFlakeRisks,
} from "./flake-risk-evaluator.js";

function makeScore(
    overrides: Partial<TestFlakeScore> = {}
): TestFlakeScore {
    return {
        testDefinitionId: 1,
        suiteName: "authentication",
        className: "auth.tokens",
        testName: "rejects expired token",
        sourceFile: "src/auth/tokens.test.ts",
        flakeScore: {
            completedAttempts: 2,
            transientFailures: 1,
            rerunResolvedCommits: 1,
            scorePercent: 50,
        },
        ...overrides,
    };
}

describe("findPullRequestFlakeRisks", () => {
    it("returns a confirmed high-risk test in a changed file", () => {
        const risks = findPullRequestFlakeRisks(
            ["./src/auth/tokens.test.ts", "src/app.ts"],
            [makeScore()]
        );

        expect(risks).toEqual([
            {
                testDefinitionId: 1,
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "rejects expired token",
                sourceFile: "src/auth/tokens.test.ts",
                scorePercent: 50,
                transientFailures: 1,
                rerunResolvedCommits: 1,
            },
        ]);
    });

    it("ignores unmatched, low-score, and unconfirmed tests", () => {
        const risks = findPullRequestFlakeRisks(
            ["src/auth/tokens.test.ts"],
            [
                makeScore({
                    testDefinitionId: 2,
                    flakeScore: {
                        completedAttempts: 3,
                        transientFailures: 1,
                        rerunResolvedCommits: 1,
                        scorePercent: 33.33,
                    },
                }),
                makeScore({
                    testDefinitionId: 3,
                    flakeScore: {
                        completedAttempts: 2,
                        transientFailures: 1,
                        rerunResolvedCommits: 0,
                        scorePercent: 50,
                    },
                }),
                makeScore({
                    testDefinitionId: 4,
                    sourceFile: "src/payments/charge.test.ts",
                }),
            ]
        );

        expect(risks).toEqual([]);
    });
});