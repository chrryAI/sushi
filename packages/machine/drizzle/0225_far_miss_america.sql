ALTER TABLE "installs" DROP CONSTRAINT "installs_storeId_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;