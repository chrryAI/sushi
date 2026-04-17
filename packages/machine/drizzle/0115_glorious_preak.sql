CREATE TABLE "analyticsEvents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siteId" uuid NOT NULL,
	"sessionId" text NOT NULL,
	"type" text DEFAULT 'pageview' NOT NULL,
	"name" text,
	"pathname" text NOT NULL,
	"referrer" text,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"os" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"duration" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyticsSessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siteId" uuid NOT NULL,
	"sessionId" text NOT NULL,
	"entryPage" text NOT NULL,
	"exitPage" text,
	"pageviews" integer DEFAULT 1 NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"os" text,
	"referrer" text,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"endedAt" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastSeenAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analyticsSessions_sessionId_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
CREATE TABLE "analyticsSites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"trackingId" text NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"excludeIps" jsonb DEFAULT '[]'::jsonb,
	"excludePaths" jsonb DEFAULT '[]'::jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analyticsSites_trackingId_unique" UNIQUE("trackingId")
);
--> statement-breakpoint
ALTER TABLE "analyticsEvents" ADD CONSTRAINT "analyticsEvents_siteId_analyticsSites_id_fk" FOREIGN KEY ("siteId") REFERENCES "public"."analyticsSites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyticsSessions" ADD CONSTRAINT "analyticsSessions_siteId_analyticsSites_id_fk" FOREIGN KEY ("siteId") REFERENCES "public"."analyticsSites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyticsSites" ADD CONSTRAINT "analyticsSites_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyticsSites" ADD CONSTRAINT "analyticsSites_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_site_idx" ON "analyticsEvents" USING btree ("siteId");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analyticsEvents" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "analytics_events_type_idx" ON "analyticsEvents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "analytics_events_timestamp_idx" ON "analyticsEvents" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_events_pathname_idx" ON "analyticsEvents" USING btree ("pathname");--> statement-breakpoint
CREATE INDEX "analytics_events_country_idx" ON "analyticsEvents" USING btree ("country");--> statement-breakpoint
CREATE INDEX "analytics_sessions_site_idx" ON "analyticsSessions" USING btree ("siteId");--> statement-breakpoint
CREATE INDEX "analytics_sessions_session_idx" ON "analyticsSessions" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "analytics_sessions_active_idx" ON "analyticsSessions" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "analytics_sessions_started_idx" ON "analyticsSessions" USING btree ("startedAt");--> statement-breakpoint
CREATE INDEX "analytics_sites_user_idx" ON "analyticsSites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_sites_guest_idx" ON "analyticsSites" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "analytics_sites_tracking_idx" ON "analyticsSites" USING btree ("trackingId");--> statement-breakpoint
CREATE INDEX "analytics_sites_domain_idx" ON "analyticsSites" USING btree ("domain");