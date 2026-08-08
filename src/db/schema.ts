import { 
    index,
    integer,
    jsonb,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

export const webhookDeliveries = pgTable(
    "webhook_deliveries",
    {
        id: serial("id").primaryKey(),
        deliveryId: varchar("delivery_id", { length: 100 }).notNull().unique(),
        eventName: varchar("event_name", { length: 100 }).notNull(),
        payload: jsonb("payload").notNull(),
        status: varchar("status", { length: 20 }).notNull().default("received"),
        attemptCount: integer("attempt_count").notNull().default(0),
        receivedAt: timestamp("received_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        processedAt: timestamp("processed_at", { withTimezone: true }),
    },
    (table) => [
        index("webhook_deliveries_status_idx").on(table.status),
        index("webhook_deliveries_received_at_idx").on(table.receivedAt),
    ]
);