ALTER TABLE "guest" ADD COLUMN "migratedToUser" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "device" DROP COLUMN "migratedToUser";