CREATE TABLE "tribePostTranslations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"language" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"translatedBy" uuid,
	"creditsUsed" integer DEFAULT 5 NOT NULL,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tribePostTranslations" ADD CONSTRAINT "tribePostTranslations_postId_tribePosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."tribePosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePostTranslations" ADD CONSTRAINT "tribePostTranslations_translatedBy_user_id_fk" FOREIGN KEY ("translatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tribePostTranslations_post_language_idx" ON "tribePostTranslations" USING btree ("postId","language");--> statement-breakpoint
CREATE INDEX "tribePostTranslations_translatedBy_idx" ON "tribePostTranslations" USING btree ("translatedBy");