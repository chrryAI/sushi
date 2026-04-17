CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"features" jsonb
);
--> statement-breakpoint
CREATE TABLE "instructions" (
	"appId" uuid,
	"userId" uuid,
	"guestId" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"emoji" text NOT NULL,
	"content" text NOT NULL,
	"confidence" integer NOT NULL,
	"generatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"requiresWebSearch" boolean DEFAULT false NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest" ALTER COLUMN "favouriteAgent" SET DEFAULT 'deepSeek';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;