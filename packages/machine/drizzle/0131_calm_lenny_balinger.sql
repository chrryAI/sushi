CREATE TABLE "adCampaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"guestId" uuid,
	"threadId" uuid,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"budget" integer DEFAULT 0 NOT NULL,
	"spent" integer DEFAULT 0 NOT NULL,
	"pricingModel" text DEFAULT 'cpv' NOT NULL,
	"pricePerUnit" integer DEFAULT 2 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"targetCategories" jsonb,
	"startDate" timestamp with time zone,
	"endDate" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adCreatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaignId" uuid NOT NULL,
	"headline" text NOT NULL,
	"body" text,
	"cta" text,
	"imageUrl" text,
	"targetUrl" text,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adEarnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"totalEarnings" integer DEFAULT 0 NOT NULL,
	"paidOut" integer DEFAULT 0 NOT NULL,
	"pendingPayout" integer DEFAULT 0 NOT NULL,
	"totalViews" integer DEFAULT 0 NOT NULL,
	"totalClicks" integer DEFAULT 0 NOT NULL,
	"lastPayoutOn" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adViews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaignId" uuid NOT NULL,
	"creativeId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"contentUrl" text,
	"contentCategory" text,
	"earningAmount" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"clickedOn" timestamp with time zone,
	"converted" boolean DEFAULT false NOT NULL,
	"convertedOn" timestamp with time zone,
	"viewedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adCampaigns" ADD CONSTRAINT "adCampaigns_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adCampaigns" ADD CONSTRAINT "adCampaigns_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adCampaigns" ADD CONSTRAINT "adCampaigns_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adCreatives" ADD CONSTRAINT "adCreatives_campaignId_adCampaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."adCampaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adEarnings" ADD CONSTRAINT "adEarnings_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adEarnings" ADD CONSTRAINT "adEarnings_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adViews" ADD CONSTRAINT "adViews_campaignId_adCampaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."adCampaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adViews" ADD CONSTRAINT "adViews_creativeId_adCreatives_id_fk" FOREIGN KEY ("creativeId") REFERENCES "public"."adCreatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adViews" ADD CONSTRAINT "adViews_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adViews" ADD CONSTRAINT "adViews_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_campaigns_user_idx" ON "adCampaigns" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ad_campaigns_status_idx" ON "adCampaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_campaigns_thread_idx" ON "adCampaigns" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "ad_campaigns_pricing_idx" ON "adCampaigns" USING btree ("pricingModel");--> statement-breakpoint
CREATE INDEX "ad_creatives_campaign_idx" ON "adCreatives" USING btree ("campaignId");--> statement-breakpoint
CREATE INDEX "ad_creatives_status_idx" ON "adCreatives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_earnings_user_idx" ON "adEarnings" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ad_earnings_guest_idx" ON "adEarnings" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "ad_views_campaign_idx" ON "adViews" USING btree ("campaignId");--> statement-breakpoint
CREATE INDEX "ad_views_creative_idx" ON "adViews" USING btree ("creativeId");--> statement-breakpoint
CREATE INDEX "ad_views_user_idx" ON "adViews" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ad_views_guest_idx" ON "adViews" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "ad_views_clicked_idx" ON "adViews" USING btree ("clicked");--> statement-breakpoint
CREATE INDEX "ad_views_converted_idx" ON "adViews" USING btree ("converted");--> statement-breakpoint
CREATE INDEX "ad_views_viewed_on_idx" ON "adViews" USING btree ("viewedOn");--> statement-breakpoint
CREATE INDEX "ad_views_category_idx" ON "adViews" USING btree ("contentCategory");