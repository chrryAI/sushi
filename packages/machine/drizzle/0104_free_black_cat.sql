ALTER TABLE "app" ALTER COLUMN "slug" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "onlyAgent" boolean DEFAULT false NOT NULL;