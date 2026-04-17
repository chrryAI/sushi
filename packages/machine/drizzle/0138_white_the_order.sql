ALTER TABLE "guest" ADD COLUMN "pearFeedbackCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "pearFeedbackResetAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "pearFeedbackTotal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pearFeedbackCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pearFeedbackResetAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pearFeedbackTotal" integer DEFAULT 0 NOT NULL;