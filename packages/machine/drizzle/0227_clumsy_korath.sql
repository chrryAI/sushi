ALTER TABLE "app" ADD COLUMN "isSystem" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "isSystem" boolean DEFAULT false NOT NULL;