CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid,
	"userId" uuid,
	"guestId" uuid,
	"email" text NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending'
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;