import type { FastifyPluginAsync } from "fastify";
import { listTestExecutionsForRepository } from "../history/test-execution-repository.js";

type TestExecutionsRequest = { 
    Params: { 
        repositoryId: string;
    };
    Querystring: { 
        testDefinitionId?: string;
        limit?: string;
    };
};

export const testExecutionsRoutes: FastifyPluginAsync = async (app) => { 
    app.get<TestExecutionsRequest>(
        "/api/v1/repositories/:repositoryId/test-executions",
        async (request, reply) => { 
            const repositoryId = Number(request.params.repositoryId);
            const rawTestDefinitionId = request.query.testDefinitionId;
            const rawLimit = request.query.limit;

            if (!Number.isSafeInteger(repositoryId) || repositoryId < 1) { 
                return reply.code(400).send({
                    error: "Invalid Repository ID",
                });
            }

            const testDefinitionId = rawTestDefinitionId == null
                ? undefined
                : Number(rawTestDefinitionId);

            if ( 
                testDefinitionId != null &&
                (!Number.isSafeInteger(testDefinitionId) || testDefinitionId < 1)
            ) { 
                return reply.code(400).send({
                    error: "Invalid Test Definiton ID",
                });
            }

            const limit = rawLimit == null ? 100 : Number(rawLimit);

            if (!Number.isSafeInteger(limit) || limit < 1 || limit > 250) {
                return reply.code(400).send({
                    error: "Limit must be an integer between 1 and 250",
                });
            }

            const executions = await listTestExecutionsForRepository(
                repositoryId,
                {
                    limit,
                    testDefinitionId,
                }
            );

            return {
                repositoryId,
                executions,
            };
        }
    );
};
