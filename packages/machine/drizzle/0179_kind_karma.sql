CREATE TABLE "sonarIssues" (
	"id" text PRIMARY KEY NOT NULL,
	"projectKey" text NOT NULL,
	"ruleKey" text NOT NULL,
	"severity" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"filePath" text NOT NULL,
	"lineNumber" integer,
	"message" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"resolvedAt" timestamp with time zone,
	"syncedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sonarMetrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectKey" text NOT NULL,
	"metricKey" text NOT NULL,
	"value" real NOT NULL,
	"measuredAt" timestamp with time zone NOT NULL,
	"syncedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sonarIssues_project_idx" ON "sonarIssues" USING btree ("projectKey");--> statement-breakpoint
CREATE INDEX "sonarIssues_status_idx" ON "sonarIssues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sonarIssues_file_idx" ON "sonarIssues" USING btree ("filePath");--> statement-breakpoint
CREATE INDEX "sonarIssues_type_idx" ON "sonarIssues" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sonarIssues_severity_idx" ON "sonarIssues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "sonarMetrics_project_metric_idx" ON "sonarMetrics" USING btree ("projectKey","metricKey");--> statement-breakpoint
CREATE INDEX "sonarMetrics_measuredAt_idx" ON "sonarMetrics" USING btree ("measuredAt");