ALTER TABLE "task" ADD COLUMN "labels" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "labelColors" jsonb DEFAULT '{}'::jsonb;