import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              service: { type: "string" },
              status: { type: "string" },
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