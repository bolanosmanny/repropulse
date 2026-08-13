import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
    pullRequestFeedback,
    repositories,
} from "../db/schema.js";

type CreatePullRequestFeedbackInput = {
    githubRepositoryId: number;
    githubInstallationId: number;
    pullRequestNumber: number;
    headSha: string;
    repositoryFullName: string;
};

export async function createPullRequestFeedback(
    input: CreatePullRequestFeedbackInput
) {
    const [repository] = await db
        .insert(repositories)
        .values({
            githubRepositoryId: input.githubRepositoryId,
            fullName: input.repositoryFullName,
        })
        .onConflictDoUpdate({
            target: repositories.githubRepositoryId,
            set: {
                fullName: input.repositoryFullName,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (repository == null) {
        throw new Error("Failed to save pull request repository");
    }

    const [feedback] = await db
        .insert(pullRequestFeedback)
        .values({
            repositoryId: repository.id,
            githubInstallationId: input.githubInstallationId,
            pullRequestNumber: input.pullRequestNumber,
            headSha: input.headSha,
        })
        .onConflictDoNothing()
        .returning();

    return feedback ?? null;
}

export async function claimPendingPullRequestFeedback(
    feedbackId: number
) {
    const [feedback] = await db
        .update(pullRequestFeedback)
        .set({
            status: "processing",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(pullRequestFeedback.id, feedbackId),
                eq(pullRequestFeedback.status, "pending")
            )
        )
        .returning();

    return feedback ?? null;
}

export async function markPullRequestFeedbackNoRisk(
    feedbackId: number
) {
    await db
        .update(pullRequestFeedback)
        .set({
            status: "no-risk",
            riskCount: 0,
            updatedAt: new Date(),
        })
        .where(eq(pullRequestFeedback.id, feedbackId));
}

export async function markPullRequestFeedbackCommented(input: {
    feedbackId: number;
    riskCount: number;
    githubCommentId: number;
}) {
    await db
        .update(pullRequestFeedback)
        .set({
            status: "commented",
            riskCount: input.riskCount,
            githubCommentId: input.githubCommentId,
            updatedAt: new Date(),
        })
        .where(eq(pullRequestFeedback.id, input.feedbackId));
}

export async function releasePullRequestFeedbackClaim(
    feedbackId: number
) {
    await db
        .update(pullRequestFeedback)
        .set({
            status: "pending",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(pullRequestFeedback.id, feedbackId),
                eq(pullRequestFeedback.status, "processing")
            )
        );
}

