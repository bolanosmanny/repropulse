import type { Queue } from "bullmq";
import { testReportQueue } from "../queue/test-report-queue.js";
import { webhookDeliveryQueue } from "../queue/webhook-delivery-queue.js";
import {
    deadLetterQueue,
    type DeadLetterJob,
} from "../queue/dead-letter-queue.js"

type QueueStatus = { 
    queueName: string;
    counts: { 
        waiting: number;
        active: number;
        delayed: number;
        completed: number;
        failed: number;
    };
    failedJobs: { 
        id: string | undefined;
        name: string;
        attemptsMade: number;
        failedReason: string | undefined;
        timestamp: number;
    }[];
};

type DeadLetterRecord = DeadLetterJob & {
    id: string | undefined;
}

async function getQueueStatus(queue: Queue): Promise<QueueStatus> { 
    const counts = await queue.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "completed",
        "failed",
    );

    const failedJobs = await queue.getFailed(0,9);
    
    return { 
        queueName: queue.name,
        counts: {
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            delayed: counts.delayed ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
        },
        failedJobs: failedJobs.map((job) => ({
            id: job.id,
            name: job.name,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason,
            timestamp: job.timestamp
        })),
    };
}

async function getDeadLetterJobs(): Promise<DeadLetterRecord[]> { 
    const jobs = await deadLetterQueue.getJobs(["waiting"],0,9);

    return jobs.map((job) => ({
        id: job.id,
        ...job.data,
    }));
}

export async function getIngestionQueueStatus() { 
    const [queues, deadLetterJobs] = await Promise.all([
        Promise.all([
            getQueueStatus(webhookDeliveryQueue),
            getQueueStatus(testReportQueue),
        ]),
        getDeadLetterJobs(),
    ]);

    return {
        queues,
        deadLetterJobs, 
    };
}