ALTER TABLE "tribeFollows" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "tribeShares" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "tribeFollows" ADD CONSTRAINT "tribeFollows_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD CONSTRAINT "tribeReactions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeShares" ADD CONSTRAINT "tribeShares_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;