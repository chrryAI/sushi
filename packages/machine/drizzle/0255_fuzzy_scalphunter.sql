CREATE TYPE "public"."error_type" AS ENUM('BadRequestError', 'AuthenticationError', 'PermissionDeniedError', 'NotFoundError', 'UnprocessableEntityError', 'RateLimitError', 'InternalServerError', 'APIConnectionError', 'APIConnectionTimeoutError', 'UnknownError');--> statement-breakpoint
CREATE TYPE "public"."http_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS');--> statement-breakpoint
CREATE TABLE "cf_api_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text,
	"zone_id" text,
	"method" "http_method" NOT NULL,
	"endpoint" text NOT NULL,
	"sdk_method" text,
	"status_code" integer,
	"success" boolean DEFAULT false NOT NULL,
	"duration_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"timed_out" boolean DEFAULT false NOT NULL,
	"error_type" "error_type",
	"error_message" text,
	"request_body_size" integer,
	"response_body_size" integer,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cf_rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"account_id" text,
	"zone_id" text,
	"endpoint" text NOT NULL,
	"retry_after_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cf_sdk_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_token_hash" text,
	"sdk_version" text,
	"node_version" text,
	"runtime" text,
	"total_requests" bigint DEFAULT 0 NOT NULL,
	"total_errors" bigint DEFAULT 0 NOT NULL,
	"total_retries" bigint DEFAULT 0 NOT NULL,
	"total_duration_ms" bigint DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cf_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text,
	"raw_data" jsonb,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cf_rate_limit_events" ADD CONSTRAINT "cf_rate_limit_events_request_id_cf_api_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."cf_api_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cf_api_requests_account_idx" ON "cf_api_requests" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "cf_api_requests_zone_idx" ON "cf_api_requests" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "cf_api_requests_endpoint_idx" ON "cf_api_requests" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "cf_api_requests_created_at_idx" ON "cf_api_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cf_api_requests_success_idx" ON "cf_api_requests" USING btree ("success");--> statement-breakpoint
CREATE INDEX "cf_rate_limit_events_endpoint_idx" ON "cf_rate_limit_events" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "cf_rate_limit_events_created_at_idx" ON "cf_rate_limit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cf_zones_account_idx" ON "cf_zones" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "cf_zones_name_idx" ON "cf_zones" USING btree ("name");