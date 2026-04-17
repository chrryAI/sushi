ALTER TABLE "tribeCommentTranslations" ALTER COLUMN "model" SET DEFAULT 'gpt-4o-mini';--> statement-breakpoint
ALTER TABLE "tribePostTranslations" ALTER COLUMN "model" SET DEFAULT 'gpt-4o-mini';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "blueskyHandle" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "blueskyPassword" text;