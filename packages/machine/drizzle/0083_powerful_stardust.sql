CREATE TABLE "teamMembers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teamId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"canCreateApps" boolean DEFAULT true NOT NULL,
	"canEditApps" boolean DEFAULT true NOT NULL,
	"canDeleteApps" boolean DEFAULT false NOT NULL,
	"canManageMembers" boolean DEFAULT false NOT NULL,
	"canManageBilling" boolean DEFAULT false NOT NULL,
	"joinedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"invitedBy" uuid
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"website" text,
	"ownerId" uuid NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"maxMembers" integer DEFAULT 3 NOT NULL,
	"maxApps" integer DEFAULT 2 NOT NULL,
	"monthlyPrice" integer DEFAULT 0 NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"subscriptionStatus" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "teamId" uuid;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "ragDocumentIds" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "ragEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "type" text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "teamMembers" ADD CONSTRAINT "teamMembers_teamId_teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMembers" ADD CONSTRAINT "teamMembers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMembers" ADD CONSTRAINT "teamMembers_invitedBy_user_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_teamId_teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;