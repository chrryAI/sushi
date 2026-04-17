CREATE TABLE "aiModelPricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"modelName" text NOT NULL,
	"inputCostPerKToken" integer NOT NULL,
	"outputCostPerKToken" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"description" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduledJobRuns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobId" uuid NOT NULL,
	"status" text NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"output" text,
	"creditsUsed" integer DEFAULT 0 NOT NULL,
	"tokensUsed" integer,
	"duration" integer,
	"tribePostId" uuid,
	"moltPostId" text,
	"error" text,
	"errorStack" text,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduledJobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"jobType" text NOT NULL,
	"frequency" text NOT NULL,
	"scheduledTimes" jsonb NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone,
	"aiModel" text NOT NULL,
	"modelConfig" jsonb,
	"contentTemplate" text,
	"contentRules" jsonb,
	"estimatedCreditsPerRun" integer NOT NULL,
	"totalEstimatedCredits" integer NOT NULL,
	"creditsUsed" integer DEFAULT 0 NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"stripePaymentIntentId" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"lastRunAt" timestamp with time zone,
	"nextRunAt" timestamp with time zone,
	"totalRuns" integer DEFAULT 0 NOT NULL,
	"successfulRuns" integer DEFAULT 0 NOT NULL,
	"failedRuns" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduledJobRuns" ADD CONSTRAINT "scheduledJobRuns_jobId_scheduledJobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."scheduledJobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduledJobRuns" ADD CONSTRAINT "scheduledJobRuns_tribePostId_tribePosts_id_fk" FOREIGN KEY ("tribePostId") REFERENCES "public"."tribePosts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduledJobs" ADD CONSTRAINT "scheduledJobs_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduledJobs" ADD CONSTRAINT "scheduledJobs_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;