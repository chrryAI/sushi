ALTER TABLE "guest" ADD COLUMN "speechRequestsToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "speechRequestsThisHour" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "speechCharactersToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "lastSpeechReset" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "speechRequestsToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "speechRequestsThisHour" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "speechCharactersToday" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastSpeechReset" timestamp with time zone;