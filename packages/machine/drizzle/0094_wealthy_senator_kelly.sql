ALTER TABLE "app" ADD COLUMN "mainThreadId" uuid;--> statement-breakpoint
ALTER TABLE "installs" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "installs" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "isMainThread" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_mainThreadId_threads_id_fk" FOREIGN KEY ("mainThreadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;