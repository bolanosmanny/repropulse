import type { FastifyPluginAsync } from "fastify";
import { listTestExecutionsForRepository } from "../history/test-execution-repository.js";

type TestExecutionsRequest = {
  Params: {
    repositoryId: string;
  };
  Querystring: {
    testDefinitionId?: string;
    limit?: string;
  };
};

export const testExecutionsRoutes: FastifyPluginAsync = async (app) => {
  app.get<TestExecutionsRequest>(
    "/api/v1/repositories/:repositoryId/test-executions",
    {
      schema: {
        tags: ["Repositories"],
        summary: "List test execution history",
        description:
          "Returns execution evidence ordered from newest to oldest. Results can be filtered to one test definition.",
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
        querystring: {
          type: "object",
          properties: {
            testDefinitionId: {
              type: "integer",
              minimum: 1,
              description: "Optional test definition ID to filter by.",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 250,
              description: "Maximum number of executions to return. Defaults to 100.",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const repositoryId = Number(request.params.repositoryId);
      const rawTestDefinitionId = request.query.testDefinitionId;
      const rawLimit = request.query.limit;

      if (!Number.isSafeInteger(repositoryId) || repositoryId < 1) {
        return reply.code(400).send({
          error: "Invalid Repository ID",
        });
      }

      const testDefinitionId =
        rawTestDefinitionId == null ? undefined : Number(rawTestDefinitionId);

      if (
        testDefinitionId != null &&
        (!Number.isSafeInteger(testDefinitionId) || testDefinitionId < 1)
      ) {
        return reply.code(400).send({
          error: "Invalid Test Definition ID",
        });
      }

      const limit = rawLimit == null ? 100 : Number(rawLimit);

      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 250) {
        return reply.code(400).send({
          error: "Limit must be an integer between 1 and 250",
        });
      }

      const executions = await listTestExecutionsForRepository(repositoryId, {
        limit,
        testDefinitionId,
      });

      return {
        repositoryId,
        executions,
      };
    }
  );
};
