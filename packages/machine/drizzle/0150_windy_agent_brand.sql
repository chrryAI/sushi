CREATE TABLE "premiumSubscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"stripeSubscriptionId" text NOT NULL,
	"stripePriceId" text NOT NULL,
	"stripeProductId" text NOT NULL,
	"stripeCustomerId" text,
	"productType" text NOT NULL,
	"tier" text NOT NULL,
	"status" text NOT NULL,
	"currentPeriodStart" timestamp with time zone,
	"currentPeriodEnd" timestamp with time zone,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"canceledAt" timestamp with time zone,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "premiumSubscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
);
--> statement-breakpoint
ALTER TABLE "premiumSubscriptions" ADD CONSTRAINT "premiumSubscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "premiumSubscriptions_userId_idx" ON "premiumSubscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "premiumSubscriptions_productType_idx" ON "premiumSubscriptions" USING btree ("productType");--> statement-breakpoint
CREATE INDEX "premiumSubscriptions_status_idx" ON "premiumSubscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "premiumSubscriptions_stripeSubscriptionId_idx" ON "premiumSubscriptions" USING btree ("stripeSubscriptionId");