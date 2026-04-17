CREATE TABLE "authExchangeCodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"token" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresOn" timestamp with time zone NOT NULL,
	CONSTRAINT "authExchangeCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "authExchangeCodes_code_idx" ON "authExchangeCodes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "authExchangeCodes_expiresOn_idx" ON "authExchangeCodes" USING btree ("expiresOn");