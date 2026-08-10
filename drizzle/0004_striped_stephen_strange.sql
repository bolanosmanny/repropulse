CREATE TABLE "test_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"suite_name" varchar(255) NOT NULL,
	"class_name" varchar(500) DEFAULT '' NOT NULL,
	"test_name" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_run_id" integer NOT NULL,
	"test_definition_id" integer NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"duration_ms" integer,
	"failure_type" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_definitions" ADD CONSTRAINT "test_definitions_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_workflow_run_id_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_test_definition_id_test_definitions_id_fk" FOREIGN KEY ("test_definition_id") REFERENCES "public"."test_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "test_definitions_identify_unique" ON "test_definitions" USING btree ("repository_id","suite_name","class_name","test_name");--> statement-breakpoint
CREATE INDEX "test_definitions_repository_id_idx" ON "test_definitions" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "test_executions_workflow_run_id_idx" ON "test_executions" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "test_executions_test_definition_id_idx" ON "test_executions" USING btree ("test_definition_id");--> statement-breakpoint
CREATE INDEX "test_executions_outcome_idx" ON "test_executions" USING btree ("outcome");