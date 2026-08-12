import { Worker } from 'bullmq';
import pino from 'pino';
import { redisConnection } from "../queue/redis-connection.js";
import type { ProcessTestReportJob } from "../queue/test-report-queue.js";
import { parseJUnitXml } from "../ingestion/junit-parser.js";
import { storeTestReport } from "../ingestion/test-report-repository.js";
import { deadLetterQueue } from "../queue/dead-letter-queue.js";

const logger = pino({
    name: "test-report-worker",
});

const worker = new Worker<ProcessTestReportJob>(
    "test-report-ingestion",
    async (job) => { 
        logger.info(
            {
                githubWorkflowRunId: job.data.githubWorkflowRunId,
            },
            "Processing test report"
        );

        const parsedTests = parseJUnitXml(job.data.xml);

        const result = await storeTestReport(
            job.data.githubWorkflowRunId,
            parsedTests
        );

        logger.info(
            {
                githubWorkflowRunId: job.data.githubWorkflowRunId,
                storedTestCount: result.storedTestCount,
            },
            "Test report processed"
        );
    },
    {
        connection: redisConnection,
        concurrency: 2,
    }
);

worker.on("failed", (job, error) => { 
    logger.error(
        {
            jobId: job?.id,
            err: error,
        },
        "Test report job failed"
    );

    if (job == null || job.attemptsMade < (job.opts.attempts ?? 1)) { 
        return;
    }

    void deadLetterQueue
        .add(
            "test-report-failed",
            {
                sourceQueue: "test-report-ingestion",
                sourceJobId: job.id,
                jobName: job.name,
                attemptsMade: job.attemptsMade,
                failedReason: error.message,
                failedAt: new Date().toISOString(),
            },
            {
                jobId: `dead-letter-test-report-${job.id}`,
            }
        )
        .catch((deadLetterError) => { 
            logger.error(
                { jobId: job.id, err: deadLetterError },
                "Failed ot record dead-letter job"
            );
        });
});
