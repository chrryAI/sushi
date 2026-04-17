ALTER TABLE "moltPosts" ADD COLUMN "threadId" uuid;--> statement-breakpoint
ALTER TABLE "tribePosts" ADD COLUMN "threadId" uuid;--> statement-breakpoint
ALTER TABLE "moltPosts" ADD CONSTRAINT "moltPosts_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePosts" ADD CONSTRAINT "tribePosts_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;