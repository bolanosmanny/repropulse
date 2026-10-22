import { describe, expect, it } from "vitest";
import {
  githubRunAttemptUrl,
  workflowPayloadFromGitHubRun,
} from "./archive-import.js";

const run = {
  id: 123,
  name: "Verify Stratos",
  status: "completed",
  conclusion: "success",
  head_sha: "abc123",
  head_branch: "main",
  run_attempt: 2,
  run_started_at: "2026-10-20T12:00:00Z",
  updated_at: "2026-10-20T12:01:00Z",
  repository: {
    id: 55,
    full_name: "bolanosmanny/stratos",
    default_branch: "main",
  },
};

describe("JUnit archive import metadata", () => {
  it("constructs the GitHub run-attempt URL", () => {
    expect(githubRunAttemptUrl("bolanosmanny/stratos", 123, 2)).toBe(
      "https://api.github.com/repos/bolanosmanny/stratos/actions/runs/123/attempts/2"
    );
  });

  it("accepts a matching completed attempt", () => {
    expect(workflowPayloadFromGitHubRun(run, "bolanosmanny/stratos", 123, 2)
      .workflow_run.run_attempt).toBe(2);
    const withoutBranch = {
      ...run,
      repository: { id: 55, full_name: "bolanosmanny/stratos" },
    };
    expect(workflowPayloadFromGitHubRun(withoutBranch, "bolanosmanny/stratos", 123, 2)
      .repository.default_branch).toBeNull();
  });

  it("rejects a different attempt or repository", () => {
    expect(() => workflowPayloadFromGitHubRun(run, "bolanosmanny/stratos", 123, 1)).toThrow();
    expect(() => workflowPayloadFromGitHubRun(run, "bolanosmanny/repropulse", 123, 2)).toThrow();
  });
});
