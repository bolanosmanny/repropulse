import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    GITHUB_WEBHOOK_SECRET: z.string().min(32),
    GITHUB_APP_ID: z.coerce.number().int().positive().optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
    REPROPULSE_INGESTION_TOKEN: z.string().min(32),
});

export const env = environmentSchema.parse(process.env);
