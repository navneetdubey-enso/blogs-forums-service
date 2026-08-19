CREATE TYPE "public"."forum_topic_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_post_id" uuid,
	"is_reply" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" "forum_topic_status" DEFAULT 'DRAFT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_comment_id_comments_id_fk";
--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "thumbnail_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_topic_id_forum_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_post_id_forum_posts_id_fk" FOREIGN KEY ("parent_post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_forum_posts_topic_created_at_id" ON "forum_posts" USING btree ("topic_id","created_at","id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_parent_post_id" ON "forum_posts" USING btree ("parent_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_topics_slug_uidx" ON "forum_topics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "forum_topics_forum_id_idx" ON "forum_topics" USING btree ("forum_id");--> statement-breakpoint
CREATE INDEX "forum_topics_user_id_idx" ON "forum_topics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forum_topics_status_idx" ON "forum_topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "forum_topics_created_at_idx" ON "forum_topics" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "forums_slug_uidx" ON "forums" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "forums_created_at_idx" ON "forums" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;