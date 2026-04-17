ALTER TABLE "feedbackTransactions" ADD COLUMN "source" text DEFAULT 'human';--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD COLUMN "sourceAppId" uuid;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD COLUMN "source" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD COLUMN "sourceAppId" uuid;--> statement-breakpoint
ALTER TABLE "feedbackTransactions" ADD CONSTRAINT "feedbackTransactions_sourceAppId_app_id_fk" FOREIGN KEY ("sourceAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_sourceAppId_app_id_fk" FOREIGN KEY ("sourceAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pearFeedback_source_idx" ON "pearFeedback" USING btree ("source");--> statement-breakpoint
CREATE INDEX "pearFeedback_m2m_dedup_idx" ON "pearFeedback" USING btree ("sourceAppId","appId","source");--> statement-breakpoint
CREATE INDEX "tribe_news_embedding_index" ON "tribeNews" USING hnsw ("embedding" vector_cosine_ops);