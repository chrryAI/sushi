ALTER TABLE "threads" ADD COLUMN "messageCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "lastTriggeredFeatures" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "totalThreadCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "goldenRatioConfig" jsonb DEFAULT '{}'::jsonb;