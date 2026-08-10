import { 
    index,
    integer,
    jsonb,
    pgTable,
    serial,
    timestamp,
    varchar,
    bigint,
    text,
    uniqueIndex
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

export const repositories = pgTable(
    "repositories",
    {
        id: serial("id").primaryKey(),
        githubRepositoryId: bigint("github_repository_id", {
            mode: "number",
        })
            .notNull()
            .unique(),
        fullName: varchar("full_name", { length: 255 }).notNull(),
        defaultBranch: varchar("default_branch", { length: 255 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex("repositories_full_name_unique").on(table.fullName),
    ]
);

export const workflowRuns = pgTable(
    "workflow_runs",
    {
        id: serial("id").primaryKey(),
        githubWorkflowRunId: bigint("github_workflow_run_id", {
            mode: "number",
        })
            .notNull()
            .unique(),
        repositoryId: integer("repository_id")
            .notNull()
            .references(() => repositories.id),
        workflowName: varchar("workflow_name", { length: 255 }).notNull(),
        status: varchar("status", { length: 50 }).notNull(),
        conclusion: varchar("conclusion", { length: 50 }),
        headSha: varchar("head_sha", { length: 64 }).notNull(),
        headBranch: varchar("head_branch", { length: 255 }),
        runAttempt: integer("run_attempt").notNull().default(1),
        startedAt: timestamp("started_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("workflow_runs_repository_id_idx").on(table.repositoryId),
        index("workflow_runs_head_sha_idx").on(table.headSha),
        index("workflow_runs_conclusion_idx").on(table.conclusion),
    ]
);

export const testDefinitions = pgTable(
    "test_definitions",
    {
        id: serial("id").primaryKey(),
        repositoryId: integer("repository_id")
            .notNull()
            .references(() => repositories.id),
        suiteName: varchar("suite_name", { length: 255 }).notNull(),
        className: varchar("class_name", { length: 500 })
            .notNull()
            .default(""),
        testName: varchar("test_name", { length: 500 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex("test_definitions_identity_unique").on(
            table.repositoryId,
            table.suiteName,
            table.className,
            table.testName
        ),
        index("test_definitions_repository_id_idx").on(table.repositoryId),
    ]
);

export const testExecutions = pgTable(
    "test_executions",
    {
        id: serial("id").primaryKey(),
        workflowRunId: integer("workflow_run_id")
            .notNull()
            .references(() => workflowRuns.id),
        testDefinitionId: integer("test_definition_id")
            .notNull()
            .references(() => testDefinitions.id),
        outcome: varchar("outcome", { length: 20 }).notNull(),
        durationMs: integer("duration_ms"),
        failureType: varchar("failure_type", { length: 255 }),
        failureMessage: text("failure_message"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex("test_executions_run_test_unique").on(
            table.workflowRunId,
            table.testDefinitionId
        ),
        index("test_executions_workflow_run_id_idx").on(table.workflowRunId),
        index("test_executions_test_definition_id_idx").on(table.testDefinitionId),
        index("test_executions_outcome_idx").on(table.outcome),
    ]
);
