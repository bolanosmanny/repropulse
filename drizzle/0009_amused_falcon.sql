ALTER TABLE "test_definitions" ADD COLUMN "source_file" varchar(1000);--> statement-breakpoint
CREATE INDEX "test_definitions_source_file_idx" ON "test_definitions" USING btree ("source_file");