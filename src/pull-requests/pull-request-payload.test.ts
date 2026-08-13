import { describe, expect, it } from "vitest";
import {
    parsePullRequestWebhookPayload,
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

    it("rejects pull request actions ReproPulse does not evaluate", () => {
        expect(() =>
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
        ).toThrow();
    });
});
