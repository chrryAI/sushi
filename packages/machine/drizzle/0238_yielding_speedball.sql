ALTER TABLE "feedbackTransactions" DROP CONSTRAINT "feedbackTransactions_sourceAppId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "pearFeedback" DROP CONSTRAINT "pearFeedback_sourceAppId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "jobId" uuid;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD CONSTRAINT "feedbackTransactions_sourceAppId_app_id_fk" FOREIGN KEY ("sourceAppId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_sourceAppId_app_id_fk" FOREIGN KEY ("sourceAppId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_jobId_scheduledJobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."scheduledJobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_m2m_source_required" CHECK ("source" != 'm2m' OR "sourceAppId" IS NOT NULL);