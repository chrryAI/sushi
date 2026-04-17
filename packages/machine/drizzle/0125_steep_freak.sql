ALTER TABLE "mood" ADD COLUMN "messageId" uuid;--> statement-breakpoint
ALTER TABLE "mood" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "mood" ADD CONSTRAINT "mood_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;