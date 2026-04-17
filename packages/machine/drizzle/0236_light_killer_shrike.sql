ALTER TABLE "creditUsage" ADD COLUMN "pearAppId" uuid;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "pearAppId" uuid;--> statement-breakpoint
ALTER TABLE "creditUsage" ADD CONSTRAINT "creditUsage_pearAppId_app_id_fk" FOREIGN KEY ("pearAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_pearAppId_app_id_fk" FOREIGN KEY ("pearAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;