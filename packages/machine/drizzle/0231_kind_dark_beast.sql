ALTER TABLE "user" ADD COLUMN "hippoCredits" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastHippoCreditReset" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" DROP COLUMN "hippoCredits";--> statement-breakpoint
ALTER TABLE "feedbackTransactions" DROP COLUMN "lastHippoCreditReset";