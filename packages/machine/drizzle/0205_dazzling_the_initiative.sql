ALTER TABLE "messages" ADD COLUMN "moltReplyId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tribeCommentId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tribeReplyId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_moltReplyId_moltComments_id_fk" FOREIGN KEY ("moltReplyId") REFERENCES "public"."moltComments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tribeCommentId_tribeComments_id_fk" FOREIGN KEY ("tribeCommentId") REFERENCES "public"."tribeComments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tribeReplyId_tribeComments_id_fk" FOREIGN KEY ("tribeReplyId") REFERENCES "public"."tribeComments"("id") ON DELETE set null ON UPDATE no action;