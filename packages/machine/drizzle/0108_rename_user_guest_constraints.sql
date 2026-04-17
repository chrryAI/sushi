-- Drop old constraints
DROP INDEX IF EXISTS "app_user_slug_unique";
DROP INDEX IF EXISTS "app_guest_slug_unique";

-- Create new constraints with storeId included
CREATE UNIQUE INDEX IF NOT EXISTS "app_user_slug_store_unique" ON "app" USING btree ("userId","storeId","slug");
CREATE UNIQUE INDEX IF NOT EXISTS "app_guest_slug_store_unique" ON "app" USING btree ("guestId","storeId","slug");
