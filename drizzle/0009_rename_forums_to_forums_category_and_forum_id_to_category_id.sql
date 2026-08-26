ALTER TABLE "forums" RENAME TO "forums_category";--> statement-breakpoint
ALTER TABLE "forum_topics" RENAME COLUMN "forum_id" TO "category_id";--> statement-breakpoint
ALTER INDEX "forum_topics_forum_id_idx" RENAME TO "forum_topics_category_id_idx";--> statement-breakpoint
ALTER TABLE "forum_topics" RENAME CONSTRAINT "forum_topics_forum_id_forums_id_fk" TO "forum_topics_category_id_forums_category_id_fk";--> statement-breakpoint
ALTER TABLE "forum_likes" RENAME COLUMN "forum_id" TO "category_id";--> statement-breakpoint
ALTER INDEX "unique_forum_user_like" RENAME TO "unique_category_user_like";--> statement-breakpoint
ALTER TABLE "forum_likes" RENAME CONSTRAINT "forum_likes_forum_id_forums_id_fk" TO "forum_likes_category_id_forums_category_id_fk";