DROP INDEX "test_definitions_identify_unique";--> statement-breakpoint
ALTER TABLE "test_executions" ADD COLUMN "failure_message" text;--> statement-breakpoint
CREATE UNIQUE INDEX "test_definitions_identity_unique" ON "test_definitions" USING btree ("repository_id","suite_name","class_name","test_name");