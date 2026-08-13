import Link from "next/link";
import { getDashboardData } from "@/lib/repropulse-api";
import { RepositorySwitcher } from "@/components/repository-switcher";
import {
  getRepositorySelection,
  repositoryHref,
  type RepositorySearchParams,
} from "@/lib/repository-selection";

export const dynamic = "force-dynamic";

function statusTone(status: string) { 
    if (status === "success") { 
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "failure") { 
        return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-stone-200 bg-stone-50 text-stone-700";
}

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: RepositorySearchParams;
}) {
  const { repositories, selectedRepository } =
    await getRepositorySelection(searchParams);

  const { workflowRuns } = await getDashboardData(selectedRepository.id);

    return ( 
        <main className = "min-h-screen bg-stone-100">
            <header className = "flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
                <p className = "text-sm text-stone-500">
                    Dashboard <span className = "px-1 text-stone-300">/</span> Workflow Runs
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

            <div className = "mx-auto max-w-6xl p-4">
                <div>
                    <h1 className = "text-xl font-medium tracking-tight">Workflow Runs</h1>
                    <p className = "mt-1 text-sm text-stone-600">
                        Every GitHub Actions workflow attempt ingested by ReproPulse.
                    </p>
                </div>

                <section className = "mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className = "overflow-x-auto">
                        <table className = "w-full min-w-[760px] text-left text-sm">
                            <thead className = "border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className = "px-4 py-3 font-medium">Workflow</th>
                                    <th className = "px-4 py-3 font-medium">Branch</th>
                                    <th className = "px-4 py-3 font-medium">Attempt</th>
                                    <th className = "px-4 py-3 font-medium">Status</th>
                                    <th className = "px-4 py-3 font-medium">Completed</th>
                                </tr>
                            </thead>

                            <tbody className = "divide-y divide-stone-100">
                                {workflowRuns.map((run) => {
                                    const result = run.conclusion ?? run.status;

                                    return ( 
                                        <tr key = {run.githubWorkflowRunId}>
                                            <td className = "px-4 py-3 font-medium text-stone-900">
                                                {run.workflowName}
                                            </td>
                                            <td className = "px-4 py-3 text-stone-600">
                                                {run.headBranch ?? "Unknown branch"}
                                            </td>
                                            <td className = "px-4 py-3 text-stone-600">
                                                Attempt {run.runAttempt}
                                            </td>
                                            <td className = "px-4 py-3">
                                                <span
                                                    className = {`inline-flex rounded-full border px-2 py-1 text-xs font-medium
                                                        ${statusTone(result)}`}
                                                >
                                                    {result}
                                                </span>
                                            </td>
                                            <td className = "px-4 py-3 text-stone-600">
                                                {run.completedAt
                                                    ? new Date(run.completedAt).toLocaleString()
                                                    : "In progress"}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {workflowRuns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className = "px-4 py-10 text-center text-stone-500">
                                            No workflow runs have been ingested yet.
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
