import { describe, expect, it } from "vitest";
import { calculateFlakeScore } from "./flake-score.js";

describe("calculateFlakeScore", () => {
    it("detects a failure that passes on a rerun of the same commit", () => {
        const score = calculateFlakeScore([
            {
                githubWorkflowRunId: 10,
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "failed",
            },
            {
                githubWorkflowRunId: 10,
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
                githubWorkflowRunId: 11,
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "failed",
            },
            {
                githubWorkflowRunId: 12,
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
                githubWorkflowRunId: 13,
                headSha: "commit-a",
                runAttempt: 1,
                outcome: "skipped",
            },
            {
                githubWorkflowRunId: 14,
                headSha: "commit-b",
                runAttempt: 1,
                outcome: "passed",
            },
            {
                githubWorkflowRunId: 14,
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

    it("does not confuse separate runs on one commit with a rerun", () => {
        expect(calculateFlakeScore([
            { githubWorkflowRunId: 20, headSha: "commit-a", runAttempt: 1, outcome: "failed" },
            { githubWorkflowRunId: 21, headSha: "commit-a", runAttempt: 1, outcome: "passed" },
        ])).toEqual({
            completedAttempts: 2,
            transientFailures: 0,
            rerunResolvedCommits: 0,
            scorePercent: 0,
        });
    });

    it("does not count a later attempt if its commit changed", () => {
        expect(calculateFlakeScore([
            { githubWorkflowRunId: 22, headSha: "commit-a", runAttempt: 1, outcome: "failed" },
            { githubWorkflowRunId: 22, headSha: "commit-b", runAttempt: 2, outcome: "passed" },
        ])).toEqual({
            completedAttempts: 2,
            transientFailures: 0,
            rerunResolvedCommits: 0,
            scorePercent: 0,
        });
    });
});
