-- Add new columns to existing stores table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'userId') THEN
    ALTER TABLE "stores" ADD COLUMN "userId" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'guestId') THEN
    ALTER TABLE "stores" ADD COLUMN "guestId" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'teamId') THEN
    ALTER TABLE "stores" ADD COLUMN "teamId" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'domain') THEN
    ALTER TABLE "stores" ADD COLUMN "domain" text;
  END IF;
END $$;
--> statement-breakpoint

-- Add new indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS "stores_user_idx" ON "stores" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_guest_idx" ON "stores" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_team_idx" ON "stores" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_parent_idx" ON "stores" USING btree ("parentStoreId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_app_idx" ON "stores" USING btree ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_domain_idx" ON "stores" USING btree ("domain");--> statement-breakpoint

-- Add new foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stores_userId_user_id_fk') THEN
    ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stores_guestId_guest_id_fk') THEN
    ALTER TABLE "stores" ADD CONSTRAINT "stores_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stores_teamId_teams_id_fk') THEN
    ALTER TABLE "stores" ADD CONSTRAINT "stores_teamId_teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;