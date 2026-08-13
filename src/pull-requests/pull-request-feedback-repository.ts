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
};

export async function createPullRequestFeedback(
    input: CreatePullRequestFeedbackInput
) {
    const [repository] = await db
        .select({ id: repositories.id })
        .from(repositories)
        .where(
            eq(
                repositories.githubRepositoryId,
                input.githubRepositoryId
            )
        )
        .limit(1);
    
    if (repository == null) {
        throw new Error(
            `Repository ${input.githubRepositoryId} is not tracked by ReproPulse.`
        );
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
