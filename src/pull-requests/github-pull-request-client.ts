import { getInstallationOctokit } from "../github-app/github-app-client.js";
import type { PullRequestGitHubClient } from "./pull-request-feedback-service.js";

export async function createPullRequestGitHubClient(
    githubInstallationId: number
): Promise<PullRequestGitHubClient> {
    const octokit = await getInstallationOctokit(
        githubInstallationId
    );

    return { 
        async listChangedFiles(input) {
            const files = await octokit.paginate(
                octokit.rest.pulls.listFiles,
                {
                    owner: input.owner,
                    repo: input.repo,
                    pull_number: input.pullRequestNumber,
                    per_page: 100,
                }
            );

            return files.map((file) => file.filename);
        },

        async findExistingReproPulseComment(input) {
            const comments = await octokit.paginate(
                octokit.rest.issues.listComments,
                {
                    owner: input.owner,
                    repo: input.repo,
                    issue_number: input.pullRequestNumber,
                    per_page: 100,
                }
            );

            const existingComment = comments.find((comment) => 
                comment.body?.includes("<!-- repropulse-flake-risk -->")
            );

            return existingComment == null
                ? null
                : { commentId: existingComment.id };
        },

        async createComment(input) {
            const response = await octokit.rest.issues.createComment({
                owner: input.owner,
                repo: input.repo,
                issue_number: input.pullRequestNumber,
                body: input.body,
            });

            return {
                commentId: response.data.id,
            };
        },
    };
}
