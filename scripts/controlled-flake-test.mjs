import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT);
assert.ok(Number.isSafeInteger(runAttempt) && runAttempt > 0);

let failure = null;
try {
  assert.ok(runAttempt > 1, "Controlled failure on the first GitHub run attempt");
} catch (error) {
  failure = error;
}

const report = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<testsuite name="controlled-rerun" tests="1" failures="${failure ? 1 : 0}">`,
  '  <testcase classname="controlled.ci" name="recovers on rerun" file="scripts/controlled-flake-test.mjs" time="0.001">',
  ...(failure
    ? ['    <failure type="AssertionError">Controlled failure on the first GitHub run attempt</failure>']
    : []),
  "  </testcase>",
  "</testsuite>",
].join("\n");

mkdirSync("reports", { recursive: true });
writeFileSync("reports/controlled-flake.xml", report);
console.log(`Controlled test attempt ${runAttempt}: ${failure ? "failed" : "passed"}`);
if (failure) process.exitCode = 1;
