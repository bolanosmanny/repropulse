import Fastify from "fastify";
import { githubWebhooksRoutes } from "./routes/github-webhooks.js";
import { healthRoutes } from "./routes/health.js";
import { testReportRoutes } from "./routes/test-reports.js";

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

  app.addContentTypeParser(
    "application/xml",
    { parseAs: "string" },
    (_request, body, done) => { 
        done(null, body);
    }
  );

  app.addContentTypeParser(
    "text/xml",
    { parseAs: "string" },
    (_request, body, done) => { 
        done(null, body);
    }
  );

  app.register(healthRoutes);
  app.register(githubWebhooksRoutes);
  app.register(testReportRoutes);

  return app;
}