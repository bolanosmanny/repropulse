import { describe, expect, it } from "vitest";
import {
    parsePullRequestWebhookPayload,
    shouldEvaluatePullRequest,
} from "./pull-request-payload.js";

describe("parsePullRequestWebhookPayload", () => {
    it("accepts a pull request synchronize payload", () => {
        const payload = parsePullRequestWebhookPayload({
            action: "synchronize",
            number: 42,
            installation: {
                id: 9001,
            },
            repository: {
                id: 1001,
                full_name: "emanuel-bolanos/repropulse",
            },
            pull_request: {
                head: {
                    sha: "abc123def456",
                },
                base: {
                    ref: "main",
                },
            },
        });

        expect(payload.number).toBe(42);
        expect(payload.installation.id).toBe(9001);
        expect(payload.repository.full_name).toBe(
            "emanuel-bolanos/repropulse"
        );
    });

    it("identifies actions ReproPulse does not evaluate", () => {
        expect(
            shouldEvaluatePullRequest(
                parsePullRequestWebhookPayload({
                    action: "closed",
                    number: 42,
                    installation: { id: 9001 },
                    repository: {
                        id: 1001,
                        full_name: "emanuel-bolanos/repropulse",
                    },
                    pull_request: {
                        head: { sha: "abc123def456" },
                        base: { ref: "main" },
                    },
                })
            )
        ).toEqual(false);
    });
});
