ALTER TABLE "characterProfiles" ADD COLUMN "hourlyRate" integer;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD COLUMN "isAvailableForHire" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD COLUMN "expertise" jsonb DEFAULT '[]'::jsonb;