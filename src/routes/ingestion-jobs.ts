import type { FastifyPluginAsync } from "fastify";
import { getIngestionQueueStatus } from "../operations/queue-status.js";

export const ingestionJobRoutes: FastifyPluginAsync = async (app) => { 
    app.get("/api/v1/operations/ingestion-jobs", async () => { 
        return getIngestionQueueStatus();
    });
};