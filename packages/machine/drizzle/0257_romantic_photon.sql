CREATE TABLE "branchAgents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"branchName" text NOT NULL,
	"namespace" text DEFAULT 'default' NOT NULL,
	"agentId" text NOT NULL,
	"systemPrompt" text,
	"instructions" jsonb DEFAULT '[]'::jsonb,
	"memories" jsonb DEFAULT '[]'::jsonb,
	"characterProfile" jsonb,
	"evolutionScore" real DEFAULT 0,
	"lastCommitSha" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branchAgents" ADD CONSTRAINT "branchAgents_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branchAgents" ADD CONSTRAINT "branchAgents_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branchAgents" ADD CONSTRAINT "branchAgents_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;