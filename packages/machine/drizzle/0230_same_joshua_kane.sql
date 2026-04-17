CREATE TABLE "hippo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"content" text NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "hippoCredits" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "lastHippoCreditReset" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "hippoCredits" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "lastHippoCreditReset" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hippo" ADD CONSTRAINT "hippo_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hippo_user_idx" ON "hippo" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "hippo_guest_idx" ON "hippo" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "hippo_created_on_idx" ON "hippo" USING btree ("createdOn");