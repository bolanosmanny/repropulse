import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { githubInstallations } from "../db/schema.js";

type UpsertInstallationInput = {
    githubInstallationId: number;
    accountLogin: string;
    accountType: string;
    isActive: boolean;
    suspendedAt: Date | null;
};

export async function upsertGitHubInstallation(
    input: UpsertInstallationInput
) {
    const [installation] = await db
        .insert(githubInstallations)
        .values(input)
        .onConflictDoUpdate({
            target: githubInstallations.githubInstallationId,
            set: { 
                accountLogin: input.accountLogin,
                accountType: input.accountType,
                isActive: input.isActive,
                suspendedAt: input.suspendedAt,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (installation == null) {
        throw new Error("Failed to save GitHub App installation");
    }

    return installation;
}

export async function findActiveGitHubInstallation(
    githubInstallationId: number
) {
    const [installation] = await db
        .select()
        .from(githubInstallations)
        .where(
            eq(
                githubInstallations.githubInstallationId,
                githubInstallationId
            )
        )
        .limit(1);
    
    if (installation == null || !installation.isActive) {
        return null;
    }
    
    return installation;
}