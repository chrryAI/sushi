DROP INDEX "subscription_userId_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_user_provider_hash_idx" ON "subscription" USING btree ("userId","provider",md5("subscriptionId")) WHERE "subscription"."userId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_guest_provider_hash_idx" ON "subscription" USING btree ("guestId","provider",md5("subscriptionId")) WHERE "subscription"."guestId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "subscription_user_idx" ON "subscription" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscription_guest_idx" ON "subscription" USING btree ("guestId");