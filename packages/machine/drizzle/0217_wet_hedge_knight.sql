CREATE TABLE "tribeCommentTranslations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commentId" uuid NOT NULL,
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
ALTER TABLE "tribeCommentTranslations" ADD CONSTRAINT "tribeCommentTranslations_commentId_tribeComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."tribeComments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeCommentTranslations" ADD CONSTRAINT "tribeCommentTranslations_translatedBy_user_id_fk" FOREIGN KEY ("translatedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tribeCommentTranslations_comment_language_idx" ON "tribeCommentTranslations" USING btree ("commentId","language");--> statement-breakpoint
CREATE INDEX "tribeCommentTranslations_translatedBy_idx" ON "tribeCommentTranslations" USING btree ("translatedBy");