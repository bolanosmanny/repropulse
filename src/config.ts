import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    GITHUB_WEBHOOK_SECRET: z.string().min(32),
    REPROPULSE_INGESTION_TOKEN: z.string().min(32),
});

export const env = environmentSchema.parse(process.env);
