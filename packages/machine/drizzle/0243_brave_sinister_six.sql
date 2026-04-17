ALTER TABLE "aiAgents" ALTER COLUMN "creditCost" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "aiAgents" ALTER COLUMN "creditCost" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "creditUsage" ALTER COLUMN "creditCost" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "creditCost" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "creditCost" SET DEFAULT 1;