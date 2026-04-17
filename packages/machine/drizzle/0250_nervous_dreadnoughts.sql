ALTER TABLE "hippo" DROP CONSTRAINT "hippo_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "threadId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "messageId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "tribePostId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "tribeCommentId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "jobId" uuid;--> statement-breakpoint
ALTER TABLE "hippo" ADD COLUMN "files" jsonb;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_tribePostId_tribePosts_id_fk" FOREIGN KEY ("tribePostId") REFERENCES "public"."tribePosts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_tribeCommentId_tribeComments_id_fk" FOREIGN KEY ("tribeCommentId") REFERENCES "public"."tribeComments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_jobId_scheduledJobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."scheduledJobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;