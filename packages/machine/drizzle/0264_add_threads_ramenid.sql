-- Manual migration for threads.ramenId
-- Created because drizzle-kit generate fails due to appOrders table mismatch
ALTER TABLE "threads" ADD COLUMN "ramenId" text;
ALTER TABLE "threads" ADD COLUMN IF NOT EXISTS "ramenId" text;