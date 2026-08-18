CREATE TYPE "public"."blog_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"thumbnail_media_id" uuid,
	"tags" text[],
	"status" "blog_status" NOT NULL,
	"reading_time" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_type" varchar(100) NOT NULL,
	"app_user_id" varchar(255) NOT NULL,
	"universe_user_id" uuid NOT NULL,
	"app_user_role" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blogs_slug_uidx" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blogs_user_id_idx" ON "blogs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blogs_status_idx" ON "blogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blogs_created_at_idx" ON "blogs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_app_type_app_user_id_uidx" ON "users" USING btree ("app_type","app_user_id");--> statement-breakpoint
CREATE INDEX "users_universe_user_id_idx" ON "users" USING btree ("universe_user_id");