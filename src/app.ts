import Fastify from "fastify";
import { githubWebhooksRoutes } from "./routes/github-webhooks.js";
import { healthRoutes } from "./routes/health.js";
import { testReportRoutes } from "./routes/test-reports.js";
import { flakeScoreRoutes } from "./routes/flake-scores.js";
import { workflowRunRoutes } from "./routes/workflow-runs.js";
import { testExecutionsRoutes } from "./routes/test-executions.js";

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
  app.register(flakeScoreRoutes);
  app.register(workflowRunRoutes);
  app.register(testExecutionsRoutes);

  return app;
}