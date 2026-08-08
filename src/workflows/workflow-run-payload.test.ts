import { describe, expect, it } from "vitest";
import { parseWorkflowRunWebhookPayload } from "./workflow-run-payload.js";

const validPayload = { 
    repository: { 
        id: 1000001,
        full_name: "emanuel-bolanos/repropulse-demo",
        default_branch: "main",
    },
    workflow_run: {
        id: 2000001,
        name: "Test Suite",
        status: "completed",
        conclusion: "success",
        head_sha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        head_branch: "main",
        run_attempt: 1,
        run_started_at: "2026-08-08T19:45:00Z",
        updated_at: "2026-08-08T19:47:30Z",
    },
};

describe("parseWorkflowRunWebhookPayload", () => { 
    it("accepts a valid workflow_run webhook payload", () => { 
        const result = parseWorkflowRunWebhookPayload(validPayload);

        expect(result.repository.full_name).toBe(
            "emanuel-bolanos/repropulse-demo"
        );
        expect(result.workflow_run.id).toBe(2000001);
        expect(result.workflow_run.conclusion).toBe("success");
    });

    it("rejects a payload missing a required workflow-run field", () => { 
        const invalidPayload = { 
            ...validPayload,
            workflow_run: {
                ...validPayload.workflow_run,
                head_sha: undefined,
            },
        };

        expect(() =>
            parseWorkflowRunWebhookPayload(invalidPayload)
        ).toThrow();
    });
});
