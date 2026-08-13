import Link from "next/link";
import { getTestExecutions } from "@/lib/repropulse-api";
import { RepositorySwitcher } from "@/components/repository-switcher";
import {
  getRepositorySelection,
  repositoryHref,
  type RepositorySearchParams,
} from "@/lib/repository-selection";


export const dynamic = "force-dynamic";

function outcomeTone(outcome: string) {
    if (outcome === "passed") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (outcome === "failed" || outcome === "error") { 
        return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-stone-200 bg-stone-50 text-stone-700";
}

function formatDuration(durationMs: number | null) { 
    if (durationMs == null) { 
        return "-";
    }

    if (durationMs < 1000) { 
        return `${durationMs}`;
    }

    return `${(durationMs / 1000).toFixed(2)} s`;
}

export default async function TestHistoryPage({
  searchParams,
}: {
  searchParams: RepositorySearchParams;
}) {
  const { repositories, selectedRepository } =
    await getRepositorySelection(searchParams);

  const executions = await getTestExecutions(selectedRepository.id);

    const failedExecutions = executions.filter(
        (execution) => 
            execution.outcome === "failed" || execution.outcome === "error"
    ).length;

    const passedExecutions = executions.filter(
        (execution) => execution.outcome === "passed"
    ).length;

    return ( 
        <main className = "min-h-screen bg-stone-100">
            <header className = "flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
                <p className = "text-sm font-stone-500">
                    Dashboard <span className = "px-1 text-stone-300">/</span> Test History
                </p>

                <div className="flex items-center gap-3">
                    <RepositorySwitcher
                        repositories={repositories}
                        selectedRepositoryId={selectedRepository.id}
                    />

                    <Link
                    href={repositoryHref("/", selectedRepository.id)}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
                >
                    Back to Overview
                    </Link>
                </div>

            </header>

            <div className = "mx-auto max-w-7xl p-4">
                <div>
                    <h1 className = "text-xl font-medium tracking0-tight">Test History</h1>
                    <p className = "mt-1 max-w-3xl text-sm text-stone-600">
                        Inspect the execution history used to calculate Repropulse flake scores. A failure followed by a pass
                        on the same commit is a rerun-recovery signal.
                    </p>
                </div>

                <section className = "mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                        ["Executions Recorded", String(executions.length), "Latest 100 Results"],
                        ["Passed", String(passedExecutions), "Completed Successfully"],
                        ["Failed or Errored", String(failedExecutions), "Require Investigation"],
                    ].map(([label, value, helper]) => (
                        <div
                            key={label}
                            className = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                        >
                            <p className = "text-xs font-medium uppercase tracking-wide text-stone-500">
                                {label}
                            </p>
                            <p className = "mt-2 text-2xl font-medium tracking-tight text-stone-900">
                                {value}
                            </p>
                            <p className = "mt-1 text-xs text-stone-500">
                                {helper}
                            </p>
                        </div>
                    ))}
                </section>

                <section className = "mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className = "border-b border-stone-200 px-4 py-3">
                        <h2 className = "font-medium text-stone-900">Execution Evidence</h2>
                        <p className = "mt-1 text-sm text-stone-500">
                            Ordered from newest to oldest workflow completion. 
                        </p>
                    </div>

                    <div className = "overflow-x-auto">
                        <table className = "w-full min-w-[1120px] text-left text-sm">
                            <thead className = "border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className = "px-4 py-3 font-medium">Test</th>
                                    <th className = "px-4 py-3 font-medium">Outcome</th>
                                    <th className = "px-4 py-3 font-medium">Duration</th>
                                    <th className = "px-4 py-3 font-medium">Workflow Attempt</th>
                                    <th className = "px-4 py-3 font-medium">Commit</th>
                                    <th className = "px-4 py-3 font-medium">Failure Detail</th>
                                </tr>
                            </thead>

                            <tbody className = "divide-y divide-stone-100">
                                {executions.map((execution) => (
                                    <tr key = {`${execution.githubWorkflowRunId}-${execution.testDefinitionId}`}>
                                        <td className = "px-4 py-3">
                                            <p className = "font-medium text-stone-900">
                                                {execution.testName}
                                            </p>
                                            <p className = "mt-1 text-xs text-stone-500">
                                                {execution.className || execution.suiteName}
                                            </p>
                                        </td>

                                        <td className = "px-4 py-3">
                                            <span
                                                className = {`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${outcomeTone(
                                                    execution.outcome
                                                )}`}
                                            >
                                                {execution.outcome}
                                            </span>
                                        </td>

                                        <td className = "px-4 py-3 text-stone-600">
                                            {formatDuration(execution.durationMs)}
                                        </td>

                                        <td className = "px-4 py-3">
                                            <p className = "text-stone-900">{execution.workflowName}</p>
                                            <p className = "mt-1 text-xs text-stone-500">
                                                Attempt {execution.runAttempt} ·{" "}
                                                {execution.headBranch ?? "Unknown Branch"}
                                            </p>
                                        </td>

                                        <td className = "px-4 py-3 font-mono text-xs text-stone-600">
                                            {execution.headSha.slice(0,10)}
                                        </td>

                                        <td className = "max-w-80 px-4 py-3">
                                            {execution.failureMessage ? (
                                                <>
                                                    <p className = "font-medium text-rose-700">
                                                        {execution.failureType ?? "Failure"}
                                                    </p>
                                                    <p className = "mt-1 break-words text-xs leading-5 text-stone-600">
                                                        {execution.failureMessage}
                                                    </p>
                                                </>
                                            ) : (
                                                <span className = "text-stone-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {executions.length === 0 ? (
                                    <tr>
                                        <td colSpan = {6} className = "px-4 py-10 text-center text-stone-500">
                                            No test executions have been ingested yet.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
