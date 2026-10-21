import { randomInt } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import {
  repositories,
  testDefinitions,
  testExecutions,
  workflowRuns,
} from "../db/schema.js";
import { getFlakeScoresForRepository } from "../scoring/flake-score-repository.js";
import { upsertWorkflowRun } from "../workflows/workflow-run-repository.js";
import { parseJUnitXml } from "./junit-parser.js";
import { storeTestReport } from "./test-report-repository.js";

const githubRepositoryId = randomInt(1_000_000_000, 2_000_000_000);
const githubWorkflowRunId = randomInt(1_000_000_000, 2_000_000_000);
const repositoryFullName = `integration/rerun-${githubRepositoryId}`;
const headSha = "controlled-rerun-same-commit";

function workflowPayload(runAttempt: number) {
  return {
    repository: {
      id: githubRepositoryId,
      full_name: repositoryFullName,
      default_branch: "main",
    },
    workflow_run: {
      id: githubWorkflowRunId,
      name: "Controlled flake validation",
      status: "completed",
      conclusion: runAttempt === 1 ? "failure" : "success",
      head_sha: headSha,
      head_branch: "main",
      run_attempt: runAttempt,
      run_started_at: null,
      updated_at: new Date().toISOString(),
    },
  };
}

function junitReport(failed: boolean) {
  return parseJUnitXml([
    '<testsuite name="controlled-rerun">',
    '  <testcase classname="controlled.ci" name="recovers on rerun" file="scripts/controlled-flake-test.mjs" time="0.001">',
    ...(failed ? ['    <failure type="AssertionError">Controlled failure</failure>'] : []),
    "  </testcase>",
    "</testsuite>",
  ].join("\n"));
}

afterAll(async () => {
  const [repository] = await db
    .select({ id: repositories.id })
    .from(repositories)
    .where(eq(repositories.githubRepositoryId, githubRepositoryId));

  if (repository == null) return;
  const runs = await db
    .select({ id: workflowRuns.id })
    .from(workflowRuns)
    .where(eq(workflowRuns.repositoryId, repository.id));
  if (runs.length > 0) {
    await db.delete(testExecutions).where(inArray(testExecutions.workflowRunId, runs.map((run) => run.id)));
  }
  await db.delete(testDefinitions).where(eq(testDefinitions.repositoryId, repository.id));
  await db.delete(workflowRuns).where(eq(workflowRuns.repositoryId, repository.id));
  await db.delete(repositories).where(eq(repositories.id, repository.id));
});

describe("same-commit rerun ingestion", () => {
  it("preserves both attempts and detects the recovered failure", async () => {
    const first = await upsertWorkflowRun(workflowPayload(1));
    await storeTestReport(githubWorkflowRunId, 1, junitReport(true));

    const second = await upsertWorkflowRun(workflowPayload(2));
    await storeTestReport(githubWorkflowRunId, 2, junitReport(false));
    await storeTestReport(githubWorkflowRunId, 2, junitReport(false));

    expect(second.id).not.toBe(first.id);
    const runs = await db
      .select({ runAttempt: workflowRuns.runAttempt })
      .from(workflowRuns)
      .where(eq(workflowRuns.githubWorkflowRunId, githubWorkflowRunId));
    expect(runs.map((run) => run.runAttempt).sort()).toEqual([1, 2]);

    const [repository] = await db
      .select({ id: repositories.id })
      .from(repositories)
      .where(eq(repositories.githubRepositoryId, githubRepositoryId));
    expect(repository).toBeDefined();
    const scores = await getFlakeScoresForRepository(repository!.id);
    expect(scores).toHaveLength(1);
    expect(scores[0]?.sourceFile).toBe("scripts/controlled-flake-test.mjs");
    expect(scores[0]?.flakeScore).toEqual({
      completedAttempts: 2,
      transientFailures: 1,
      rerunResolvedCommits: 1,
      scorePercent: 50,
    });
  });
});
