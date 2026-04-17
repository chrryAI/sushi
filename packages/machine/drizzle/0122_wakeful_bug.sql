ALTER TABLE "aiAgents" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "aiAgents" ADD COLUMN "guestId" uuid;--> statement-breakpoint
ALTER TABLE "aiAgents" ADD CONSTRAINT "aiAgents_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiAgents" ADD CONSTRAINT "aiAgents_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;