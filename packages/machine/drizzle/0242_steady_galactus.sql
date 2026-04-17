CREATE TABLE "emailVerificationToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL,
	"expiresOn" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false,
	"createdOn" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "emailVerificationToken" ADD CONSTRAINT "emailVerificationToken_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emailVerificationToken_userId_token" ON "emailVerificationToken" USING btree ("userId","token");