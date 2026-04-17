ALTER TABLE "app" ADD COLUMN "credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "hourlyRate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "hourlyRate" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "credits" integer;