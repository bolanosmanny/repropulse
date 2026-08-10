import { getDashboardData } from "@/lib/repropulse-api";

export const dynamic = "force-dynamic";

function NavRow({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) { 
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm ${
        active
        ? "border border-stone-200 bg-white font-medium text-stone-900 shadow-sm"
        : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      <span className = "h-1.5 w-1.5 rounded-full bg-stone-400" />
      {label}
    </button>
  );
}

function RailRow({
  label,
  detail,
  active = false,
}: { 
  label: string;
  detail?: string;
  active?: boolean;
}) { 
  return (
    <button
      className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm ${
        active
        ? "border border-stone-200 bg-stone-50 font-medium text-stone-900"
        : "text-stone-600 hover:bg-stone-50"
      }`}
    >
      <span>{label}</span>
      {detail ? <span className ="text-xs text-stone-400">{detail}</span> : null}
    </button>
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

export default async function Home() { 

  const { scores, workflowRuns } = await getDashboardData(1);

  const highestFlakeScore = Math.max(
    0,
    ...scores.map((score) => score.flakeScore.scorePercent)
  );

  const kpis = [
    ["Test monitored", String(scores.length), "Across 1 active repository"],
    ["CI runs ingested", String(workflowRuns.length), "Workflow attempts stored"],
    [
      "High-risk tests",
      String(scores.filter((score) => score.flakeScore.scorePercent >= 25).length),
      "Tests scoring 25% or higher",
    ],
    [
      "Transient failures",
      String(
        scores.reduce(
          (total, score) => total + score.flakeScore.transientFailures,
          0
        )
      ),
      "Recovered on a later rerun",
    ],
    [
      "Highest flake score",
      `${highestFlakeScore}%`,
      "Highest observed retry risk",
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
  
  return (
    <main className = "min-h-screen bg-stone-100 lg:flex">
      <aside className = "hidden w-60 shrink-0 border-r border-stone-200 bg-stone-50 p-3 lg:flex lg:flex-col">
        <div className = "flex items-center gap-2 px-1 pt-1">
          <div className = "flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-medium text-white">
            R
          </div>
          <div>
            <p className = "text-sm font-medium">ReproPulse</p>
            <p className = "text-xs text-stone-500">CI Reliability</p>
          </div>
        </div>

        <div className = "mt-6 space-y-1">
          <p className = "px-3 text-[10px] font medium uppercase tracking-[0.12em] text-stone-400">
            Workspace
          </p>
          <NavRow label = "Dashboard" active />
          <NavRow label = "Repositories" />
          <NavRow label = "Test Explorer" />
          <NavRow label = "Workflow Runs" />
          <NavRow label = "Risk Queue" />
        </div>

        <div className = "mt-6 space-y-1">
          <p className = "px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            Insight & Control
          </p>
          <NavRow label = "Flake Scores" />
          <NavRow label = "Failure Trends" />
          <NavRow label = "Ingestion Jobs" />
          <NavRow label = "Settings" />
        </div>

        <div className = "mt-auto rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <p className = "text-sm font-medium"> Weekly Reliability Review</p>
          <p className = "mt-1 text-xs leading-5 text-stone-600">
            One test recovered on a rerun, and needs investigation before the next release.
          </p>
          <button className = "mt-3 h-9 w-full rounded-lg bg-slate-900 text-sm font-medium text-white">
            Open Risk Queue
          </button>
        </div>
      </aside>

      <section className = "min-w-0 flex-1">
        <header className = "flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
          <p className = "text-sm text-stone-500">
            Dashboard <span className = "px-1 text-stone-300">/</span> Reliability Overview
          </p>
          <div className = "flex gap-2">
            <button className = "h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              Last 30 Days
            </button>
            <button className = "h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              Export Report
            </button>
          </div>
        </header>

        <div className = "grid gap-4 p-4 xl:grid-cols-[248px_minmax(0,1fr)]">
          <aside className = "rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h2 className = "text-[15px] font-medium">Reliability Control</h2>
            <p className = "mt-1 text-xs leading-5 text-stone-500">
              Saved investigation views and operational queues for CI review.
            </p>

            <div className = "mt-5 border-t border-stone-100 pt-4">
              <p className = "px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Views
              </p>
              <div className = "mt-2 space-y-1">
                <RailRow label="Reliability Overview" active />
                <RailRow label="Flaky Test Risk" />
                <RailRow label="Recent Failures" />
                <RailRow label="Slow Tests" />
              </div>
            </div>

            <div className = "mt-4 border-t border-stone-100 pt-4">
              <p className = "px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Reliability Lenses
              </p>
              <div className = "mt-2 space-y-1">
                <RailRow label="High Flake Score" detail="1 Test" />
                <RailRow label="Rerun recovered" detail = "1 Run" />
                <RailRow label="Failure Rate" detail = "50%" />
              </div>
            </div>

            <div className = "mt-4 border-t border-stone-100 pt-4">
              <p className = "px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                Queues
              </p>
              <div className = "mt-2 space-y-1">
                <RailRow label="Needs Investigation" detail = "1" />
                <RailRow label="Failed This Week" detail = "1" />
                <RailRow label="No Owner Assigned" detail = "0" />
              </div>
            </div>
          </aside>

          <div className = "min-w-0">
            <div className = "flex flex-wrap gap-2">
              <button className = "rounded-lg border border-stone 200 bg-white px-3 py-1.5 text-sm font-medium">
                Overview
              </button>
              <button className = " rounded-lg px-3 py-1.5 text-sm text-stone-500">
                Flake Scores
              </button>
              <button className = " rounded-lg px-3 py-1.5 text-sm text-stone-500">
                Workflow Runs
              </button>
              <button className = " rounded-lg px-3 py-1.5 text-sm text-stone-500">
                Test History
              </button>
            </div>

            <div className = "mt-4">
              <h1 className = "text-xl font-medium tracking-tight">
                Reliability Overview
              </h1>
              <p className = "mt-1 max-w-3xl text-sm text-stone-600">
                Review CI stabiliity, retry-recovered failures, and the tests that need attention before the next release.
              </p>
            </div>

            <section className = "mt-5 grid overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map(([label, value, helper], index) => ( 
                <div
                  key={label}
                  className={`min-h[112px] p-4 ${
                    index > 0 ? "border-l border-stone-200" : ""
                  }`}
                >
                  <p className = "text-[10px] font-medium uppecase tracking-[0.12em] text-stone-400">
                    {label}
                  </p>
                  <p className = "mt-3 text-2xl font-medium tracking-tight">{value}</p>
                  <p className = "mt-2 text-xs text-stone-500">{helper}</p>
                </div>
              ))}
            </section>

            <section className = "mt-4 grid gap-4 xl:grid-cols-[1.85fr_0.95fr]">
              <div className = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className = "flex items-start justify-between gap-4">
                  <div>
                    <h2 className = "text-[15px] font-medium">Reliability Distribution</h2>
                    <p className = "mt-1 text-xs text-stone-500">
                      Where retry-recovered failures are concentrated across the test suite.
                    </p>
                  </div>
                  <span className = "whitespace-nowrap text-xs text-stone-500">
                    3 Monitored Tests
                  </span>
                </div>

                <div className = "mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className = "flex items-center justify-between gap-3 text-xs">
                    <span className = "rounded-full border border-stone-200 bg-white px-2 py-1 text-stone-600">
                      Investigation line at 25% flake score
                    </span>
                    <span className = "text-stone-500">Observed CI History</span>
                  </div>

                  <div className = "mt-5 flex h-44 items-end gap-4 border-b border-stone-200 px-4">
                    {[
                      ["Auth", "h-28", "50%"],
                      ["API", "h-3", "0%"],
                      ["UI", "h-3", "0%"],
                      ["Integration", "h-3", "0%"],
                      ["CI", "h-3", "0%"],
                    ].map(([label, height, value]) => (
                      <div key = {label} className = "flex flex-1 flex-col items-center justify-end">
                        <span className = "mb-2 text-xs text-stone-500">{value}</span>
                        <div className = {`w-full max-w-10 rounded-t-md bg-sky-500 ${height}`} />
                        <span className = "mt-2 text-xs text-stone-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className = "mt-4 grid gap-3 sm:grid-cols-3">
                  <div className = "rounded-xl border border-stone-20o p-3">
                    <p className = "text-sm font-medium">Retry Recovered</p>
                    <p className = "mt-1 text-xs text-stone-500">
                      1 failure passed on the next run of the same commit.
                    </p>
                  </div>
                  <div className = "rounded-xl border border-stone-20o p-3">
                    <p className = "text-sm font-medium">Stable Tests</p>
                    <p className = "mt-1 text-xs text-stone-500">
                      1 completed teset has no observed flake signal.
                    </p>
                  </div>
                  <div className = "rounded-xl border border-stone-20o p-3">
                    <p className = "text-sm font-medium">Next Review</p>
                    <p className = "mt-1 text-xs text-stone-500">
                      Inspect token expiry setup before expanding coverage.
                    </p>
                  </div>
                </div>
              </div>

              <div className = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <h2 className = "text-[15px] font-medium">Reliability Confidence</h2>
                <p className = "mt-1 text-xs text-stone-500">
                  Current Ci health and the signals reducing confidence.
                </p>

                <div className = "mt-4 grid grid-cols-2 gap-3">
                  <div className = "rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className = "text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                      Confidence
                    </p>
                    <p className = "mt-2 text-xl font-medium">50%</p>
                    <p className = "mt-1 text-xs text-stone-500">Needs more run history</p>
                  </div>
                  <div className = "rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className = "text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                      Highest Risk
                    </p>
                    <p className = "mt-2 text-xl font-medium">50%</p>
                    <p className = "mt-1 text-xs text-stone-500">auth.tokens</p>
                  </div>
                </div>

                <div className = "mt-5">
                  <div className = "flex items-center justify-between">
                    <p className = "text-sm font-medium">Signal Quality</p>
                    <StatusPill label = "Moderate Risk" tone="risk" />
                  </div>
                  {[
                    ["Completed Test Attempts", "2 / 2", "w-full"],
                    ["Retry-Recovered Failures", "1 Observed", "w-1/2"],
                    ["Tests With Stable History", "1 / 3", "w-1/3"],
                  ].map(([label, value, width]) => (
                    <div key = {label} className = "mt-3">
                      <div className = "flex justify-between text-xs text-stone-500">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className = "mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div className = {`h-full rounded-full bg-slate-900 ${width}`} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className = "mt-5 border-t border-stone-100 pt-4">
                  <p className = "text-sm font-medium">What changes the release call</p>
                  <div className = "mt-3 space-y-3 text-xs">
                    <div>
                      <p className = "font-medium text-stone-700">Rejects Expired Token</p>
                      <p className = "mt-1 leading-5 text-stone-500">
                        A stable rerun would lower the current flake score.
                      </p>
                    </div>
                    <div>
                      <p className = "font-medium text-stone-700">Add CI History</p>
                      <p className = "mt-1 leading-5 text-stone-500">
                        More workflow attempts make the score more reliable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className = "mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className = "flex items-end justify-between gap-4 border-b border-stone-200 p-4">
                <div>
                  <h2 className = "text-[15px] font-medium">Flake Risk Queue</h2>
                  <p className = "mt-1 text-xs text-stone-500">
                    Tests that need a clear next move before the next CI review.
                  </p>
                </div>
                <button className = "hidden h-9 rounded-lg border border-stone-200 px-3 text-sm text-stone-600 sm:block">
                  View All Tests
                </button>
              </div>

              <div className = "overflow-x-auto">
                <table className = "w-full min-2-[860px] text-left">
                  <thead className = "bg-stone-50 text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    <tr>
                      <th className = "px-4 py-3 font-medium">Test</th>
                      <th className = "px-4 py-3 font-medium">Area</th>
                      <th className = "px-4 py-3 font-medium">Flake Score</th>
                      <th className = "px-4 py-3 font-medium">Pattern</th>
                      <th className = "px-4 py-3 font-medium">Next Action</th>
                      <th className = "px-4 py-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody className = "divide-y divide-stone-100 text-[13px]">
                    {riskRows.map(([test, area, score, pattern, action, risk]) => (
                      <tr key = {test}>
                        <td className = "px-4 py-2.5 font-medium text-stone-800">{test}</td>
                        <td className = "px-4 py-2.5 text-stone-500">{area}</td>
                        <td className = "px-4 py-2.5 text-stone-700">{score}</td>
                        <td className = "px-4 py-2.5 text-stone-500">{pattern}</td>
                        <td className = "px-4 py-2.5 text-stone-500">{action}</td>
                        <td className = "px-4 py-2.5">
                          <StatusPill
                            label = {risk}
                            tone={risk === "High" ? "risk" : "muted"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className = "mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className = "border-b border-stone-200 p-4">
                <h2 className = "text-[15px] font-medium">Recent Workflow Runs</h2>
              </div>
              <div className = "divide-y divide-stone-100">
                {recentRuns.slice(0,5).map(([workflow, branch, attempt, result, duration]) => (
                  <div
                    key = {attempt}
                    className = "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className = "font-medium">{workflow}</p>
                      <p className = "mt-1 text-xs text-stone-500">
                        {branch} · {attempt} 
                      </p>
                    </div>
                    <div className = "flex items-center gap-3">
                      <span className = "text-xs text-stone-500">{duration}</span>
                      <StatusPill label = {result} tone="good" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
