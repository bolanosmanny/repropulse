import type { FastifyPluginAsync } from "fastify";
import { getReliabilityMetrics } from "../metrics/reliability-metrics-repository.js";

type ReliabilityMetricsRequest = {
  Params: {
    repositoryId: string;
  };
};

export const reliabilityMetricsRoutes: FastifyPluginAsync = async (app) => {
  app.get<ReliabilityMetricsRequest>(
    "/api/v1/repositories/:repositoryId/reliability-metrics",
    {
      schema: {
        tags: ["Repositories"],
        summary: "Get repository reliability metrics",
        description:
          "Returns workflow, JUnit ingestion, deterministic flake-detection, failure-trend, and webhook-processing metrics for one repository.",
        params: {
          type: "object",
          properties: {
            repositoryId: {
              type: "integer",
              minimum: 1,
              description: "Internal ReproPulse repository ID.",
              examples: [5],
            },
          },
          required: ["repositoryId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              repositoryId: { type: "integer", examples: [5] },
              workflowRunCount: { type: "integer", examples: [3] },
              testExecutionsStored: { type: "integer", examples: [51] },
              flakyTestsDetected: { type: "integer", examples: [0] },
              estimatedCiTimeWastedMs: { type: "integer", examples: [0] },
              failureTrend: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", examples: ["2026-08-13"] },
                    passed: { type: "integer", examples: [11] },
                    failed: { type: "integer", examples: [0] },
                    skipped: { type: "integer", examples: [0] },
                  },
                  required: ["date", "passed", "failed", "skipped"],
                },
              },
              webhookProcessing: {
                type: "object",
                properties: {
                  processed: { type: "integer", examples: [12] },
                  failed: { type: "integer", examples: [0] },
                  successRatePercent: {
                    type: ["number", "null"],
                    examples: [100],
                  },
                  p95LatencyMs: {
                    type: ["number", "null"],
                    examples: [112.497],
                  },
                },
                required: [
                  "processed",
                  "failed",
                  "successRatePercent",
                  "p95LatencyMs",
                ],
              },
            },
            required: [
              "repositoryId",
              "workflowRunCount",
              "testExecutionsStored",
              "flakyTestsDetected",
              "estimatedCiTimeWastedMs",
              "failureTrend",
              "webhookProcessing",
            ],
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string", examples: ["Invalid repository ID"] },
            },
            required: ["error"],
          },
        },
      },
    },
    async (request, reply) => {
      const repositoryId = Number(request.params.repositoryId);

      if (!Number.isSafeInteger(repositoryId) || repositoryId < 1) {
        return reply.code(400).send({
          error: "Invalid repository ID",
        });
      }

      return getReliabilityMetrics(repositoryId);
    }
  );
};

