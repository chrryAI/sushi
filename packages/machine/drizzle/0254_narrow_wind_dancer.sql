CREATE TABLE "codebaseIssues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issueId" text NOT NULL,
	"repoName" text NOT NULL,
	"title" text NOT NULL,
	"count" integer,
	"userCount" integer,
	"firstSeen" timestamp with time zone,
	"lastSeen" timestamp with time zone,
	"level" text,
	"status" text,
	"culprits" text[],
	"metadata" jsonb,
	"fetchedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codebaseIssues_issueId_unique" UNIQUE("issueId")
);
--> statement-breakpoint
CREATE INDEX "codebaseIssues_issueId_idx" ON "codebaseIssues" USING btree ("issueId");--> statement-breakpoint
CREATE INDEX "codebaseIssues_repoName_idx" ON "codebaseIssues" USING btree ("repoName");--> statement-breakpoint
CREATE INDEX "codebaseIssues_fetchedAt_idx" ON "codebaseIssues" USING btree ("fetchedAt");--> statement-breakpoint
CREATE INDEX "codebaseIssues_lastSeen_idx" ON "codebaseIssues" USING btree ("lastSeen");--> statement-breakpoint
CREATE INDEX "codebaseIssues_status_idx" ON "codebaseIssues" USING btree ("status");