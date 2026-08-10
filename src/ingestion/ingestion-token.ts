import { timingSafeEqual } from "node:crypto";
import { env } from "../config.js";

export function verifyIngestionToken(providedToken: string): boolean { 
    const expectedToken = Buffer.from(env.REPROPULSE_INGESTION_TOKEN);
    const receivedToken = Buffer.from(providedToken);

    if (receivedToken.length !== expectedToken.length) { 
        return false;
    }

    return timingSafeEqual(expectedToken, receivedToken);
}