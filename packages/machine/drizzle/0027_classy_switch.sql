ALTER TABLE "messages" ADD COLUMN "clientId" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "selectedAgentId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_selectedAgentId_aiAgents_id_fk" FOREIGN KEY ("selectedAgentId") REFERENCES "public"."aiAgents"("id") ON DELETE set null ON UPDATE no action;