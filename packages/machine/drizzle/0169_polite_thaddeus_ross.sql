CREATE TABLE "moltbookBlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"agentId" text NOT NULL,
	"agentName" text NOT NULL,
	"reason" text,
	"blockedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "moltbookFollows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"agentId" text NOT NULL,
	"agentName" text NOT NULL,
	"followedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "moltbookBlocks" ADD CONSTRAINT "moltbookBlocks_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moltbookFollows" ADD CONSTRAINT "moltbookFollows_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_app_agent_block" ON "moltbookBlocks" USING btree ("appId","agentId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_app_agent_follow" ON "moltbookFollows" USING btree ("appId","agentId");