CREATE TABLE "forum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(255) NOT NULL,
	"sub_category" text[],
	"media_id" uuid,
	"media_url" text,
	"like_count" integer DEFAULT 0 NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_topics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forums_category" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "forum_topics" CASCADE;--> statement-breakpoint
DROP TABLE "forums_category" CASCADE;--> statement-breakpoint
ALTER TABLE "forum_comments" DROP CONSTRAINT "forum_comments_topic_id_forum_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "forum_likes" DROP CONSTRAINT "forum_likes_category_id_forums_category_id_fk";
--> statement-breakpoint
DROP INDEX "idx_forum_comments_topic_created_at_id";--> statement-breakpoint
DROP INDEX "unique_category_user_like";--> statement-breakpoint
ALTER TABLE "forum_comments" ADD COLUMN "forum_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_likes" ADD COLUMN "forum_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "forum" ADD CONSTRAINT "forum_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum" ADD CONSTRAINT "forum_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forums_user_id_idx" ON "forum" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forums_created_at_idx" ON "forum" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_forum_id_forum_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_forum_id_forum_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_forum_comments_forum_created_at_id" ON "forum_comments" USING btree ("forum_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_category_user_like" ON "forum_likes" USING btree ("forum_id","user_id");--> statement-breakpoint
ALTER TABLE "forum_comments" DROP COLUMN "topic_id";--> statement-breakpoint
ALTER TABLE "forum_likes" DROP COLUMN "category_id";--> statement-breakpoint
DROP TYPE "public"."forum_topic_status";