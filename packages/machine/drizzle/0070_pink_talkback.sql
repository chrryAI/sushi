ALTER TABLE "affiliatePayouts" ALTER COLUMN "method" SET DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "memoriesEnabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "memoriesEnabled" boolean DEFAULT true;