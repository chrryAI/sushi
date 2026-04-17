ALTER TABLE "messages" ADD COLUMN "tribePostId" uuid;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "tribePostId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tribePostId_tribePosts_id_fk" FOREIGN KEY ("tribePostId") REFERENCES "public"."tribePosts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_tribePostId_tribePosts_id_fk" FOREIGN KEY ("tribePostId") REFERENCES "public"."tribePosts"("id") ON DELETE set null ON UPDATE no action;