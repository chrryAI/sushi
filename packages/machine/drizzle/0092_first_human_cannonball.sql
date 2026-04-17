ALTER TABLE "app" ADD COLUMN "tools" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "agentApiUsage" DROP COLUMN "tools";