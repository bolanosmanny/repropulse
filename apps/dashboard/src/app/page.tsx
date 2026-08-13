import {
  getDashboardData,
  getReliabilityMetrics,
} from "@/lib/repropulse-api";
import Link from "next/link";
import { RepositorySwitcher } from "@/components/repository-switcher";
import {
  getRepositorySelection,
  repositoryHref,
  type RepositorySearchParams,
} from "@/lib/repository-selection";

export const dynamic = "force-dynamic";

function ControlRow({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm text-stone-600">
      <span>{label}</span>
      <span className="text-xs text-stone-400">{detail}</span>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "risk" | "muted";
}) {
  const tones = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    risk: "border-rose-200 bg-rose-50 text-rose-700",
    muted: "border-stone-200 bg-stone-50 text-stone-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: RepositorySearchParams;
}) {
  const { repositories, selectedRepository } =
    await getRepositorySelection(searchParams);

  const [{ scores, workflowRuns }, metrics] = await Promise.all([
    getDashboardData(selectedRepository.id),
    getReliabilityMetrics(selectedRepository.id),
  ]);

  const kpis = [
    ["Tests monitored", String(scores.length), "Unique test definitions"],
    [
      "Workflow runs",
      String(metrics.workflowRunCount),
      "Workflow attempts processed",
    ],
    [
      "Test executions",
      String(metrics.testExecutionsStored),
      "JUnit results stored",
    ],
    [
      "Flaky tests",
      String(metrics.flakyTestsDetected),
      "Recovered on the same commit",
    ],
    [
      "Webhook success",
      metrics.webhookProcessing.successRatePercent == null
        ? "—"
        : `${metrics.webhookProcessing.successRatePercent}%`,
      metrics.webhookProcessing.p95LatencyMs == null
        ? "No completed deliveries yet"
        : `p95: ${metrics.webhookProcessing.p95LatencyMs.toFixed(1)} ms`,
    ],
  ];

  const riskRows = scores.slice(0, 5).map((score) => [
    score.testName,
    score.className || score.suiteName,
    `${score.flakeScore.scorePercent}%`,
    score.flakeScore.transientFailures > 0
      ? "Failed → passed on rerun"
      : "No transient failure",
    score.flakeScore.transientFailures > 0
      ? "Review shared test state"
      : "Continue monitoring",
    score.flakeScore.scorePercent >= 25 ? "High" : "Low",
  ]);

  const recentRuns = workflowRuns.slice(0, 5).map((workflowRun) => [
    workflowRun.workflowName,
    workflowRun.headBranch ?? "unknown branch",
    `Attempt ${workflowRun.runAttempt}`,
    workflowRun.conclusion ?? workflowRun.status,
    workflowRun.completedAt
      ? new Date(workflowRun.completedAt).toLocaleDateString()
      : "In Progress",
  ]);

  const highRiskCount = scores.filter(
    (score) => score.flakeScore.scorePercent >= 25
  ).length;

  const rerunRecoveredCount = scores.filter(
    (score) => score.flakeScore.rerunResolvedCommits > 0
  ).length;

  const observedFailures = metrics.failureTrend.reduce(
    (total, day) => total + day.failed,
    0
  );

  const completedAttempts = scores.reduce(
    (total, score) => total + score.flakeScore.completedAttempts,
    0
  );

  const transientFailures = scores.reduce(
    (total, score) => total + score.flakeScore.transientFailures,
    0
  );

  const testsWithHistory = scores.filter(
    (score) => score.flakeScore.completedAttempts > 0
  ).length;

  const stableTests = scores.filter(
    (score) =>
      score.flakeScore.completedAttempts > 0 &&
      score.flakeScore.transientFailures === 0
  ).length;

  const highestRisk = [...scores].sort(
    (a, b) => b.flakeScore.scorePercent - a.flakeScore.scorePercent
  )[0];

  const evidenceQuality =
    completedAttempts >= 30
      ? { label: "Established history", tone: "good" as const }
      : completedAttempts >= 10
        ? { label: "Growing history", tone: "muted" as const }
        : { label: "Limited history", tone: "muted" as const };

  return (
    <main className="min-h-screen bg-stone-100 lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-stone-50 p-3 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-medium text-white">
            R
          </div>
          <div>
            <p className="text-sm font-medium">ReproPulse</p>
            <p className="text-xs text-stone-500">CI Reliability</p>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            Workspace
          </p>

          <Link
            href={repositoryHref("/", selectedRepository.id)}
            className="flex w-full items-center gap-3 rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Dashboard
          </Link>

          <Link
            href={repositoryHref("/test-history", selectedRepository.id)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Test History
          </Link>

          <Link
            href={repositoryHref("/workflows", selectedRepository.id)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Workflow Runs
          </Link>
        </div>

        <div className="mt-6 space-y-1">
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            Reliability
          </p>

          <Link
            href={repositoryHref("/flake-scores", selectedRepository.id)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Flake Scores
          </Link>

          <Link
            href={repositoryHref("/failure-trends", selectedRepository.id)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Failure Trends
          </Link>

          <Link
            href="/ingestion-jobs"
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Ingestion Jobs
          </Link>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
          <p className="text-sm text-stone-500">
            Dashboard
            <span className="px-1 text-stone-300">/</span>
            Reliability Overview
          </p>

          <RepositorySwitcher
            repositories={repositories}
            selectedRepositoryId={selectedRepository.id}
          />
        </header>

        <div className="grid gap-4 p-4 xl:grid-cols-[248px_minmax(0,1fr)]">

          <aside className="rounded-xl border border-stone-200    bg-white   p-3 shadow-sm"
          >
            <h2 className="text-[15px] font-medium">Reliability Control</h2>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Operational signals from observed CI history.
            </p>

            <div className="mt-5 border-t border-stone-100 pt-4">
              <p className="px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Reliability Lenses
              </p>
              <div className="mt-2 space-y-1">
                <ControlRow
                  label="High Flake Score"
                  detail={`${highRiskCount} Tests`}
                />
                <ControlRow
                  label="Rerun Recovered"
                  detail={`${rerunRecoveredCount} Tests`}
                />
                <ControlRow
                  label="Observed Failures"
                  detail={`${observedFailures} Results`}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Queues
              </p>
              <div className="mt-2 space-y-1">
                <ControlRow
                  label="Needs Investigation"
                  detail={`${highRiskCount}`}
                />
                <ControlRow
                  label="Confirmed Flakes"
                  detail={`${metrics.flakyTestsDetected}`}
                />
                <ControlRow
                  label="Workflow Runs"
                  detail={`${metrics.workflowRunCount}`}
                />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div>
              <h1 className="text-xl font-medium tracking-tight">
                Reliability Overview
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-stone-600">
                Review CI stability, retry-recovered failures, and tests that
                need attention before the next release.
              </p>
            </div>

            <section className="mt-5 grid overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map(([label, value, helper], index) => (
                <div
                  key={label}
                  className={`min-h-[112px] p-4 ${
                    index > 0 ? "border-l border-stone-200" : ""
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-medium tracking-tight">
                    {value}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">{helper}</p>
                </div>
              ))}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.85fr_0.95fr]">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-medium">
                      Reliability Distribution
                    </h2>
                    <p className="mt-1 text-xs text-stone-500">
                      Where retry-recovered failures are concentrated across
                      the test suite.
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-stone-500">
                    {scores.length} Monitored Tests
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-full border border-stone-200 bg-white px-2 py-1 text-stone-600">
                      Investigation line at 25% flake score
                    </span>
                    <span className="text-stone-500">
                      Observed CI History
                    </span>
                  </div>

                  <div className="mt-5 flex h-44 items-end gap-4 border-b border-stone-200 px-4">
                    {[
                      ["Auth", "h-28", "50%"],
                      ["API", "h-3", "0%"],
                      ["UI", "h-3", "0%"],
                      ["Integration", "h-3", "0%"],
                      ["CI", "h-3", "0%"],
                    ].map(([label, height, value]) => (
                      <div
                        key={label}
                        className="flex flex-1 flex-col items-center justify-end"
                      >
                        <span className="mb-2 text-xs text-stone-500">
                          {value}
                        </span>
                        <div
                          className={`w-full max-w-10 rounded-t-md bg-sky-500 ${height}`}
                        />
                        <span className="mt-2 text-xs text-stone-500">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-sm font-medium">Retry Recovered</p>
                    <p className="mt-1 text-xs text-stone-500">
                      A failure passed on the next run of the same commit.
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-sm font-medium">Stable Tests</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Completed tests without an observed flake signal.
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-sm font-medium">Next Review</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Inspect high-risk tests before expanding coverage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <h2 className="text-[15px] font-medium">Reliability Evidence</h2>
                <p className="mt-1 text-xs text-stone-500">
                  Signals calculated from completed test executions for this repository.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                      Completed Attempts
                    </p>
                    <p className="mt-2 text-xl font-medium">{completedAttempts}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Passed, failed, or errored executions
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                      Highest Flake Score
                    </p>
                    <p className="mt-2 text-xl font-medium">
                      {highestRisk ? `${highestRisk.flakeScore.scorePercent}%` : "—"}
                    </p>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {highestRisk
                        ? highestRisk.testName
                        : "No completed test history yet"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Evidence Quality</p>
                    <StatusPill label={evidenceQuality.label} tone={evidenceQuality.tone} />
                  </div>

                  <dl className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-100 px-3">
                    <div className="flex items-center justify-between py-3 text-xs">
                      <dt className="text-stone-500">Tests with completed history</dt>
                      <dd className="font-medium text-stone-800">
                        {testsWithHistory} / {scores.length}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between py-3 text-xs">
                      <dt className="text-stone-500">Retry-recovered failures</dt>
                      <dd className="font-medium text-stone-800">
                        {transientFailures} observed
                      </dd>
                    </div>

                    <div className="flex items-center justify-between py-3 text-xs">
                      <dt className="text-stone-500">Tests with stable history</dt>
                      <dd className="font-medium text-stone-800">
                        {stableTests} / {scores.length}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 border-t border-stone-100 pt-4">
                  <p className="text-sm font-medium">Interpretation</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {transientFailures > 0
                      ? "At least one test failed and later passed on the same commit. Review those tests before treating their failures as release-blocking."
                      : "No retry-recovered failures have been observed yet. Continue collecting CI history to strengthen the flake signal."}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-200 p-4">
                <h2 className="text-[15px] font-medium">Flake Risk Queue</h2>
                <p className="mt-1 text-xs text-stone-500">
                  Tests that need a clear next move before the next CI review.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left">
                  <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Test</th>
                      <th className="px-4 py-3 font-medium">Area</th>
                      <th className="px-4 py-3 font-medium">Flake Score</th>
                      <th className="px-4 py-3 font-medium">Pattern</th>
                      <th className="px-4 py-3 font-medium">Next Action</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-[13px]">
                    {riskRows.map(
                      ([test, area, score, pattern, action, risk]) => (
                        <tr key={test}>
                          <td className="px-4 py-2.5 font-medium text-stone-800">
                            {test}
                          </td>
                          <td className="px-4 py-2.5 text-stone-500">
                            {area}
                          </td>
                          <td className="px-4 py-2.5 text-stone-700">
                            {score}
                          </td>
                          <td className="px-4 py-2.5 text-stone-500">
                            {pattern}
                          </td>
                          <td className="px-4 py-2.5 text-stone-500">
                            {action}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusPill
                              label={risk}
                              tone={risk === "High" ? "risk" : "muted"}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-200 p-4">
                <h2 className="text-[15px] font-medium">
                  Recent Workflow Runs
                </h2>
              </div>

              <div className="divide-y divide-stone-100">
                {recentRuns.map(
                  ([workflow, branch, attempt, result, completedAt]) => (
                    <div
                      key={`${workflow}-${attempt}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{workflow}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {branch} · {attempt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-500">
                          {completedAt}
                        </span>
                        <StatusPill
                          label={result}
                          tone={
                            result === "success" || result === "completed"
                              ? "good"
                              : "risk"
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
