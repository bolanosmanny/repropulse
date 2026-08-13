import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { repositories } from "../db/schema.js";

export async function listRepositories() {
  return db
    .select({
      id: repositories.id,
      fullName: repositories.fullName,
      defaultBranch: repositories.defaultBranch,
    })
    .from(repositories)
    .orderBy(asc(repositories.fullName));
}