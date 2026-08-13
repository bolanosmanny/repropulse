import type { PullRequestFlakeRisk } from "./flake-risk-evaluator.js";

function escapeMarkdownTable(value: string): string { 
    return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function displayTestName(risk: PullRequestFlakeRisk): string { 
    const prefix = 
        risk.className.length > 0 ? `${risk.className} › ` : "";

    return `${prefix}${risk.testName}`;
}

export function formatFlakeRiskComment(
    risks: PullRequestFlakeRisk[]
) : string { 
    if (risks.length === 0) {
        throw new Error("Cannot format a flake-risk comment without risks");
    }

    const rows = risks
        .map(
            (risk) =>
                `| \`${escapeMarkdownTable(risk.sourceFile)}\` | ${escapeMarkdownTable(displayTestName(risk))} | ${risk.scorePercent}% | ${risk.rerunResolvedCommits} |`
        )
        .join("\n");

    return [
        "<!-- repropulse-flake-risk -->",
        "## ReproPulse: flaky-test risk detected",
        "",
        "This pull request changes test files with confirmed same-commit fail-then-pass reruns.",
        "",
        "| Changed Test File | Test | Flake Score | Confirmed Rerun Resolutions |",
        "| --- | --- | --- | --- |",
        rows,
        "",
        "Review these tests before treating a CI failure as a product regression.",
    ].join("\n");
}
