CREATE TABLE "mood" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"type" text NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"taskLogId" uuid
);
--> statement-breakpoint
CREATE TABLE "taskLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"moodId" uuid,
	"content" text NOT NULL,
	"mood" text,
	"userId" uuid,
	"guestId" uuid
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"userId" uuid,
	"guestId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"modifiedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"total" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0,
	"selected" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "timer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"fingerprint" text NOT NULL,
	"isCountingDown" boolean DEFAULT false NOT NULL,
	"preset1" integer DEFAULT 25 NOT NULL,
	"preset2" integer DEFAULT 15 NOT NULL,
	"preset3" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "tasksCount" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "moodId" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tasksCount" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "mood" ADD CONSTRAINT "mood_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood" ADD CONSTRAINT "mood_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood" ADD CONSTRAINT "mood_taskLogId_taskLog_id_fk" FOREIGN KEY ("taskLogId") REFERENCES "public"."taskLog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskLog" ADD CONSTRAINT "taskLog_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskLog" ADD CONSTRAINT "taskLog_moodId_mood_id_fk" FOREIGN KEY ("moodId") REFERENCES "public"."mood"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskLog" ADD CONSTRAINT "taskLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskLog" ADD CONSTRAINT "taskLog_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timer" ADD CONSTRAINT "timer_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_moodId_mood_id_fk" FOREIGN KEY ("moodId") REFERENCES "public"."mood"("id") ON DELETE set null ON UPDATE no action;