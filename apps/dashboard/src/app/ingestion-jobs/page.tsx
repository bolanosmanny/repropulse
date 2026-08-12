import Link from "next/link";
import { getIngestionQueueStatus } from "@/lib/repropulse-api";

export const dynamic = "force-dynamic";

function queueLabel(queueName: string) { 
    if (queueName === "webhook-deliveries") { 
        return "GitHub webhook deliveries";
    }

    if (queueName === "test-report-ingestion") { 
        return "JUnit report ingestion"
    }

    return queueName;
}

export default async function IngestionJobsPage() { 
    const { queues, deadLetterJobs } = await getIngestionQueueStatus();

    const totalWaiting = queues.reduce(
        (total, queue) => total + queue.counts.waiting,
        0
    );

    const totalActive = queues.reduce(
        (total, queue) => total + queue.counts.active,
        0
    );

    const totalFailed = deadLetterJobs.length;

    const totalCompleted = queues.reduce(
        (total, queue) => total + queue.counts.completed,
        0
    );

    return ( 
        <main className = "min-h-screen bg-stone-100">
            <header className = "flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
                <p className = "text-sm text-stone-500">
                    Operations <span className = "px-1 text-stone-300">/</span> Ingestion Jobs
                </p>

                <Link 
                    href = "/"
                    className = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
                >
                    Back to Overview
                </Link>
            </header>

            <div className = "mx-auto max-w-6xl p-4">
                <div>
                    <h1 className = "text-xl font-medium tracking-tight">Ingestion Jobs</h1>
                    <p className = "mt-1 max-w-3xl text-sm text-stone-600">
                        Monitor the background queues that process GitHub webhooks and JUnit test reports. Jobs retry up to five times with exponential backoff.
                    </p>
                </div>

                <section className = "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ["Waiting", String(totalWaiting), "Queued for a worker"],
                        ["Active", String(totalActive), "Currently Processing"],
                        ["Completed Retained", String(totalCompleted), "Recent Successful Jobs"],
                        ["Terminal Failures", String(totalFailed), "Failed after all retries"],
                    ].map(([label, value, helper]) => (
                        <div 
                            key = {label}
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

                <section className = "mt-5 grid gap-4 lg:grid-cols-2">
                    {queues.map((queue) => (
                        <article
                            key = {queue.queueName}
                            className = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                        >
                            <div className = "flex items-start justify-between gap-4">
                                <div>
                                    <h2 className = "font-medium text-stone-900">
                                        {queueLabel(queue.queueName)}
                                    </h2>
                                    <p className = "mt-1 font-mono text-xs text-stone-500">
                                        {queue.queueName}
                                    </p>
                                </div>

                                <span
                                    className = {`rounded-full px-2 py-1 text-xs font-medium ${
                                        queue.counts.failed > 0
                                            ? "border-rose-200 bg-rose-50 text-rose-700"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    {queue.counts.failed > 0 ? "Needs Attention" : "Healthy"}
                                </span>
                            </div>

                            <dl className = "mt-5 grid grid-cols-2 gap-3">
                                {[
                                    ["Waiting", queue.counts.waiting],
                                    ["Active", queue.counts.active],
                                    ["Delayed", queue.counts.delayed],
                                    ["Completed", queue.counts.completed],
                                    ["Failed", queue.counts.failed],
                                ].map(([label, value]) => (
                                    <div key = {label} className = "rounded-lg bg-stone-50 p-3">
                                        <dt className = "text-xs text-stone-500">{label}</dt>
                                        <dd className = "mt-1 text-lg font-medium text-stone-900">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    ))}
                </section>

                <section className = "mt-5 overfloow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className = "border-b border-stone-200 px-4 py-3">
                        <h2 className = "font-medium text-stone-900">
                            Recent Terminal Failures
                        </h2>
                        <p className = "mt-1 text-sm text-stone-500">
                            Jobs listed here exhausted their retry attempts and need investigation.
                        </p>
                    </div>

                    <div className = "overflow-x-auto">
                        <table className = "w-full min-w-[760px] text-left text-sm">
                            <thead className = "border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className = "px-4 py-3 font-medium">Queue</th>
                                    <th className = "px-4 py-3 font-medium">Job</th>
                                    <th className = "px-4 py-3 font-medium">Attempts</th>
                                    <th className = "px-4 py-3 font-medium">Failure Reason</th>
                                    <th className = "px-4 py-3 font-medium">Created</th>
                                </tr>
                            </thead>

                            <tbody className = "divide-y divide-stone-100">
                                {deadLetterJobs.map((job) => (
                                    <tr key = {`${job.sourceQueue}-${job.id}`}>
                                        <td className = "px-4 py-3 text-stone-600">
                                            {queueLabel(job.sourceQueue)}
                                        </td>
                                        <td className = "px-4 py-3 font-mono text-xs text-stone-600">
                                            {job.id ?? "Unknown ID"}
                                        </td>
                                        <td className = "px-4 py-3 text-stone-600">
                                            {job.attemptsMade}
                                        </td>
                                        <td className = "max-w-80 px-4 py-3 break-words text-rose-700">
                                            {job.failedReason ?? "Unknown Failure"}
                                        </td>
                                        <td className = "px-4 py-3 text-stone-600">
                                            {new Date(job.failedAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {deadLetterJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan = {5} className = "px-4 py-10 text-center text-stone-500">
                                            No terminal failures. Both ingestion queues are healthy.
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

