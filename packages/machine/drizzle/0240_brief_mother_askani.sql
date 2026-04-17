ALTER TABLE "guest" ADD COLUMN "role" text DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "roles" jsonb DEFAULT '[]'::jsonb;