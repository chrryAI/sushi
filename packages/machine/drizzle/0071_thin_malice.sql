ALTER TABLE "guest" ADD COLUMN "memoriesEnabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "device" DROP COLUMN "memoriesEnabled";