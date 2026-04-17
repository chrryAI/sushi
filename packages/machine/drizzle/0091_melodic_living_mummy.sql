ALTER TABLE "agentApiUsage" ADD COLUMN "tools" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "vexApiUsage" DROP COLUMN "tools";