import {
    findPullRequestFlakeRisks,
    type PullRequestFlakeRisk,
} from "./flake-risk-evaluator.js";
import { formatFlakeRiskComment } from "./flake-risk-comment.js";
import { TestFlakeScore } from "../scoring/flake-score-repository.js";

export type PullRequestGitHubClient = {
    listChangedFiles(input: {
        owner: string;
        repo: string;
        pullRequestNumber: number;
    }): Promise<string[]>;
    findExistingReproPulseComment(input: {
        owner: string;
        repo: string;
        pullRequestNumber: number;
    }): Promise<{ commentId: number } | null>;
    createComment(input: {
        owner: string;
        repo: string;
        pullRequestNumber: number;
        body: string;
    }): Promise<{ commentId: number }>;
};

export type PullRequestFeedbackResult = 
    | {
        status: "no_risk";
        riskCount: 0;
    }
    | {
        status: "commented";
        riskCount: number;
        commentId: number;
        risks: PullRequestFlakeRisk[];
    };

export async function evaluatePullRequestFeedback(input: {
    githubClient: PullRequestGitHubClient;
    flakeScores: TestFlakeScore[];
    owner: string;
    repo: string;
    pullRequestNumber: number;
}): Promise<PullRequestFeedbackResult> {
    const changedFiles = await input.githubClient.listChangedFiles({
        owner: input.owner,
        repo: input.repo,
        pullRequestNumber: input.pullRequestNumber,
    });

    const risks = findPullRequestFlakeRisks(
        changedFiles, 
        input.flakeScores
    );

    if (risks.length === 0) {
        return {
            status: "no_risk",
            riskCount: 0,
        };
    }

    const existingComment =
        await input.githubClient.findExistingReproPulseComment({
            owner: input.owner,
            repo: input.repo,
            pullRequestNumber: input.pullRequestNumber,
        });
    
    if (existingComment != null) {
        return {
            status: "commented",
            riskCount: risks.length,
            commentId: existingComment.commentId,
            risks,
        };
    }

    const comment = await input.githubClient.createComment({
        owner: input.owner,
        repo: input.repo,
        pullRequestNumber: input.pullRequestNumber,
        body: formatFlakeRiskComment(risks),
    });

    return { 
        status: "commented",
        riskCount: risks.length,
        commentId: comment.commentId,
        risks,
    };
}
