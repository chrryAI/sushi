-- Add unique constraint for (storeId, slug) to prevent duplicate slugs in the same store
-- This enforces clean URLs within each store at the database level

-- First, check if there are any duplicate slugs in the same store
-- If duplicates exist, they need to be fixed before applying this constraint

-- Create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "app_store_slug_unique" ON "app" USING btree ("storeId", "slug");
