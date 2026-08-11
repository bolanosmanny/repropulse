import Link from 'next/link';
import { getDashboardData } from '@/lib/repropulse-api';

export const dynamic = "force-dynamic";

function scoreTone(scorePercent: number) { 
    if (scorePercent >= 50) { 
        return {
            badge: "border-rose-200 bg-rose-50 text-rose-700",
            bar: "bg-rose-500",
            label: "High Risk",
        };
    } 

    if (scorePercent >= 25) { 
        return { 
            badge: "border-amber-200 bg-amber-50 text-amber-700",
            bar: "bg-amber-500",
            label: "Needs Review",
        };
    }

    return { 
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        bar: "bg-emerald-500",
        label: "Low Risk",
    };
}

export default async function FlakeScoresPage() { 
    const { scores } = await getDashboardData(1);

    const sortedScores = [...scores].sort(
        (left, right) =>
            right.flakeScore.scorePercent - left.flakeScore.scorePercent
    );

    const highRiskTests = scores.filter(
        (score) => score.flakeScore.scorePercent >= 50
    ).length;

    const transientFailures = scores.reduce(
        (total, score) => total + score.flakeScore.transientFailures,
        0
    );

    const rerunRecovered = scores.reduce(
        (total, score) => total + score.flakeScore.rerunResolvedCommits,
        0
    );

    return ( 
        <main className = "min-h-screen bg-stone-100">
            <header className = "flex -h[54px] items-center justify-between border-b border-stone-200 bg-stone-50 px-4">
                <p className = "text-sm text-stone-500">
                    Dashboard <span className = "px-1 text-stone-400">/</span> Flake Scores
                </p>

                <Link
                    href="/"
                    className = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
                >
                    Back to Overview
                </Link>
            </header>

            <div className = "mx-auto max-w-6xl p-4">
                <div>
                    <h1 className = "text-xl font-medium tracking-tight">Flake Scores</h1>
                    <p className = "mt-1 max-w-3xl text-sm text-stone-600">
                        Tests are scored when they fail and later pass on a rerun of the same commit, without a code change.
                    </p>
                </div>

                <section className = "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ["Tests Monitored", String(scores.length), "Unique Test Definitions"],
                        ["High Risk Tests", String(highRiskTests), "Score of 50% or More"],
                        ["Transient Failures", String(transientFailures), "Failures that later passed"],
                        ["Rerun Recoveries", String(rerunRecovered), "Commits with a Recovered Test"],
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
                    ) )}
                </section>

                <section className = "mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className = "border-b border-stone-200 px-4 py-3">
                        <h2 className = "font-medium text-stone-900">
                            Ranked Test Reliability
                        </h2>
                        <p className = "mt-1 text-sm text-stone-500">
                            Higher scores mean a larger share of completed attempts were transient failures.
                        </p>
                    </div>

                    <div className = "overflow-x-auto">
                        <table className = "w-full min-w-[880px] text-left text-sm">
                            <thead className = "border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className = "px-4 py-3 font-medium">Test</th>
                                    <th className = "px-4 py-3 font-medium">Flake Score</th>
                                    <th className = "px-4 py-3 font-medium">Completed Attempts</th>
                                    <th className = "px-4 py-3 font-medium">Transient Failures</th>
                                    <th className = "px-4 py-3 font-medium">Rerun Recoveries</th>
                                    <th className = "px-4 py-3 font-medium">Assessment</th>
                                </tr>
                            </thead>

                            <tbody className = "divide-y divide-stone-100">
                                {sortedScores.map((score) => {
                                    const { flakeScore } = score;
                                    const tone = scoreTone(flakeScore.scorePercent);

                                    return (
                                        <tr key = {score.testDefinitionId}>
                                            <td className = "px-4 py-3">
                                                <p className = "font-medium text-stone-900">
                                                    {score.testName}
                                                </p>
                                                <p className = "mt-1 text-xs text-stone-500">
                                                    {score.className || score.suiteName}
                                                </p>
                                            </td>

                                            <td className = "px-4 py-3">
                                                <div className = "flex min-w-36 items-center gap-3">
                                                    <div className = "h-2 w-20 overflow-hidden rounded-full bg-stone-100">
                                                        <div 
                                                            className = {`h-full rounded-full ${tone.bar}`}
                                                            style = {{ width: `${flakeScore.scorePercent}%`}}
                                                        />
                                                    </div>

                                                    <span className = "font-medium text-stone-900">
                                                        {flakeScore.scorePercent}%
                                                    </span>
                                                </div>
                                            </td>

                                            <td className = "px-4 py-3 text-stone-600">
                                                {flakeScore.completedAttempts}
                                            </td>
                                            <td className = "px-4 py-3 text-stone-600">
                                                {flakeScore.transientFailures}
                                            </td>
                                            <td className = "px-4 py-3 text-stone-600">
                                                {flakeScore.rerunResolvedCommits}
                                            </td>

                                            <td className = "px-4 py-3">
                                                <span 
                                                    className = {`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tone.badge}`}
                                                >
                                                    {tone.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {sortedScores.length === 0 ? (
                                    <tr>
                                        <td colSpan = {6} className = "px-4 text-center text-stone-500">
                                            No test reports have been ingested yet.
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