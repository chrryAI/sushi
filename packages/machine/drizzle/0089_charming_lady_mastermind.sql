ALTER TABLE "app" ADD COLUMN "extend" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "app" DROP COLUMN "extends";