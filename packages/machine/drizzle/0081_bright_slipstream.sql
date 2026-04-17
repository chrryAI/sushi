CREATE TABLE "agentApiUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd',
	"billingPeriod" text DEFAULT 'monthly' NOT NULL,
	"periodStart" timestamp with time zone NOT NULL,
	"periodEnd" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vexApiUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"endpoint" text NOT NULL,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd',
	"billingPeriod" text DEFAULT 'monthly' NOT NULL,
	"periodStart" timestamp with time zone NOT NULL,
	"periodEnd" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiPricing" text DEFAULT 'per-request';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiPricePerRequest" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiMonthlyPrice" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiRateLimit" integer DEFAULT 1000;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiKey" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiRequestCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "apiRevenue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agentApiUsage" ADD CONSTRAINT "agentApiUsage_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentApiUsage" ADD CONSTRAINT "agentApiUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentApiUsage" ADD CONSTRAINT "agentApiUsage_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vexApiUsage" ADD CONSTRAINT "vexApiUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vexApiUsage" ADD CONSTRAINT "vexApiUsage_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;