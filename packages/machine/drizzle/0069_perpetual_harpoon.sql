ALTER TABLE "affiliate_payouts" RENAME TO "affiliatePayouts";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "affiliate_link_id" TO "affiliateLinkId";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "paypal_email" TO "paypalEmail";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "stripe_account_id" TO "stripeAccountId";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "transaction_id" TO "transactionId";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "requested_at" TO "requestedOn";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "processed_at" TO "processedOn";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" RENAME COLUMN "completed_at" TO "completedOn";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" DROP CONSTRAINT "affiliate_payouts_affiliate_link_id_affiliateLinks_id_fk";
--> statement-breakpoint
ALTER TABLE "affiliatePayouts" DROP CONSTRAINT "affiliate_payouts_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "affiliate_payouts_link_idx";--> statement-breakpoint
DROP INDEX "affiliate_payouts_user_idx";--> statement-breakpoint
ALTER TABLE "affiliatePayouts" ADD CONSTRAINT "affiliatePayouts_affiliateLinkId_affiliateLinks_id_fk" FOREIGN KEY ("affiliateLinkId") REFERENCES "public"."affiliateLinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliatePayouts" ADD CONSTRAINT "affiliatePayouts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_payouts_link_idx" ON "affiliatePayouts" USING btree ("affiliateLinkId");--> statement-breakpoint
CREATE INDEX "affiliate_payouts_user_idx" ON "affiliatePayouts" USING btree ("userId");