# ReproPulse validation record

## Evidence available on October 21, 2026

The [August 13 deployment snapshot](../README.md#deployment-verification) shows ingestion from two repositories: 3 workflow runs and 51 JUnit executions. It reports no observed retry-recovered failure. These numbers are a deployment smoke test, not a measure of real-world flake detection.

GitHub Actions currently lists [27 ReproPulse runs](https://github.com/bolanosmanny/repropulse/actions) from August 10–13 and [24 Stratos runs](https://github.com/bolanosmanny/stratos/actions) from July 30–August 13. Neither repository has a run after August 13. Most of these runs predate the integration and cannot be counted as ReproPulse-ingested test history. The elapsed calendar time since August does not constitute several weeks of active CI evidence.

| Requested measure | Current evidence |
| --- | --- |
| Repositories with verified JUnit ingestion | ReproPulse and Stratos |
| ReproPulse-ingested workflow runs | 3 in the August 13 snapshot |
| ReproPulse-ingested test executions | 51 in the August 13 snapshot |
| Confirmed naturally occurring flaky tests | Not established |
| False alerts | Not measured; no alert review has been performed |
| Manual vs. ReproPulse triage time | Not measured |

## Controlled fail-then-pass validation

The `Controlled flake validation` workflow is manually triggered. Its single test deliberately fails on GitHub run attempt 1 and passes on a rerun of the **same workflow run and commit**. It writes one JUnit case with `file="scripts/controlled-flake-test.mjs"`. The upload action sends both `github.run_id` and `github.run_attempt` to ReproPulse. The database stores the two attempts separately using the `(github_workflow_run_id, run_attempt)` key.

Run this only while the on-demand ReproPulse API and both workers are available:

1. Dispatch `Controlled flake validation` on the validation branch. Confirm attempt 1 fails and its `Upload JUnit report` step succeeds.
2. Rerun the failed job in GitHub Actions. Confirm attempt 2 passes and uploads its report. Verify both attempts show the same `head_sha` and workflow run ID.
3. Query the repository's workflow runs, test history, flake scores, and reliability metrics. Expect two attempts, one failed and one passed execution for the controlled test, one rerun-resolved commit, and a 50% score.
4. Open a pull request that changes `scripts/controlled-flake-test.mjs`. The GitHub App must be installed on this repository with PR feedback permissions. Confirm its comment names that exact file and test with a 50% score. Open the PR only after step 3 so its `opened` webhook evaluates the observed score.
5. Record the GitHub run URL, PR URL, API responses, and dashboard screenshots below. Keep controlled results separate from naturally occurring flake counts.

| Controlled evidence | Result |
| --- | --- |
| GitHub run URL and commit | Pending |
| Attempt 1 JUnit upload | Pending |
| Attempt 2 JUnit upload | Pending |
| Failed then passed test history | Pending |
| Flake score and dashboard | Pending |
| Pull-request feedback | Pending |

## Longitudinal CI evidence

Collect a window of at least three weeks **after** continuous ingestion is enabled. For every included repository, record its first and last processed run dates, workflow attempt count, test execution count, and distinct test definitions. Review every alert against its paired failed and passed executions on the same commit. Count confirmed natural flakes and false alerts separately; exclude the controlled case above. If the demo server is turned off during the window, report the gap and start a new continuous window.

## Investigation-time study

Prepare at least six real CI failure cases with ground truth checked from logs and reruns. Have at least one investigator review each case manually and with ReproPulse, in balanced order, without seeing the answer beforehand. Start timing when the investigator receives the failed run and stop when they identify the likely flaky test or conclude that evidence is insufficient. Use the same ten-minute cap for both methods. Record per-case times, correctness, and any false alerts, then compare the two medians. Report the number of investigators and cases alongside the medians. Do not claim saved time until this study is complete.
