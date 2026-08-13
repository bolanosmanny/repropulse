import { eq } from "drizzle-orm";
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
