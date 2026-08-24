ALTER TYPE "public"."blog_status" ADD VALUE 'PENDING_REVIEW' BEFORE 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "links" text[];