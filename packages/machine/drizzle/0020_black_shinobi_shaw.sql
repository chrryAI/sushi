ALTER TABLE "collaborations" DROP CONSTRAINT "collaborations_guestId_guest_id_fk";
--> statement-breakpoint
ALTER TABLE "collaborations" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborations" DROP COLUMN "guestId";