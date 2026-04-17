CREATE TABLE "agentActions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid NOT NULL,
	"type" text NOT NULL,
	"xpEarned" integer NOT NULL,
	"success" boolean NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"displayName" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"characterTraits" jsonb DEFAULT '[]'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"tasksCompleted" integer DEFAULT 0 NOT NULL,
	"bugsFixed" integer DEFAULT 0 NOT NULL,
	"featuresBuilt" integer DEFAULT 0 NOT NULL,
	"testsWritten" integer DEFAULT 0 NOT NULL,
	"deploysSucceeded" integer DEFAULT 0 NOT NULL,
	"deploysFailed" integer DEFAULT 0 NOT NULL,
	"linesOfCode" integer DEFAULT 0 NOT NULL,
	"trustScore" real DEFAULT 0 NOT NULL,
	"description" text,
	"avatar" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"lastActiveOn" timestamp with time zone DEFAULT now(),
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"requiredLevel" integer NOT NULL,
	"category" text NOT NULL,
	"unlockedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentActions" ADD CONSTRAINT "agentActions_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_action_agent_idx" ON "agentActions" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "agent_action_type_idx" ON "agentActions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "agent_action_created_idx" ON "agentActions" USING btree ("createdOn");--> statement-breakpoint
CREATE INDEX "agent_slug_idx" ON "agents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_level_idx" ON "agents" USING btree ("level");