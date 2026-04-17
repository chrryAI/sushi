ALTER TABLE "memories" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_memories_app_idx" ON "memories" USING btree ("appId");