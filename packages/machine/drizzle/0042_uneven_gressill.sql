ALTER TABLE "guest" ADD COLUMN "fileUploadsToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "fileUploadsThisHour" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "totalFileSizeToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "lastFileUploadReset" timestamp with time zone;