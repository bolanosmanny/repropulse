import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Check service health",
        description:
          "Returns a lightweight availability response. Used by Docker health checks and deployment verification.",
        response: {
          200: {
            type: "object",
            properties: {
              service: { type: "string", examples: ["repropulse"] },
              status: { type: "string", examples: ["ok"] },
            },
            required: ["service", "status"],
          },
        },
      },
    },
    async () => ({
      service: "repropulse",
      status: "ok",
    })
  );
};