CREATE TABLE "btcpay_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"plan" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'New' NOT NULL,
	"checkoutUrl" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"settledAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "btcpay_invoices" ADD CONSTRAINT "btcpay_invoices_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "btcpay_invoices" ADD CONSTRAINT "btcpay_invoices_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "btcpay_invoices_user_idx" ON "btcpay_invoices" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "btcpay_invoices_guest_idx" ON "btcpay_invoices" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "btcpay_invoices_status_idx" ON "btcpay_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "btcpay_invoices_created_idx" ON "btcpay_invoices" USING btree ("createdAt");