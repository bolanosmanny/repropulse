import { describe, expect, it } from 'vitest';
import { formatFlakeRiskComment } from './flake-risk-comment.js';

describe("formatFlakeRiskComment", () => {
    it("formats evidence for high-risk changed tests", () => {
        const comment = formatFlakeRiskComment([
            {
                testDefinitionId: 1,
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "rejects expired token",
                sourceFile: "src/auth/tokens.test.ts",
                scorePercent: 50,
                transientFailures: 1,
                rerunResolvedCommits: 1,
            },
        ]);

        expect(comment).toContain("<!-- repropulse-flake-risk -->");
        expect(comment).toContain("`src/auth/tokens.test.ts`");
        expect(comment).toContain("auth.tokens › rejects expired token");
        expect(comment).toContain("| 50% | 1 |");
    });

    it("rejects an empty risk list", () => {
        expect(() => formatFlakeRiskComment([])).toThrow(
            "Cannot format a flake-risk comment without risks"
        );
    });
});
