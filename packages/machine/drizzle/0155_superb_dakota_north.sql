ALTER TABLE "feedbackTransactions" ADD COLUMN "transactionType" text DEFAULT 'feedback_given' NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "pearTier" text;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "creditsRemaining" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "premiumSubscriptions" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "premiumSubscriptions" ADD CONSTRAINT "premiumSubscriptions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;