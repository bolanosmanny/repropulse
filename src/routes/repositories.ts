import type { FastifyPluginAsync } from "fastify";
import { listRepositories } from "../repositories/repository-repository.js";

export const repositoryRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/repositories",
    {
      schema: {
        tags: ["Repositories"],
        summary: "List connected repositories",
        description:
          "Returns repositories that have been observed through GitHub webhooks or JUnit report ingestion.",
        response: {
          200: {
            type: "object",
            properties: {
              repositories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", examples: [5] },
                    fullName: {
                      type: "string",
                      examples: ["bolanosmanny/stratos"],
                    },
                    defaultBranch: {
                      type: ["string", "null"],
                      examples: ["main"],
                    },
                  },
                  required: ["id", "fullName", "defaultBranch"],
                },
              },
            },
            required: ["repositories"],
          },
        },
      },
    },
    async () => ({
      repositories: await listRepositories(),
    })
  );
};