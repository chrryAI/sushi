ALTER TABLE "guest" ALTER COLUMN "roles" SET DEFAULT '["guest"]'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT '["user"]'::jsonb;