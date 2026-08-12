import Link from 'next/link';
import { getReliabilityMetrics } from "@/lib/repropulse-api";

export const dynamic = "force-dynamic";

function formatDuration(durationMs: number) { 
    if (durationMs < 1000) {
        return `${durationMs} ms`;
    }

    return `${(durationMs / 1000).toFixed(2)} s`;
}

export default async function FailureTrendsPage() { 
    const metrics = await getReliabilityMetrics(1);

    const maxExecutions = Math.max(
        1,
        ...metrics.failureTrend.map(
            (day) => day.passed + day.failed + day.skipped
        )
    );

    const totalFailed = metrics.failureTrend.reduce(
        (total, day) => total + day.failed,
        0
    );

    return (
        <main className = "min-h-screen bg-stone-100">
            <header className = "flex h-[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
                <p className = "text-sm text-stone-500">
                    Dashboard <span className = "px-1 text-stone-300">/</span> Failure Trends
                </p>

                <Link 
                    href ="/"
                    className = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
                >
                    Back to Overview
                </Link>
            </header>

            <div className = "mx-auto max-w-6xl p-4">
                <div>
                    <h1 className = "text-xl font-medium tracking-tight">Failure Trends</h1>
                    <p className = "mt-1 max-w-3xl text-sm text-stone-600">
                        Daily test outcomes and conservative estimated CI time lost to failures that recovered on a rerun of the same commit.
                    </p>
                </div>

                <section className = "mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                        [
                            "Failed or Errored",
                            String(totalFailed),
                            "Across the recorded execution history",
                        ],
                        [
                            "Flaky Tests Detected",
                            String(metrics.flakyTestsDetected),
                            "Recovered after a retry on the same commit",
                        ],
                        [
                            "Estimated CI Time Wasted",
                            formatDuration(metrics.estimatedCiTimeWastedMs),
                            "Initial failed-test duration only",
                        ],
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

                <section className = "mt-5 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div>
                        <h2 className = "font-medium text-stone-900">
                            Daily Execution Outcomes
                        </h2>
                        <p className = "mt-1 text-sm text-stone-500">
                            Each bar represents test executions completed on that day.
                        </p>
                    </div>

                    <div className = "mt-6 space-y-5">
                        {metrics.failureTrend.map((day) => { 
                            const passedWidth = (day.passed / maxExecutions) * 100;
                            const failedWidth = (day.failed / maxExecutions) * 100;
                            const skippedWidth = (day.skipped / maxExecutions) * 100;

                            return (
                                <div key = {day.date}>
                                    <div className = "flex items-center justify-between text-sm">
                                        <span className = "font-medium text-stone-900">{day.date}</span>
                                        <span className = "text-stone-500">
                                            {day.passed + day.failed + day.skipped} executions
                                        </span>
                                    </div>

                                    <div className = "mt-2 flex h-3 overflow-hidden rounded-full bg-stone-100">
                                        {passedWidth > 0 ? (
                                            <div 
                                                className = "bg-emerald-500"
                                                style = {{ width: `${passedWidth}%` }}
                                                title = {`${day.passed} passed`}
                                            />
                                        ): null}

                                        {failedWidth > 0 ? (
                                            <div 
                                                className = "bg-rose-500"
                                                style = {{ width: `${failedWidth}%` }}
                                                title = {`${day.failed} failed or errored`}
                                            />
                                        ) : null}

                                        {skippedWidth > 0 ? (
                                            <div
                                                className = "bg-stone-300"
                                                style = {{ width: `${skippedWidth}%` }}
                                                title = {`${day.skipped} skipped`}
                                            />
                                        ) : null}
                                    </div>

                                    <div className = "mt-2 flex gap-4 text-xs text-stone-500">
                                        <span>
                                            <span className = "mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                            {day.passed} passed
                                        </span>
                                        <span>
                                            <span className = "mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
                                            {day.failed} failed
                                        </span>
                                        <span>
                                            <span className = "mr-1 inline-block h-2 w-2 rounded-full bg-stone-300" />
                                            {day.skipped} skipped
                                        </span>
                                    </div>
                                </div>
                            )
                        })}

                        {metrics.failureTrend.length === 0 ? (
                            <p className = "py-8 text-center text-sm text-stone-500">
                                No completed test executions have been ingested yet.
                            </p>
                        ) : null}
                    </div>
                </section>

                <section className = "mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className = "border-b border-stone-200 px-4 py-3">
                        <h2 className = "font-medium text-stone-900">
                            Daily Breakdown
                        </h2>
                    </div>

                    <div className = "overflow-x-auto">
                        <table className = "w-full min-w-[640px] text-left text-sm">
                            <thead className = "border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className = "px-4 py-3 font-medium">Date</th>
                                    <th className = "px-4 py-3 font-medium">Passed</th>
                                    <th className = "px-4 py-3 font-medium">Failed / Errored</th>
                                    <th className = "px-4 py-3 font-medium">Skipped</th>
                                    <th className = "px-4 py-3 font-medium">Total</th>
                                </tr>
                            </thead>

                            <tbody className = "divide-y divide-stone-100">
                                {metrics.failureTrend.map((day) => (
                                    <tr key = {day.date}>
                                        <td className = "px-4 py-3 font-medium text-stone-900">
                                            {day.date}
                                        </td>
                                        <td className = "px-4 py-3 text-emerald-700">
                                            {day.passed}
                                        </td>
                                        <td className = "px-4 py-3 text-rose-700">
                                            {day.failed}
                                        </td>
                                        <td className = "px-4 py-3 text-stone-600">
                                            {day.skipped}
                                        </td>
                                        <td className = "px-4 py-3 text-stone-900">
                                            {day.passed + day.failed + day.skipped}
                                        </td>
                                    </tr>
                                ))}

                                {metrics.failureTrend.length === 0 ? (
                                    <tr>
                                        <td colSpan = {5} className = "px-4 py-10 text-center text-stone-500">
                                            No trend date yet.
                                        </td>
                                    </tr>
                                ): null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
