CREATE TABLE "affiliateClicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliateLinkId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"ipAddress" text,
	"userAgent" text,
	"referrer" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD CONSTRAINT "affiliateClicks_affiliateLinkId_affiliateLinks_id_fk" FOREIGN KEY ("affiliateLinkId") REFERENCES "public"."affiliateLinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD CONSTRAINT "affiliateClicks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateClicks" ADD CONSTRAINT "affiliateClicks_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_clicks_link_idx" ON "affiliateClicks" USING btree ("affiliateLinkId");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_user_idx" ON "affiliateClicks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_guest_idx" ON "affiliateClicks" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_created_idx" ON "affiliateClicks" USING btree ("createdOn");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_clicks_user_link_unique" ON "affiliateClicks" USING btree ("affiliateLinkId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_clicks_guest_link_unique" ON "affiliateClicks" USING btree ("affiliateLinkId","guestId");