import { Worker } from "bullmq";
import pino from "pino";
import {
    findWebhookDeliveryByDeliveryId,
    markWebhookDeliveryFailed,
    markWebhookDeliveryProcessed,
} from "../webhooks/delivery-repository.js";
import { redisConnection } from "../queue/redis-connection.js";
import type { ProcessWebhookDeliveryJob } from "../queue/webhook-delivery-queue.js";
import { deadLetterQueue } from "../queue/dead-letter-queue.js";
import { parseWorkflowRunWebhookPayload } from "../workflows/workflow-run-payload.js";
import { upsertWorkflowRun } from "../workflows/workflow-run-repository.js";
import { parseInstallationWebhookPayload } from "../github-app/installation-payload.js";
import { upsertGitHubInstallation } from "../github-app/installation-repository.js";
import {
    parsePullRequestWebhookPayload,
    shouldEvaluatePullRequest,
} from "../pull-requests/pull-request-payload.js";
import {
    claimPendingPullRequestFeedback,
    createPullRequestFeedback,
    markPullRequestFeedbackCommented,
    markPullRequestFeedbackNoRisk,
    releasePullRequestFeedbackClaim,
} from "../pull-requests/pull-request-feedback-repository.js";
import {
    evaluatePullRequestFeedback,
} from "../pull-requests/pull-request-feedback-service.js";
import {
    createPullRequestGitHubClient,
} from "../pull-requests/github-pull-request-client.js";
import {
    getFlakeScoresForRepository,
} from "../scoring/flake-score-repository.js";

const logger = pino({
    name: "webhook-delivery-worker",
});

const worker = new Worker<ProcessWebhookDeliveryJob>(
    "webhook-deliveries",
    async (job) => {
        const delivery = await findWebhookDeliveryByDeliveryId(
            job.data.deliveryId
        );

        if (delivery == null) {
            throw new Error(
                `Webhook delivery ${job.data.deliveryId} was not found`
            );
        }

        if (delivery.status === "processed") {
            logger.info(
                { deliveryId: delivery.deliveryId },
                "Webhook delivery was already processed"
            );
            return;
        }

        if (delivery.eventName === "workflow_run") {
            const payload = parseWorkflowRunWebhookPayload(
                delivery.payload
            );

            const workflowRun = await upsertWorkflowRun(payload);

            logger.info(
                {
                    deliveryId: delivery.deliveryId,
                    githubWorkflowRunId: workflowRun.githubWorkflowRunId,
                },
                "Workflow run stored"
            );
        } else if (delivery.eventName === "installation") {
            const payload = parseInstallationWebhookPayload(
                delivery.payload
            );

            const isActive =
                payload.action === "created" ||
                payload.action === "unsuspend";

            await upsertGitHubInstallation({
                githubInstallationId: payload.installation.id,
                accountLogin: payload.installation.account.login,
                accountType: payload.installation.account.type,
                isActive,
                suspendedAt:
                    payload.installation.suspended_at == null
                        ? null
                        : new Date(payload.installation.suspended_at),
            });
        } else if (delivery.eventName === "pull_request") {
            const payload = parsePullRequestWebhookPayload(
                delivery.payload
            );

            if (!shouldEvaluatePullRequest(payload)) {
                logger.info(
                    {
                        deliveryId: delivery.deliveryId,
                        action: payload.action,
                    },
                    "Ignoring pull request action"
                );
            } else {
                const feedback = await createPullRequestFeedback({
                    githubRepositoryId: payload.repository.id,
                    repositoryFullName: payload.repository.full_name,
                    githubInstallationId: payload.installation.id,
                    pullRequestNumber: payload.number,
                    headSha: payload.pull_request.head.sha,
                });

                if (feedback == null) {
                    logger.info(
                        {
                            deliveryId: delivery.deliveryId,
                            pullRequestNumber: payload.number,
                            headSha: payload.pull_request.head.sha,
                        },
                        "Pull request feedback was already recorded"
                    );
                } else {
                    const claimed =
                        await claimPendingPullRequestFeedback(
                            feedback.id
                        );

                    if (claimed == null) {
                        logger.info(
                            { feedbackId: feedback.id },
                            "Pull request feedback was already claimed"
                        );
                    } else {
                        const [owner, repo] =
                            payload.repository.full_name.split("/");

                        if (owner == null || repo == null) {
                            throw new Error(
                                `Invalid repository name: ${payload.repository.full_name}`
                            );
                        }

                        try {
                            const [githubClient, flakeScores] =
                                await Promise.all([
                                    createPullRequestGitHubClient(
                                        payload.installation.id
                                    ),
                                    getFlakeScoresForRepository(
                                        feedback.repositoryId
                                    ),
                                ]);

                            const result =
                                await evaluatePullRequestFeedback({
                                    githubClient,
                                    flakeScores,
                                    owner,
                                    repo,
                                    pullRequestNumber: payload.number,
                                });

                            if (result.status === "no_risk") {
                                await markPullRequestFeedbackNoRisk(
                                    feedback.id
                                );
                            } else {
                                await markPullRequestFeedbackCommented({
                                    feedbackId: feedback.id,
                                    riskCount: result.riskCount,
                                    githubCommentId: result.commentId,
                                });
                            }

                            logger.info(
                                {
                                    feedbackId: feedback.id,
                                    status: result.status,
                                    riskCount: result.riskCount,
                                },
                                "Pull request feedback evaluated"
                            );
                        } catch (error) {
                            await releasePullRequestFeedbackClaim(
                                feedback.id
                            );
                            throw error;
                        }
                    }
                }
            }
        } else {
            logger.info(
                {
                    deliveryId: delivery.deliveryId,
                    eventName: delivery.eventName,
                },
                "Ignoring unsupported webhook event type"
            );
        }

        await markWebhookDeliveryProcessed(delivery.deliveryId);

        logger.info(
            {
                deliveryId: delivery.deliveryId,
                eventName: delivery.eventName,
            },
            "Webhook delivery processed"
        );
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

worker.on("failed", (job, error) => {
    logger.error(
        {
            jobId: job?.id,
            err: error,
        },
        "Webhook delivery job failed"
    );

    if (job == null || job.attemptsMade < (job.opts.attempts ?? 1)) {
        return;
    }

    void markWebhookDeliveryFailed(job.data.deliveryId).catch(
        (statusError) => {
            logger.error(
                { deliveryId: job.data.deliveryId, err: statusError },
                "Failed to mark webhook delivery as failed"
            );
        }
    );

    void deadLetterQueue
        .add(
            "webhook-deliveries-failed",
            {
                sourceQueue: "webhook-deliveries",
                sourceJobId: job.id,
                jobName: job.name,
                attemptsMade: job.attemptsMade,
                failedReason: error.message,
                failedAt: new Date().toISOString(),
            },
            {
                jobId: `dead-letter-webhook-${job.id}`,
            }
        )
        .catch((deadLetterError) => {
            logger.error(
                { jobId: job.id, err: deadLetterError },
                "Failed to record dead-letter job"
            );
        });
});
