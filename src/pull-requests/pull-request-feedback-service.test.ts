import { describe, expect, it, vi } from "vitest";
import type { TestFlakeScore } from "../scoring/flake-score-repository.js";
import {
    evaluatePullRequestFeedback,
    type PullRequestGitHubClient,
} from "./pull-request-feedback-service.js";

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

function makeGitHubClient(
    changedFiles: string[]
): PullRequestGitHubClient {
    return {
        listChangedFiles: vi.fn().mockResolvedValue(changedFiles),
        createComment: vi.fn().mockResolvedValue({ commentId: 99 }),
        findExistingReproPulseComment: vi.fn().mockResolvedValue(null),
    };
}

const input = {
    owner: "emanuel-bolanos",
    repo: "repropulse",
    pullRequestNumber: 42,
};

describe("evaluatePullRequestFeedback", () => {
    it("posts one evidence-based comment for changed high-risk tests", async () => {
        const githubClient = makeGitHubClient([
            "src/auth/tokens.test.ts",
        ]);

        const result = await evaluatePullRequestFeedback({
            ...input,
            githubClient,
            flakeScores: [makeScore()],
        });

        expect(result.status).toBe("commented");
        expect(result.riskCount).toBe(1);
        expect(githubClient.createComment).toHaveBeenCalledOnce();
        expect(githubClient.createComment).toHaveBeenCalledWith(
            expect.objectContaining({
                owner: "emanuel-bolanos",
                repo: "repropulse",
                pullRequestNumber: 42,
                body: expect.stringContaining(
                    "flaky-test risk detected"
                ),
            })
        );
    });

    it("does not comment when changed files have no confirmed flake risk", async () => {
        const githubClient = makeGitHubClient(["src/app.ts"]);

        const result = await evaluatePullRequestFeedback({
            ...input,
            githubClient,
            flakeScores: [makeScore()],
        });

        expect(result).toEqual({
            status: "no_risk",
            riskCount: 0,
        });
        expect(githubClient.createComment).not.toHaveBeenCalled();
    });
});