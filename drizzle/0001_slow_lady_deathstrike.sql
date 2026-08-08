CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"default_branch" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_github_repository_id_unique" UNIQUE("github_repository_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_workflow_run_id" bigint NOT NULL,
	"repository_id" integer NOT NULL,
	"workflow_name" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"conclusion" varchar(50),
	"head_sha" varchar(64) NOT NULL,
	"head_branch" varchar(255),
	"run_attempt" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_runs_github_workflow_run_id_unique" UNIQUE("github_workflow_run_id")
);
--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_full_name_unique" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "workflow_runs_repository_id_idx" ON "workflow_runs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_head_sha_idx" ON "workflow_runs" USING btree ("head_sha");--> statement-breakpoint
CREATE INDEX "workflow_runs_conclusion_idx" ON "workflow_runs" USING btree ("conclusion");