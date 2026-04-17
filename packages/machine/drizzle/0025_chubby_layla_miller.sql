DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'clientId') THEN
    ALTER TABLE "messages" ADD COLUMN "clientId" uuid DEFAULT gen_random_uuid() NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'selectedAgentId') THEN
    ALTER TABLE "messages" ADD COLUMN "selectedAgentId" uuid;
  END IF;
  
  -- Add constraint only if it doesn't exist (by checking pg_constraint)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_selectedAgentId_aiAgents_id_fk'
  ) THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_selectedAgentId_aiAgents_id_fk" 
    FOREIGN KEY ("selectedAgentId") REFERENCES "public"."aiAgents"("id") 
    ON DELETE set null ON UPDATE no action;
  END IF;
END $$;