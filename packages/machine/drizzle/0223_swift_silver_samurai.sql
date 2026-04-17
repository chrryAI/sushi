ALTER TABLE "app" DROP CONSTRAINT "app_storeId_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;