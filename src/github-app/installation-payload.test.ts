import { describe, expect, it } from "vitest";
import {
  parseInstallationWebhookPayload,
} from "./installation-payload.js";

describe("parseInstallationWebhookPayload", () => { 
    it("accepts an installation created payload", () => {
        const payload = parseInstallationWebhookPayload({
            action: "created",
            installation: { 
                id: 12345,
                suspended_at: null,
                account: {
                    login: "emanuel-bolanos",
                    type: "User",
                },
            },
        });

        expect(payload).toEqual({
            action: "created",
            installation: {
                id: 12345,
                suspended_at: null,
                account: {
                    login: "emanuel-bolanos",
                    type: "User",
                },
            },
        });
    });

    it("rejects an unsupported installation action", () => {
        expect(() =>
            parseInstallationWebhookPayload({
                action: "edited",
                installation: {
                    id: 12345,
                    suspended_at: null,
                    account: { 
                        login: "emanuel-bolanos",
                        type: "User",
                    },
                },
            })
        ).toThrow();
    });
});
