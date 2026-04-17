CREATE TABLE "agentPayouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"creatorUserId" uuid,
	"creatorGuestId" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd',
	"status" text DEFAULT 'pending' NOT NULL,
	"periodStart" timestamp with time zone NOT NULL,
	"periodEnd" timestamp with time zone NOT NULL,
	"stripePayoutId" text,
	"stripeTransferId" text,
	"subscriptionCount" integer DEFAULT 0 NOT NULL,
	"totalRevenue" integer DEFAULT 0 NOT NULL,
	"platformFee" integer DEFAULT 0 NOT NULL,
	"paidAt" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentSubscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"pricing" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd',
	"stripeSubscriptionId" text,
	"stripePaymentIntentId" text,
	"startDate" timestamp with time zone DEFAULT now() NOT NULL,
	"endDate" timestamp with time zone,
	"canceledAt" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "version" SET DEFAULT '1.0.0';--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "guestId" uuid;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "displayName" text DEFAULT 'Untitled Agent' NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "slug" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "submittedForReviewAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "reviewedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "reviewedBy" uuid;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "rejectionReason" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "manifestUrl" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "themeColor" text DEFAULT '#4F46E5';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "backgroundColor" text DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "displayMode" text DEFAULT 'standalone';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "baseApps" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "capabilities" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "systemPrompt" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "tone" text DEFAULT 'professional';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "knowledgeBase" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "examples" jsonb;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "baseModel" text DEFAULT 'claude';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "temperature" real DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "pricing" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "price" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "currency" text DEFAULT 'usd';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "subscriptionInterval" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "stripeProductId" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "stripePriceId" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "revenueShare" integer DEFAULT 70;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "usageCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "likeCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "shareCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "installCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "subscriberCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "totalRevenue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agentPayouts" ADD CONSTRAINT "agentPayouts_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentPayouts" ADD CONSTRAINT "agentPayouts_creatorUserId_user_id_fk" FOREIGN KEY ("creatorUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentPayouts" ADD CONSTRAINT "agentPayouts_creatorGuestId_guest_id_fk" FOREIGN KEY ("creatorGuestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentSubscriptions" ADD CONSTRAINT "agentSubscriptions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentSubscriptions" ADD CONSTRAINT "agentSubscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentSubscriptions" ADD CONSTRAINT "agentSubscriptions_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;