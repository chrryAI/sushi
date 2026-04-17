CREATE TYPE "public"."feedbackCampaignStatus" AS ENUM('draft', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."feedbackSubmissionStatus" AS ENUM('pending', 'approved', 'rejected', 'revision_requested');--> statement-breakpoint
CREATE TABLE "feedbackCampaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"userId" uuid NOT NULL,
	"type" text DEFAULT 'website' NOT NULL,
	"url" text,
	"budget" integer NOT NULL,
	"pricePerCompletion" integer NOT NULL,
	"targetCompletions" integer NOT NULL,
	"currentCompletions" integer DEFAULT 0,
	"status" "feedbackCampaignStatus" DEFAULT 'draft' NOT NULL,
	"embedCode" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedbackSubmission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaignId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"videoUrl" text NOT NULL,
	"status" "feedbackSubmissionStatus" DEFAULT 'pending' NOT NULL,
	"paymentReleased" boolean DEFAULT false,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"approvedOn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feedbackTask" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaignId" uuid NOT NULL,
	"question" text NOT NULL,
	"order" integer NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "user_search_index";--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "stripeConnectAccountId" text;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "stripeConnectOnboarded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripeConnectAccountId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripeConnectOnboarded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "feedbackCampaign" ADD CONSTRAINT "feedbackCampaign_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbackSubmission" ADD CONSTRAINT "feedbackSubmission_campaignId_feedbackCampaign_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."feedbackCampaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbackSubmission" ADD CONSTRAINT "feedbackSubmission_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbackTask" ADD CONSTRAINT "feedbackTask_campaignId_feedbackCampaign_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."feedbackCampaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_search_index" ON "user" USING gin ((
      setweight(to_tsvector('english', "name"), 'A') ||
      setweight(to_tsvector('english', "userName"), 'B') ||
      setweight(to_tsvector('english', "email"), 'C')
  ));