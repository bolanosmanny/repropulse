import type { FastifyPluginAsync } from "fastify";
import { listWorkflowRunsForRepository } from "../workflows/workflow-run-repository.js";

type WorkflowRunsRequest = {
  Params: {
    repositoryId: string;
  };
};

export const workflowRunRoutes: FastifyPluginAsync = async (app) => {
  app.get<WorkflowRunsRequest>(
    "/api/v1/repositories/:repositoryId/workflow-runs",
    {
      schema: {
        tags: ["Repositories"],
        summary: "List recent workflow runs",
        description:
          "Returns the 20 most recently completed or updated GitHub Actions workflow runs for a repository.",
        params: {
          type: "object",
          properties: {
            repositoryId: {
              type: "integer",
              minimum: 1,
              description: "Internal ReproPulse repository ID.",
            },
          },
          required: ["repositoryId"],
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

      const workflowRuns = await listWorkflowRunsForRepository(repositoryId);

      return {
        repositoryId,
        workflowRuns,
      };
    }
  );
};