import { describe, expect, it } from 'vitest';
import { parseJUnitXml } from './junit-parser.js';

describe("parseJUnitXml", () => {
    it("parses passing, failing, skipped, and error test cases", () => { 
        const tests = parseJUnitXml(`
            <testsuites>
                <testsuite name="authentication">
                    <testcase
                        classname="auth.tokens"
                        name="accepts valid token"
                        time="0.018"
                    />
                    <testcase
                        classname="auth.tokens"
                        name="rejects expired token"
                        time="0.025"
                    >
                        <failure type="AssertionError">
                            Expected token to be rejected
                        </failure>
                    </testcase>
                    <testcase
                        classname="auth.tokens"
                        name="rejects external provider check"
                    >
                        <skipped/>
                    </testcase>
                    <testcase
                        classname="auth.tokens"
                        name="handles provider outage"
                    >
                        <error type="NetworkError">
                            Connection refused
                        </error>
                    </testcase>
                </testsuite>
            </testsuites>
        `);

        expect(tests).toEqual([
            {
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "accepts valid token",
                outcome: "passed",
                durationMs: 18,
                failureType: null,
                failureMessage: null,
            },
            {
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "rejects expired token",
                outcome: "failed",
                durationMs: 25,
                failureType: "AssertionError",
                failureMessage: "Expected token to be rejected",
            },
            {
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "rejects external provider check",
                outcome: "skipped",
                durationMs: null,
                failureType: null,
                failureMessage: null,
            },
            {
                suiteName: "authentication",
                className: "auth.tokens",
                testName: "handles provider outage",
                outcome: "error",
                durationMs: null,
                failureType: "NetworkError",
                failureMessage: "Connection refused",
            },
        ]);
    });

    it("rejects a document without test suites", () => { 
        expect(() => parseJUnitXml("<report />")).toThrow(
            "JUnit XML contains no test suites"
        );
    });
});