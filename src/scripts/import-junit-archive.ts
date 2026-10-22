import { readFile } from "node:fs/promises";
import { parseJUnitXml } from "../ingestion/junit-parser.js";
import {
  githubRunAttemptUrl,
  workflowPayloadFromGitHubRun,
} from "../ingestion/archive-import.js";

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const repository = argument("--repository");
  const runId = Number(argument("--run-id"));
  const attempt = Number(argument("--attempt"));
  const reportPath = argument("--report");
  const dryRun = process.argv.includes("--dry-run");
  const url = githubRunAttemptUrl(repository, runId, attempt);
  const xml = await readFile(reportPath, "utf8");
  const tests = parseJUnitXml(xml);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ReproPulse-archive-import",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub workflow lookup failed with HTTP ${response.status}`);
  }
  const payload = workflowPayloadFromGitHubRun(
    await response.json(), repository, runId, attempt
  );

  if (dryRun) {
    console.log(JSON.stringify({ repository, runId, attempt, tests: tests.length, dryRun }));
    return;
  }

  // Import the authentic run metadata first: the existing report repository
  // intentionally refuses JUnit results without a matching workflow run.
  const { upsertWorkflowRun } = await import("../workflows/workflow-run-repository.js");
  const { storeTestReport } = await import("../ingestion/test-report-repository.js");
  const { pool } = await import("../db/client.js");
  try {
    await upsertWorkflowRun(payload);
    const result = await storeTestReport(runId, attempt, tests);
    console.log(JSON.stringify({ repository, runId, attempt, stored: result.storedTestCount }));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Archive import failed");
  process.exitCode = 1;
});
