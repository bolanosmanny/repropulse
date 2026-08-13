CREATE TABLE "github_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_installation_id" bigint NOT NULL,
	"account_login" varchar(255) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_installations_github_installation_id_unique" UNIQUE("github_installation_id")
);
--> statement-breakpoint
CREATE INDEX "github_installations_active_idx" ON "github_installations" USING btree ("is_active");