import type { FastifyPluginAsync } from "fastify";
import { getIngestionQueueStatus } from "../operations/queue-status.js";

export const ingestionJobRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/operations/ingestion-jobs",
    {
      schema: {
        tags: ["Operations"],
        summary: "Get ingestion queue health",
        description:
          "Returns BullMQ queue counts, recent failed jobs, and terminal dead-letter records for webhook and JUnit ingestion.",
      },
    },
    async () => {
      return getIngestionQueueStatus();
    }
  );
};