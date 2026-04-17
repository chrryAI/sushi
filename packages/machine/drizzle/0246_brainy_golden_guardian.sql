ALTER TABLE "instructions" DROP CONSTRAINT "instructions_threadId_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "instructions" ADD COLUMN "messageId" uuid;--> statement-breakpoint
ALTER TABLE "instructions" ADD CONSTRAINT "instructions_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;