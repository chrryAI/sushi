ALTER TABLE "affiliateClicks" RENAME COLUMN "createdOn" TO "clickedOn";--> statement-breakpoint
ALTER TABLE "affiliateClicks" DROP CONSTRAINT "affiliateClicks_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "affiliateClicks" DROP CONSTRAINT "affiliateClicks_guestId_guest_id_fk";
--> statement-breakpoint
DROP INDEX "affiliate_clicks_user_idx";--> statement-breakpoint
DROP INDEX "affiliate_clicks_guest_idx";--> statement-breakpoint
DROP INDEX "affiliate_clicks_created_idx";--> statement-breakpoint
DROP INDEX "affiliate_clicks_user_link_unique";--> statement-breakpoint
DROP INDEX "affiliate_clicks_guest_link_unique";--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD COLUMN "converted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD COLUMN "convertedOn" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD CONSTRAINT "affiliateClicks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD CONSTRAINT "affiliateClicks_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_clicks_clicked_on_idx" ON "affiliateClicks" USING btree ("clickedOn");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_converted_idx" ON "affiliateClicks" USING btree ("converted");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_ip_idx" ON "affiliateClicks" USING btree ("ipAddress");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_converted_on_idx" ON "affiliateClicks" USING btree ("convertedOn");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_user_agent_idx" ON "affiliateClicks" USING btree ("userAgent");