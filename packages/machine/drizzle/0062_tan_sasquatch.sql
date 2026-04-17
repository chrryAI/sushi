CREATE TABLE "creditTransactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"amount" integer NOT NULL,
	"balanceBefore" integer NOT NULL,
	"balanceAfter" integer NOT NULL,
	"description" text,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creditTransactions" ADD CONSTRAINT "creditTransactions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditTransactions" ADD CONSTRAINT "creditTransactions_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;