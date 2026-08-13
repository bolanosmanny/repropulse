CREATE TABLE "pull_request_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"github_installation_id" bigint NOT NULL,
	"pull_request_number" integer NOT NULL,
	"head_sha" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"risk_count" integer DEFAULT 0 NOT NULL,
	"github_comment_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pull_request_feedback" ADD CONSTRAINT "pull_request_feedback_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pull_request_feedback_commit_unique" ON "pull_request_feedback" USING btree ("repository_id","pull_request_number","head_sha");--> statement-breakpoint
CREATE INDEX "pull_request_feedback_status_idx" ON "pull_request_feedback" USING btree ("status");