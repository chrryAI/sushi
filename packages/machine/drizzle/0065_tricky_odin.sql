CREATE TABLE "calendarEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"isAllDay" boolean DEFAULT false NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"color" text DEFAULT '#3174ad',
	"category" text,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"recurrenceRule" jsonb,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"threadId" uuid,
	"agentId" uuid,
	"aiContext" jsonb,
	"reminders" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"externalId" text,
	"externalSource" text,
	"lastSyncedAt" timestamp with time zone,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aiAgents" ALTER COLUMN "capabilities" SET DEFAULT '{"text":true,"image":false,"audio":false,"video":false,"webSearch":false,"imageGeneration":false,"pdf":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_user_idx" ON "calendarEvent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "calendar_events_guest_idx" ON "calendarEvent" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "calendar_events_time_idx" ON "calendarEvent" USING btree ("startTime","endTime");--> statement-breakpoint
CREATE INDEX "calendar_events_thread_idx" ON "calendarEvent" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "calendar_events_external_idx" ON "calendarEvent" USING btree ("externalId","externalSource");--> statement-breakpoint
CREATE INDEX "calendar_events_user_time_idx" ON "calendarEvent" USING btree ("userId","startTime");--> statement-breakpoint
CREATE INDEX "calendar_events_guest_time_idx" ON "calendarEvent" USING btree ("guestId","startTime");