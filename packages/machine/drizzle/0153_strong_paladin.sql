CREATE TABLE "feedbackTransactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid,
	"appOwnerId" uuid,
	"feedbackUserId" uuid,
	"amount" integer DEFAULT 0 NOT NULL,
	"commission" integer DEFAULT 0 NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD CONSTRAINT "feedbackTransactions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD CONSTRAINT "feedbackTransactions_appOwnerId_user_id_fk" FOREIGN KEY ("appOwnerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD CONSTRAINT "feedbackTransactions_feedbackUserId_user_id_fk" FOREIGN KEY ("feedbackUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;