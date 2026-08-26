ALTER TABLE "forums" RENAME TO "forums_category";--> statement-breakpoint
ALTER TABLE "forum_likes" RENAME COLUMN "forum_id" TO "category_id";--> statement-breakpoint
ALTER TABLE "forum_topics" RENAME COLUMN "forum_id" TO "category_id";--> statement-breakpoint
ALTER TABLE "forum_likes" DROP CONSTRAINT "forum_likes_forum_id_forums_id_fk";
--> statement-breakpoint
ALTER TABLE "forum_topics" DROP CONSTRAINT "forum_topics_forum_id_forums_id_fk";
--> statement-breakpoint
DROP INDEX "unique_forum_user_like";--> statement-breakpoint
DROP INDEX "forum_topics_forum_id_idx";--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_category_id_forums_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forums_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_category_id_forums_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forums_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_category_user_like" ON "forum_likes" USING btree ("category_id","user_id");--> statement-breakpoint
CREATE INDEX "forum_topics_category_id_idx" ON "forum_topics" USING btree ("category_id");