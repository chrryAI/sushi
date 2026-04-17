ALTER TABLE "messages" DROP CONSTRAINT "messages_appId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "appId" uuid;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "appId";