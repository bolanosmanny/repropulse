import { describe, expect, it } from "vitest";
import { calculateFlakeScore } from "./flake-score.js";

describe("calculateFlakeScore", () => {
    it("detects a failure that passes on a rerun of the same commit", () => {
        const score = calculateFlakeScore([
            {
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "failed",
            },
            {
                headSha: "commit-a",
                runAttempt: 2,
                outcome: "passed",
            },
        ]);

        expect(score).toEqual({
            completedAttempts: 2,
            transientFailures: 1,
            rerunResolvedCommits: 1,
            scorePercent: 50,
        });
    });

    it("does not classify a permanent failure as flaky", () => {
        const score = calculateFlakeScore([
            {
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "failed",
            },
            {
                headSha: "commit-b",
                runAttempt: 1,
                outcome: "failed",
            },
        ]);

        expect(score).toEqual({
            completedAttempts: 2,
            transientFailures: 0,
            rerunResolvedCommits: 0,
            scorePercent: 0,
        });
    });

    it("ignores skipped tests and does not treat pass-then-fail as a rerun recovery", () => {
        const score = calculateFlakeScore([
            {
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "skipped",
            },
            {
                headSha: "commit-b",
                runAttempt: 1,
                outcome: "passed",
            },
            {
                headSha: "commit-b",
                runAttempt: 2,
                outcome: "failed",
            },
        ]);

        expect(score).toEqual({
            completedAttempts: 2,
            transientFailures: 0,
            rerunResolvedCommits: 0,
            scorePercent: 0,
        });
    });
});