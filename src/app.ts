import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { githubWebhooksRoutes } from "./routes/github-webhooks.js";
import { healthRoutes } from "./routes/health.js";
import { testReportRoutes } from "./routes/test-reports.js";
import { flakeScoreRoutes } from "./routes/flake-scores.js";
import { workflowRunRoutes } from "./routes/workflow-runs.js";
import { testExecutionsRoutes } from "./routes/test-executions.js";
import { ingestionJobRoutes } from "./routes/ingestion-jobs.js";
import { reliabilityMetricsRoutes } from "./routes/reliability-metrics.js";
import { repositoryRoutes } from "./routes/repositories.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "ReproPulse API",
        description:
          "API for GitHub CI reliability ingestion, deterministic flake scoring, and operational metrics.",
        version: "1.0.0",
      },
      tags: [
        {
          name: "Health",
          description: "Service availability checks.",
        },
        {
          name: "Repositories",
          description: "Connected GitHub repositories and repository-scoped data.",
        },
        {
          name: "Ingestion",
          description: "GitHub webhook and JUnit report ingestion endpoints.",
        },
        {
          name: "Operations",
          description: "Background queue and dead-letter operational visibility.",
        },
      ],
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
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
  app.register(ingestionJobRoutes);
  app.register(reliabilityMetricsRoutes);
  app.register(repositoryRoutes);

  return app;
}
