ALTER TABLE "characterProfiles" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "characterProfilesEnabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "characterProfilesEnabled" boolean DEFAULT true;