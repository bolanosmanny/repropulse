import Fastify from "fastify";
import { githubWebhooksRoutes } from "./routes/github-webhooks.js";
import { healthRoutes } from "./routes/health.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_request, body, done) => {
      done(null, body);
    }
  );

  app.register(healthRoutes);
  app.register(githubWebhooksRoutes);

  return app;
}