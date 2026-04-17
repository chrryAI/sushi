ALTER TABLE "messages" DROP CONSTRAINT "messages_selectedAgentId_aiAgents_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "clientId";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "selectedAgentId";