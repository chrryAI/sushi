ALTER TABLE "guest" ADD COLUMN "adConsent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "adConsent" boolean DEFAULT false NOT NULL;