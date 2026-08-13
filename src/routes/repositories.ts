import type { FastifyPluginAsync } from "fastify";
import { listRepositories } from "../repositories/repository-repository.js";

export const repositoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/repositories", async () => {
    return {
      repositories: await listRepositories(),
    };
  });
};