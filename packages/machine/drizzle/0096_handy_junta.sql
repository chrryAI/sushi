ALTER TABLE "app" ADD COLUMN "tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiKeys" jsonb;