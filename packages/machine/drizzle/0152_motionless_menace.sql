ALTER TABLE "kanbanBoard" ADD COLUMN "integrationType" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "integrationProjectId" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "integrationRepoOwner" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "integrationRepoName" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "integrationAccessToken" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "integrationWebhookUrl" text;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "syncEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "lastSyncedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "syncDirection" text DEFAULT 'bidirectional';--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD CONSTRAINT "kanbanBoard_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;