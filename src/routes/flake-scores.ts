import type { FastifyPluginAsync } from "fastify";
import { getFlakeScoresForRepository } from "../scoring/flake-score-repository.js";

type FlakeScoreRequest = {
  Params: {
    repositoryId: string;
  };
};

export const flakeScoreRoutes: FastifyPluginAsync = async (app) => {
  app.get<FlakeScoreRequest>(
    "/api/v1/repositories/:repositoryId/flake-scores",
    {
      schema: {
        tags: ["Repositories"],
        summary: "Get deterministic flake scores",
        description:
          "Returns test-level flake scores. A transient failure is recorded when a test fails and later passes on the same commit.",
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

      const scores = await getFlakeScoresForRepository(repositoryId);

      return {
        repositoryId,
        scores,
      };
    }
  );
};