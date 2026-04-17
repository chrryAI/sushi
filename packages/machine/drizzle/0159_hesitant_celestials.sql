CREATE TABLE "moltQuestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"appId" uuid NOT NULL,
	"threadId" uuid
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "isMolt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "moltUrl" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "isMolt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "moltUrl" text;--> statement-breakpoint
ALTER TABLE "moltQuestions" ADD CONSTRAINT "moltQuestions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moltQuestions" ADD CONSTRAINT "moltQuestions_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;