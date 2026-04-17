ALTER TABLE "messages" ADD COLUMN "isTribe" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "isTribe" boolean DEFAULT false NOT NULL;