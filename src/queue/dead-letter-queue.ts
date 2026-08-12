import { Queue } from "bullmq";
import { redisConnection } from "./redis-connection.js";

export type DeadLetterJob = { 
    sourceQueue: "webhook-deliveries" | "test-report-ingestion";
    sourceJobId: string | undefined;
    jobName: string;
    attemptsMade: number;
    failedReason: string;
    failedAt: string;
};

export const deadLetterQueue = new Queue<DeadLetterJob>(
    "dead-letter-jobs",
    {
        connection: redisConnection,
    }
);