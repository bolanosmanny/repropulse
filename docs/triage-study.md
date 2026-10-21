# Controlled failure-triage timing study

This is a small **controlled-case** comparison, not a real-world productivity claim. Six separate GitHub Actions runs each have one failed test and a rerun of the same commit. The participant should not inspect `scripts/triage-study-case.mjs` or the answer key before all timings are recorded.

Use GitHub Actions logs only for the manual cases. For the ReproPulse cases, use the ReproPulse flake-score and test-history pages and, if needed, the linked GitHub run. For each case, start a timer when opening the assigned evidence. Stop when you can name the test and say either "likely retry-recovered/flaky" or "not shown to recover on this rerun." Cap each case at 10 minutes. Do not revisit a case after seeing another case's answer.

Work in this alternating order to limit order effects: case 4 (ReproPulse), case 1 (manual), case 5 (ReproPulse), case 2 (manual), case 6 (ReproPulse), case 3 (manual). Record times to the nearest second. The case links are supplied separately after all six runs are ready.

| Case | Method | Seconds | Verdict | Test identified | Notes |
| --- | --- | ---: | --- | --- | --- |
| 4 | ReproPulse |  |  |  |  |
| 1 | Manual |  |  |  |  |
| 5 | ReproPulse |  |  |  |  |
| 2 | Manual |  |  |  |  |
| 6 | ReproPulse |  |  |  |  |
| 3 | Manual |  |  |  |  |

After recording, compare verdicts with the source-defined ground truth and calculate the median seconds for the three manual cases and the three ReproPulse cases. Report the number of cases, accuracy, and any excluded/time-capped cases alongside both medians. Because this is one participant, six controlled cases, and different cases per method, the result is exploratory and must **not** be presented as a measured reduction in real-world team investigation time.
