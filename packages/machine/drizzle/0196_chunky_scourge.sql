CREATE TABLE "app_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_credits" integer NOT NULL,
	"credits_spent" integer DEFAULT 0 NOT NULL,
	"credits_remaining" integer NOT NULL,
	"daily_budget" integer,
	"target_stores" jsonb,
	"target_categories" jsonb,
	"exclude_stores" jsonb,
	"optimization_goal" text DEFAULT 'balanced' NOT NULL,
	"min_traffic" integer DEFAULT 100,
	"max_price_per_slot" integer,
	"bidding_strategy" text DEFAULT 'smart' NOT NULL,
	"preferred_days" jsonb,
	"preferred_hours" jsonb,
	"avoid_prime_time" boolean DEFAULT false,
	"total_impressions" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_conversions" integer DEFAULT 0 NOT NULL,
	"total_knowledge_gained" integer DEFAULT 0 NOT NULL,
	"average_cpc" real DEFAULT 0,
	"roi" real DEFAULT 0,
	"ml_model" jsonb,
	"performance_history" jsonb,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"updated_on" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "autonomous_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"bid_amount" integer NOT NULL,
	"bid_reason" text,
	"confidence" real,
	"status" text DEFAULT 'pending' NOT NULL,
	"competing_bids" integer DEFAULT 0,
	"winning_bid" integer,
	"predicted_traffic" integer,
	"predicted_conversions" integer,
	"predicted_roi" real,
	"actual_traffic" integer,
	"actual_conversions" integer,
	"actual_roi" real,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_on" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "slot_auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"winning_bid_id" uuid,
	"winning_amount" integer,
	"total_bids" integer DEFAULT 0,
	"average_bid" real,
	"highest_bid" integer,
	"lowest_bid" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_on" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "slot_rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"bid_id" uuid,
	"app_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration_hours" integer NOT NULL,
	"credits_charged" integer NOT NULL,
	"price_eur" real,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"traffic_generated" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"knowledge_gained" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"knowledge_base_enabled" boolean DEFAULT true,
	"knowledge_entries" jsonb,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_on" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "store_time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration_hours" integer NOT NULL,
	"credits_per_hour" integer NOT NULL,
	"is_prime_time" boolean DEFAULT false,
	"max_concurrent_rentals" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"average_traffic" integer DEFAULT 0,
	"average_conversions" integer DEFAULT 0,
	"total_rentals" integer DEFAULT 0,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_on" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "app_campaigns" ADD CONSTRAINT "app_campaigns_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_campaigns" ADD CONSTRAINT "app_campaigns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_campaigns" ADD CONSTRAINT "app_campaigns_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomous_bids" ADD CONSTRAINT "autonomous_bids_campaign_id_app_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."app_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomous_bids" ADD CONSTRAINT "autonomous_bids_slot_id_store_time_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."store_time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_auctions" ADD CONSTRAINT "slot_auctions_slot_id_store_time_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."store_time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_auctions" ADD CONSTRAINT "slot_auctions_winning_bid_id_autonomous_bids_id_fk" FOREIGN KEY ("winning_bid_id") REFERENCES "public"."autonomous_bids"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_slot_id_store_time_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."store_time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_campaign_id_app_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."app_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_bid_id_autonomous_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."autonomous_bids"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_rentals" ADD CONSTRAINT "slot_rentals_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_time_slots" ADD CONSTRAINT "store_time_slots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_campaigns_app_idx" ON "app_campaigns" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "app_campaigns_user_idx" ON "app_campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_campaigns_guest_idx" ON "app_campaigns" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "app_campaigns_status_idx" ON "app_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "app_campaigns_created_idx" ON "app_campaigns" USING btree ("created_on");--> statement-breakpoint
CREATE INDEX "autonomous_bids_campaign_idx" ON "autonomous_bids" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "autonomous_bids_slot_idx" ON "autonomous_bids" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "autonomous_bids_status_idx" ON "autonomous_bids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "autonomous_bids_created_idx" ON "autonomous_bids" USING btree ("created_on");--> statement-breakpoint
CREATE INDEX "slot_auctions_slot_idx" ON "slot_auctions" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "slot_auctions_status_idx" ON "slot_auctions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slot_auctions_start_idx" ON "slot_auctions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "slot_rentals_slot_idx" ON "slot_rentals" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "slot_rentals_campaign_idx" ON "slot_rentals" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "slot_rentals_app_idx" ON "slot_rentals" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "slot_rentals_user_idx" ON "slot_rentals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "slot_rentals_guest_idx" ON "slot_rentals" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "slot_rentals_status_idx" ON "slot_rentals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slot_rentals_start_idx" ON "slot_rentals" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "slot_rentals_end_idx" ON "slot_rentals" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX "store_time_slots_store_idx" ON "store_time_slots" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_time_slots_day_idx" ON "store_time_slots" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "store_time_slots_active_idx" ON "store_time_slots" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "store_time_slots_prime_idx" ON "store_time_slots" USING btree ("is_prime_time");