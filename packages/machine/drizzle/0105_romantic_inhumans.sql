-- Create stores table first
CREATE TABLE IF NOT EXISTS "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"images" jsonb,
	"appId" uuid,
	"parentStoreId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);--> statement-breakpoint

-- Add foreign key constraints for stores table
ALTER TABLE "stores" ADD CONSTRAINT "stores_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_parentStoreId_stores_id_fk" FOREIGN KEY ("parentStoreId") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Now add storeId columns to existing tables
ALTER TABLE "installs" ALTER COLUMN "appId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "storeId" uuid;--> statement-breakpoint
ALTER TABLE "installs" ADD COLUMN "storeId" uuid;--> statement-breakpoint

-- Add foreign key constraints referencing stores
ALTER TABLE "app" ADD CONSTRAINT "app_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Add indexes for stores
CREATE INDEX IF NOT EXISTS "installs_store_idx" ON "installs" ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installs_user_store_unique" ON "installs" ("userId","storeId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installs_guest_store_unique" ON "installs" ("guestId","storeId");