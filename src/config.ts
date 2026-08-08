import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
});

export const env = environmentSchema.parse(process.env);
