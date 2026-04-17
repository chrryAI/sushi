ALTER TABLE "app" ADD COLUMN "installType" text DEFAULT 'pwa';--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "appStoreUrl" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "playStoreUrl" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "bundleId" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "packageName" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "deepLinkScheme" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "isInstallable" boolean DEFAULT true NOT NULL;