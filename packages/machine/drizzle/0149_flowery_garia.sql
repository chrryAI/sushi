CREATE TABLE "recruitmentFlows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talentProfileId" uuid NOT NULL,
	"companyUserId" uuid NOT NULL,
	"preChatPaid" boolean DEFAULT false,
	"preChatCredits" integer DEFAULT 300,
	"paidAt" timestamp with time zone,
	"threadId" uuid,
	"status" text DEFAULT 'pending',
	"offerAmount" integer,
	"offerType" text,
	"offerDetails" jsonb,
	"companyName" text,
	"companySize" text,
	"notes" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talentEarnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talentProfileId" uuid NOT NULL,
	"recruitmentFlowId" uuid,
	"type" text NOT NULL,
	"grossAmount" integer NOT NULL,
	"platformFee" integer NOT NULL,
	"netAmount" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"withdrawnAt" timestamp with time zone,
	"withdrawnTo" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talentInvitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talentProfileId" uuid NOT NULL,
	"invitedEmail" text NOT NULL,
	"invitedCompany" text,
	"accessLevel" text DEFAULT 'unlisted-threads',
	"status" text DEFAULT 'pending',
	"expiresAt" timestamp with time zone,
	"acceptedAt" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talentProfiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"displayName" text NOT NULL,
	"tagline" text,
	"bio" text,
	"githubUrl" text,
	"validationScore" real DEFAULT 0,
	"actionabilityScore" real DEFAULT 0,
	"velocityScore" real DEFAULT 0,
	"pearCreditsEarned" integer DEFAULT 0,
	"feedbackScore" real DEFAULT 0,
	"isHireable" boolean DEFAULT true,
	"hourlyRate" integer,
	"availability" text,
	"preChatCredits" integer DEFAULT 300,
	"skills" jsonb,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talentThreads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talentProfileId" uuid NOT NULL,
	"threadId" uuid NOT NULL,
	"visibility" text DEFAULT 'public',
	"title" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"complexity" real,
	"impactScore" real,
	"innovationScore" real,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"isFeatured" boolean DEFAULT false,
	"featuredOrder" integer,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recruitmentFlows" ADD CONSTRAINT "recruitmentFlows_talentProfileId_talentProfiles_id_fk" FOREIGN KEY ("talentProfileId") REFERENCES "public"."talentProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitmentFlows" ADD CONSTRAINT "recruitmentFlows_companyUserId_user_id_fk" FOREIGN KEY ("companyUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitmentFlows" ADD CONSTRAINT "recruitmentFlows_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentEarnings" ADD CONSTRAINT "talentEarnings_talentProfileId_talentProfiles_id_fk" FOREIGN KEY ("talentProfileId") REFERENCES "public"."talentProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentEarnings" ADD CONSTRAINT "talentEarnings_recruitmentFlowId_recruitmentFlows_id_fk" FOREIGN KEY ("recruitmentFlowId") REFERENCES "public"."recruitmentFlows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentInvitations" ADD CONSTRAINT "talentInvitations_talentProfileId_talentProfiles_id_fk" FOREIGN KEY ("talentProfileId") REFERENCES "public"."talentProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentProfiles" ADD CONSTRAINT "talentProfiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentThreads" ADD CONSTRAINT "talentThreads_talentProfileId_talentProfiles_id_fk" FOREIGN KEY ("talentProfileId") REFERENCES "public"."talentProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talentThreads" ADD CONSTRAINT "talentThreads_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruitmentFlows_talentProfileId_idx" ON "recruitmentFlows" USING btree ("talentProfileId");--> statement-breakpoint
CREATE INDEX "recruitmentFlows_companyUserId_idx" ON "recruitmentFlows" USING btree ("companyUserId");--> statement-breakpoint
CREATE INDEX "recruitmentFlows_status_idx" ON "recruitmentFlows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recruitmentFlows_preChatPaid_idx" ON "recruitmentFlows" USING btree ("preChatPaid");--> statement-breakpoint
CREATE INDEX "talentEarnings_talentProfileId_idx" ON "talentEarnings" USING btree ("talentProfileId");--> statement-breakpoint
CREATE INDEX "talentEarnings_type_idx" ON "talentEarnings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "talentEarnings_status_idx" ON "talentEarnings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "talentInvitations_talentProfileId_idx" ON "talentInvitations" USING btree ("talentProfileId");--> statement-breakpoint
CREATE INDEX "talentInvitations_invitedEmail_idx" ON "talentInvitations" USING btree ("invitedEmail");--> statement-breakpoint
CREATE INDEX "talentInvitations_status_idx" ON "talentInvitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "talentProfiles_userId_idx" ON "talentProfiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "talentProfiles_isHireable_idx" ON "talentProfiles" USING btree ("isHireable");--> statement-breakpoint
CREATE INDEX "talentProfiles_validationScore_idx" ON "talentProfiles" USING btree ("validationScore");--> statement-breakpoint
CREATE INDEX "talentThreads_talentProfileId_idx" ON "talentThreads" USING btree ("talentProfileId");--> statement-breakpoint
CREATE INDEX "talentThreads_threadId_idx" ON "talentThreads" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "talentThreads_visibility_idx" ON "talentThreads" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "talentThreads_isFeatured_idx" ON "talentThreads" USING btree ("isFeatured");