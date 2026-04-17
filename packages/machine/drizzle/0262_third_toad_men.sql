CREATE TABLE "streamLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"agentId" uuid,
	"threadId" uuid,
	"messageId" uuid,
	"modelId" text NOT NULL,
	"keySource" text NOT NULL,
	"tokensIn" integer DEFAULT 0 NOT NULL,
	"tokensOut" integer DEFAULT 0 NOT NULL,
	"costUsd" numeric(12, 8) DEFAULT '0' NOT NULL,
	"isDegraded" boolean DEFAULT false NOT NULL,
	"isBYOK" boolean DEFAULT false NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ba_account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ba_session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ba_verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ba_account" CASCADE;--> statement-breakpoint
DROP TABLE "ba_session" CASCADE;--> statement-breakpoint
DROP TABLE "ba_verification" CASCADE;--> statement-breakpoint
ALTER TABLE "guest" ALTER COLUMN "credits" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "streamLogs" ADD CONSTRAINT "streamLogs_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamLogs" ADD CONSTRAINT "streamLogs_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamLogs" ADD CONSTRAINT "streamLogs_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamLogs" ADD CONSTRAINT "streamLogs_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamLogs" ADD CONSTRAINT "streamLogs_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stream_logs_user_date_idx" ON "streamLogs" USING btree ("userId","createdOn");--> statement-breakpoint
CREATE INDEX "stream_logs_guest_date_idx" ON "streamLogs" USING btree ("guestId","createdOn");--> statement-breakpoint
CREATE INDEX "stream_logs_model_date_idx" ON "streamLogs" USING btree ("modelId","createdOn");--> statement-breakpoint
CREATE INDEX "stream_logs_app_date_idx" ON "streamLogs" USING btree ("appId","createdOn");