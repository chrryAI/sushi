ALTER TABLE "guest" ADD COLUMN IF NOT EXISTS "selectedModels" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "selectedModels" jsonb;
ALTER TABLE "guest" ADD COLUMN IF NOT EXISTS "openRouterModels" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "openRouterModels" jsonb;