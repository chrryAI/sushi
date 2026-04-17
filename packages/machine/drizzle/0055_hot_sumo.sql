CREATE TABLE "character_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"name" text NOT NULL,
	"personality" text NOT NULL,
	"traits" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"userRelationship" text,
	"conversationStyle" text,
	"embedding" vector(1536),
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"content" text NOT NULL,
	"title" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" text DEFAULT 'context' NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"embedding" vector(1536),
	"sourceThreadId" uuid,
	"sourceMessageId" uuid,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threadSummaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"summary" text NOT NULL,
	"keyTopics" jsonb,
	"messageCount" integer DEFAULT 0 NOT NULL,
	"lastMessageAt" timestamp with time zone,
	"ragContext" jsonb,
	"userMemories" jsonb,
	"characterTags" jsonb,
	"embedding" vector(1536),
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_sourceThreadId_threads_id_fk" FOREIGN KEY ("sourceThreadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_sourceMessageId_messages_id_fk" FOREIGN KEY ("sourceMessageId") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threadSummaries" ADD CONSTRAINT "threadSummaries_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threadSummaries" ADD CONSTRAINT "threadSummaries_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threadSummaries" ADD CONSTRAINT "threadSummaries_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_profiles_agent_idx" ON "character_profiles" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "character_profiles_user_idx" ON "character_profiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "character_profiles_embedding_idx" ON "character_profiles" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "character_profiles_tags_idx" ON "character_profiles" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "user_memories_user_idx" ON "memories" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_memories_guest_idx" ON "memories" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "user_memories_embedding_idx" ON "memories" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "user_memories_tags_idx" ON "memories" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "user_memories_category_idx" ON "memories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "thread_summaries_thread_idx" ON "threadSummaries" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "thread_summaries_user_idx" ON "threadSummaries" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "thread_summaries_embedding_idx" ON "threadSummaries" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "thread_summaries_topics_idx" ON "threadSummaries" USING gin ("keyTopics");