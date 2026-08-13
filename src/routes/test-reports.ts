import type { FastifyPluginAsync } from "fastify";
import { verifyIngestionToken } from "../ingestion/ingestion-token.js";
import { testReportQueue } from "../queue/test-report-queue.js";

type TestReportUploadedRequest = {
  Headers: {
    "x-repropulse-token": string;
    "x-repropulse-workflow-run-id": string;
  };
  Body: string;
};

export const testReportRoutes: FastifyPluginAsync = async (app) => {
  app.post<TestReportUploadedRequest>(
    "/api/v1/test-reports",
    {
      schema: {
        tags: ["Ingestion"],
        summary: "Upload a JUnit test report",
        description:
          "Accepts JUnit XML from the ReproPulse GitHub Action and queues asynchronous report ingestion. Requires a valid ingestion token.",
        consumes: ["application/xml", "text/xml"],
        headers: {
          type: "object",
          properties: {
            "x-repropulse-token": {
              type: "string",
              description: "Server-side ingestion token.",
            },
            "x-repropulse-workflow-run-id": {
              type: "string",
              description: "GitHub Actions workflow run ID.",
            },
          },
          required: [
            "x-repropulse-token",
            "x-repropulse-workflow-run-id",
          ],
        },
      },
    },
    async (request, reply) => {
      if (!verifyIngestionToken(request.headers["x-repropulse-token"])) {
        return reply.code(401).send({
          error: "Invalid ingestion token",
        });
      }

      const githubWorkflowRunId = Number(
        request.headers["x-repropulse-workflow-run-id"]
      );

      if (
        !Number.isSafeInteger(githubWorkflowRunId) ||
        githubWorkflowRunId < 1
      ) {
        return reply.code(400).send({
          error: "Invalid workflow run ID",
        });
      }

      if (request.body.trim().length === 0) {
        return reply.code(400).send({
          error: "Test report body cannot be empty",
        });
      }

      await testReportQueue.add(
        "process-test-report",
        {
          githubWorkflowRunId,
          xml: request.body,
        },
        {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 1000,
          removeOnFail: 1000,
        }
      );

      return reply.code(202).send({
        accepted: true,
        githubWorkflowRunId,
      });
    }
  );
};