ALTER TABLE "app" ADD COLUMN "limits" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "bypassCredits" boolean DEFAULT false NOT NULL;