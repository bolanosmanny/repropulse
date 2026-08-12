import type { FastifyPluginAsync } from "fastify";
import { getReliabilityMetrics } from "../metrics/reliability-metrics-repository.js";

type ReliabilityMetricsRequest = {
    Params: { 
        repositoryId: string;
    };
};

export const reliabilityMetricsRoutes: FastifyPluginAsync = async (app) => {
    app.get<ReliabilityMetricsRequest>(
        "/api/v1/repositories/:repositoryId/reliability-metrics",
        async (request, reply) => {
            const repositoryId = Number(request.params.repositoryId);

            if (!Number.isSafeInteger(repositoryId) || repositoryId < 1) {
                return reply.code(400).send({
                    error: "Invalid repository ID",
                });
            }

            return getReliabilityMetrics(repositoryId);
        }
    );
};
