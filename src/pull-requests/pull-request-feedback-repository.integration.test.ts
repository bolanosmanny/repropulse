import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
    pullRequestFeedback,
    repositories,
} from "../db/schema.js";
import {
    createPullRequestFeedback,
} from "./pull-request-feedback-repository.js";

const githubRepositoryId = 987654321;
const pullRequestNumber = 42;
const headSha = "abcdef1234567890abcdef1234567890abcdef12";

beforeAll(async () => {
    await db
        .insert(repositories)
        .values({
            githubRepositoryId,
            fullName: "repropulse-test/feedback-fixture",
            defaultBranch: "main",
        })
        .onConflictDoNothing();
});

afterAll(async () => {
    const [repository] = await db
        .select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.githubRepositoryId, githubRepositoryId))
        .limit(1);

    if (repository != null) {
        await db
            .delete(pullRequestFeedback)
            .where(eq(pullRequestFeedback.repositoryId, repository.id))

        await db
            .delete(repositories)
            .where(eq(repositories.id, repository.id));
    }
});

describe("createPullRequestFeedback", () => {
    it("creates one record and ignores a duplicate PR commit", async () => {
        const input = {
            githubRepositoryId,
            githubInstallationId: 123456,
            pullRequestNumber,
            headSha,
            repositoryFullName: "repropulse-test/feedback-fixture",
        };
        
        const first = await createPullRequestFeedback(input);
        const duplicate = await createPullRequestFeedback(input);

        expect(first).not.toBeNull();
        expect(duplicate).toBeNull();
        expect(first?.riskCount).toBe(0);
        expect(first?.status).toBe("pending");
    });
});

