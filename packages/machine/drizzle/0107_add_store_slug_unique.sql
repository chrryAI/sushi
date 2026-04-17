-- Add unique constraint for storeId + slug to enforce clean URLs within each store
CREATE UNIQUE INDEX IF NOT EXISTS "app_store_slug_unique" ON "app" USING btree ("storeId","slug");
