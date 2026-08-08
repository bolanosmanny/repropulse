import Fastify from "fastify";

export function buildApp() { 
    const app = Fastify({
        logger: true,
    });

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
                    }
                }
            }
        },
        async () => ({
            service: "repropulse",
            status: "ok",
        })
    );

    return app;
}