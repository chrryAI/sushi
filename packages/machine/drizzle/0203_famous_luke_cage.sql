ALTER TABLE "calendarEvent" DROP CONSTRAINT "calendarEvent_scheduledJobId_scheduledJobs_id_fk";
--> statement-breakpoint
ALTER TABLE "calendarEvent" DROP COLUMN "scheduledJobId";