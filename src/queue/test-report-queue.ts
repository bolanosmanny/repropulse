import { Queue } from 'bullmq';
import { redisConnection } from './redis-connection.js';

export type ProcessTestReportJob = { 
    githubWorkflowRunId: number;
    xml: string;
};

export const testReportQueue = new Queue<ProcessTestReportJob>(
    "test-report-ingestion",
    {
        connection: redisConnection,
    }
);