CREATE TABLE "installs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"installedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"uninstalledAt" timestamp with time zone,
	"platform" text,
	"source" text
);
--> statement-breakpoint
ALTER TABLE "aiAgents" ALTER COLUMN "capabilities" SET DEFAULT '{"text":true,"image":false,"audio":false,"video":false,"webSearch":false,"imageGeneration":false,"codeExecution":false,"pdf":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;