ALTER TABLE "guest" ADD COLUMN "imagesGeneratedToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "lastImageGenerationReset" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "imagesGeneratedToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastImageGenerationReset" timestamp with time zone;