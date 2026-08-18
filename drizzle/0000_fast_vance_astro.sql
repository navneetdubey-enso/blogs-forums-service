CREATE TABLE "gateway_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_code" varchar(100) NOT NULL,
	"key_prefix" varchar(100) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "gateway_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE INDEX "gateway_api_keys_project_code_idx" ON "gateway_api_keys" USING btree ("project_code");--> statement-breakpoint
CREATE UNIQUE INDEX "gateway_api_keys_one_active_project_idx" ON "gateway_api_keys" USING btree ("project_code") WHERE "gateway_api_keys"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gateway_api_keys_active_hash_idx" ON "gateway_api_keys" USING btree ("key_hash","is_active");