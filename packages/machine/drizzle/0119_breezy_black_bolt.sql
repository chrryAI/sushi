CREATE TABLE "appExtends" (
	"appId" uuid NOT NULL,
	"toId" uuid NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appExtends" ADD CONSTRAINT "appExtends_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appExtends" ADD CONSTRAINT "appExtends_toId_app_id_fk" FOREIGN KEY ("toId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;