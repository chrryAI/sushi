ALTER TABLE "timer" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "timer" ADD COLUMN "guestId" uuid;--> statement-breakpoint
ALTER TABLE "timer" ADD CONSTRAINT "timer_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;