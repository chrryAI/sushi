CREATE TABLE "affiliateLinks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"code" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"totalRevenue" integer DEFAULT 0 NOT NULL,
	"commissionEarned" integer DEFAULT 0 NOT NULL,
	"commissionPaid" integer DEFAULT 0 NOT NULL,
	"commissionRate" integer DEFAULT 20 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliateLinks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "affiliate_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'paypal' NOT NULL,
	"paypal_email" text,
	"stripe_account_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"notes" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "affiliateReferrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" uuid NOT NULL,
	"referredUserId" uuid,
	"referredGuestId" uuid,
	"subscriptionId" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"commissionAmount" integer DEFAULT 0 NOT NULL,
	"bonusCredits" integer DEFAULT 0 NOT NULL,
	"convertedOn" timestamp with time zone,
	"paidOn" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliateLinks" ADD CONSTRAINT "affiliateLinks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_link_id_affiliateLinks_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliateLinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateReferrals" ADD CONSTRAINT "affiliateReferrals_affiliate_link_id_affiliateLinks_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliateLinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateReferrals" ADD CONSTRAINT "affiliateReferrals_referredUserId_user_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateReferrals" ADD CONSTRAINT "affiliateReferrals_referredGuestId_guest_id_fk" FOREIGN KEY ("referredGuestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateReferrals" ADD CONSTRAINT "affiliateReferrals_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_links_code_idx" ON "affiliateLinks" USING btree ("code");--> statement-breakpoint
CREATE INDEX "affiliate_links_user_idx" ON "affiliateLinks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "affiliate_links_status_idx" ON "affiliateLinks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "affiliate_payouts_link_idx" ON "affiliate_payouts" USING btree ("affiliate_link_id");--> statement-breakpoint
CREATE INDEX "affiliate_payouts_user_idx" ON "affiliate_payouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "affiliate_payouts_status_idx" ON "affiliate_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "affiliate_referrals_link_idx" ON "affiliateReferrals" USING btree ("affiliate_link_id");--> statement-breakpoint
CREATE INDEX "affiliate_referrals_user_idx" ON "affiliateReferrals" USING btree ("referredUserId");--> statement-breakpoint
CREATE INDEX "affiliate_referrals_guest_idx" ON "affiliateReferrals" USING btree ("referredGuestId");--> statement-breakpoint
CREATE INDEX "affiliate_referrals_subscription_idx" ON "affiliateReferrals" USING btree ("subscriptionId");--> statement-breakpoint
CREATE INDEX "affiliate_referrals_status_idx" ON "affiliateReferrals" USING btree ("status");