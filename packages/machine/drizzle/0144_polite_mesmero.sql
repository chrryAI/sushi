CREATE TABLE "realtime_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"eventName" text NOT NULL,
	"eventUrl" text,
	"eventProps" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "realtime_analytics" ADD CONSTRAINT "realtime_analytics_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_analytics" ADD CONSTRAINT "realtime_analytics_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;