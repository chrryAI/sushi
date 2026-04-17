DROP INDEX "subscription_user_provider_hash_idx";--> statement-breakpoint
DROP INDEX "subscription_guest_provider_hash_idx";--> statement-breakpoint
DROP INDEX "subscription_user_idx";--> statement-breakpoint
DROP INDEX "subscription_guest_idx";--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suggestions" jsonb;