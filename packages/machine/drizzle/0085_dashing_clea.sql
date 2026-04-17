ALTER TABLE "verificationToken" ADD COLUMN "id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "value" text;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "expiresAt" timestamp with time zone;