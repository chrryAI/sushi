ALTER TABLE "creditUsage" DROP CONSTRAINT "creditUsage_pearAppId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "pearAppId" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_pearAppId_app_id_fk" FOREIGN KEY ("pearAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditUsage" DROP COLUMN "pearAppId";