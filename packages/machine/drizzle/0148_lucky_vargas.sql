CREATE TABLE "retroResponses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"messageId" uuid,
	"questionText" text NOT NULL,
	"sectionTitle" text NOT NULL,
	"questionIndex" integer NOT NULL,
	"sectionIndex" integer NOT NULL,
	"responseText" text,
	"responseLength" integer,
	"skipped" boolean DEFAULT false NOT NULL,
	"askedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"answeredAt" timestamp with time zone,
	"timeToAnswer" integer,
	"sentimentScore" real,
	"insightQuality" real,
	"actionableItems" jsonb,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retroSessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"threadId" uuid,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"duration" integer,
	"totalQuestions" integer NOT NULL,
	"questionsAnswered" integer DEFAULT 0 NOT NULL,
	"sectionsCompleted" integer DEFAULT 0 NOT NULL,
	"averageResponseLength" integer,
	"skippedQuestions" integer DEFAULT 0 NOT NULL,
	"dailyQuestionSectionIndex" integer NOT NULL,
	"dailyQuestionIndex" integer NOT NULL,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "retroResponses" ADD CONSTRAINT "retroResponses_sessionId_retroSessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."retroSessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroResponses" ADD CONSTRAINT "retroResponses_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroResponses" ADD CONSTRAINT "retroResponses_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroResponses" ADD CONSTRAINT "retroResponses_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroResponses" ADD CONSTRAINT "retroResponses_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroSessions" ADD CONSTRAINT "retroSessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroSessions" ADD CONSTRAINT "retroSessions_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroSessions" ADD CONSTRAINT "retroSessions_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retroSessions" ADD CONSTRAINT "retroSessions_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "retroResponses_sessionId_idx" ON "retroResponses" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "retroResponses_userId_idx" ON "retroResponses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "retroResponses_appId_idx" ON "retroResponses" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "retroResponses_askedAt_idx" ON "retroResponses" USING btree ("askedAt");--> statement-breakpoint
CREATE INDEX "retroResponses_skipped_idx" ON "retroResponses" USING btree ("skipped");--> statement-breakpoint
CREATE INDEX "retroSessions_userId_idx" ON "retroSessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "retroSessions_appId_idx" ON "retroSessions" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "retroSessions_startedAt_idx" ON "retroSessions" USING btree ("startedAt");--> statement-breakpoint
CREATE INDEX "retroSessions_completedAt_idx" ON "retroSessions" USING btree ("completedAt");