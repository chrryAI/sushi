CREATE TABLE "pearFeedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"content" text NOT NULL,
	"feedbackType" text NOT NULL,
	"category" text NOT NULL,
	"categoryTags" jsonb,
	"comparativeMention" text,
	"firstImpression" boolean DEFAULT false,
	"emotionalTags" jsonb,
	"sentimentScore" real NOT NULL,
	"specificityScore" real NOT NULL,
	"actionabilityScore" real NOT NULL,
	"metadata" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedOn" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pearFeedback" ADD CONSTRAINT "pearFeedback_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pearFeedback_appId_idx" ON "pearFeedback" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "pearFeedback_userId_idx" ON "pearFeedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pearFeedback_feedbackType_idx" ON "pearFeedback" USING btree ("feedbackType");--> statement-breakpoint
CREATE INDEX "pearFeedback_category_idx" ON "pearFeedback" USING btree ("category");--> statement-breakpoint
CREATE INDEX "pearFeedback_sentimentScore_idx" ON "pearFeedback" USING btree ("sentimentScore");--> statement-breakpoint
CREATE INDEX "pearFeedback_createdOn_idx" ON "pearFeedback" USING btree ("createdOn");