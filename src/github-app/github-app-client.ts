import { App } from "octokit";
import { env } from "../config.js";

let githubApp: App | undefined;

export function getGitHubApp() { 
    if ( 
        env.GITHUB_APP_ID == null ||
        env.GITHUB_APP_PRIVATE_KEY == null
    ) {
        throw new Error(
            "GitHub App authentication is not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY."
        );
    }

    githubApp ??= new App({
        appId: env.GITHUB_APP_ID,
        privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    return githubApp;
}

export async function getInstallationOctokit(
    githubInstallationId: number
) { 
    return getGitHubApp().getInstallationOctokit(githubInstallationId);
}
