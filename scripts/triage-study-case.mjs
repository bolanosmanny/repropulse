import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const match = /^\[triage-case:([1-6])\]$/.exec(
  process.env.TRIAGE_CASE_MARKER?.trim() ?? ""
);
assert.ok(match, "Expected a single [triage-case:1] through [triage-case:6] marker");

const caseNumber = Number(match[1]);
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT);
assert.ok(Number.isSafeInteger(runAttempt) && runAttempt > 0);

const cases = {
  1: { type: "AssertionError", message: "Expected three records, received two", recovers: true },
  2: { type: "TimeoutError", message: "Response exceeded the 200 ms limit", recovers: false },
  3: { type: "NetworkError", message: "Connection reset while fetching fixture", recovers: true },
  4: { type: "AssertionError", message: "Results were returned out of order", recovers: true },
  5: { type: "TimeoutError", message: "Response exceeded the 250 ms limit", recovers: false },
  6: { type: "NetworkError", message: "Connection reset while fetching fixture", recovers: true },
};

const selectedCase = cases[caseNumber];
assert.ok(selectedCase);
const failed = runAttempt === 1 || !selectedCase.recovers;
const label = `case-${String(caseNumber).padStart(2, "0")}`;

const report = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<testsuite name="controlled-triage-study" tests="1" failures="${failed ? 1 : 0}">`,
  `  <testcase classname="study.${label}" name="investigate ${label}" file="scripts/triage-study-case.mjs" time="0.001">`,
  ...(failed
    ? [`    <failure type="${selectedCase.type}">${selectedCase.message}</failure>`]
    : []),
  "  </testcase>",
  "</testsuite>",
].join("\n");

mkdirSync("reports", { recursive: true });
writeFileSync("reports/triage-study.xml", report);
console.log(`${label}: ${failed ? `${selectedCase.type}: ${selectedCase.message}` : "passed"}`);
if (failed) process.exitCode = 1;
