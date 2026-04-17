CREATE TABLE "kanbanBoard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'My Board' NOT NULL,
	"description" text,
	"userId" uuid,
	"guestId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taskState" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#6366f1',
	"userId" uuid,
	"guestId" uuid,
	"kanbanBoardId" uuid NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "defaultModel" SET DEFAULT 'sushi';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "favouriteAgent" SET DEFAULT 'sushi';--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "taskStateId" uuid;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD CONSTRAINT "kanbanBoard_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanbanBoard" ADD CONSTRAINT "kanbanBoard_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskState" ADD CONSTRAINT "taskState_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskState" ADD CONSTRAINT "taskState_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskState" ADD CONSTRAINT "taskState_kanbanBoardId_kanbanBoard_id_fk" FOREIGN KEY ("kanbanBoardId") REFERENCES "public"."kanbanBoard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_taskStateId_taskState_id_fk" FOREIGN KEY ("taskStateId") REFERENCES "public"."taskState"("id") ON DELETE set null ON UPDATE no action;