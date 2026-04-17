CREATE TABLE "creditUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"agentId" uuid NOT NULL,
	"creditCost" integer NOT NULL,
	"messageType" text NOT NULL,
	"threadId" uuid,
	"messageId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creditUsage" ADD CONSTRAINT "creditUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditUsage" ADD CONSTRAINT "creditUsage_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditUsage" ADD CONSTRAINT "creditUsage_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditUsage" ADD CONSTRAINT "creditUsage_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_usage_user_date_idx" ON "creditUsage" USING btree ("userId","createdOn");--> statement-breakpoint
CREATE INDEX "credit_usage_guest_date_idx" ON "creditUsage" USING btree ("guestId","createdOn");--> statement-breakpoint
CREATE INDEX "credit_usage_thread_idx" ON "creditUsage" USING btree ("threadId");