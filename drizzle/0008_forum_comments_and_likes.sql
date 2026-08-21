ALTER TABLE "forum_posts" RENAME TO "forum_comments";--> statement-breakpoint
ALTER TABLE "forum_comments" RENAME COLUMN "parent_post_id" TO "parent_comment_id";--> statement-breakpoint
ALTER INDEX "idx_forum_posts_topic_created_at_id" RENAME TO "idx_forum_comments_topic_created_at_id";--> statement-breakpoint
ALTER INDEX "idx_forum_posts_parent_post_id" RENAME TO "idx_forum_comments_parent_comment_id";--> statement-breakpoint
ALTER TABLE "forum_comments" RENAME CONSTRAINT "forum_posts_topic_id_forum_topics_id_fk" TO "forum_comments_topic_id_forum_topics_id_fk";--> statement-breakpoint
ALTER TABLE "forum_comments" RENAME CONSTRAINT "forum_posts_user_id_users_id_fk" TO "forum_comments_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "forum_comments" RENAME CONSTRAINT "forum_posts_parent_post_id_forum_posts_id_fk" TO "forum_comments_parent_comment_id_forum_comments_id_fk";--> statement-breakpoint
ALTER TABLE "forums" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "forum_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_forum_user_like" ON "forum_likes" USING btree ("forum_id","user_id");
