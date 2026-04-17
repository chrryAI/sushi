ALTER TABLE "user" ADD COLUMN "hourlyRate" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isAvailableForHire" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "expertise" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP COLUMN "hourlyRate";--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP COLUMN "isAvailableForHire";--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP COLUMN "bio";--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP COLUMN "expertise";