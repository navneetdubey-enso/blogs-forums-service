ALTER TABLE "blogs" ADD COLUMN "search_vector" tsvector;
--> statement-breakpoint
UPDATE "blogs"
SET "search_vector" = to_tsvector(
  'english',
  coalesce("title", '') || ' ' || coalesce("content", '')
);
--> statement-breakpoint
CREATE INDEX "blogs_search_vector_gin_idx" ON "blogs" USING gin ("search_vector");
