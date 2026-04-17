ALTER TABLE "store_time_slots" ADD COLUMN "direct_rent_price" integer;--> statement-breakpoint
ALTER TABLE "store_time_slots" ADD COLUMN "min_auction_bid" integer;--> statement-breakpoint
ALTER TABLE "store_time_slots" ADD COLUMN "requires_approval" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "store_time_slots" ADD COLUMN "auto_approve" boolean DEFAULT true;