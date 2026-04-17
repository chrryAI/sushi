-- Affiliate System Migration
-- Creates tables for affiliate links, referrals, and payouts

-- Affiliate Links Table
CREATE TABLE IF NOT EXISTS "affiliate_links" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "code" TEXT UNIQUE NOT NULL,
  "clicks" INTEGER DEFAULT 0 NOT NULL,
  "conversions" INTEGER DEFAULT 0 NOT NULL,
  "total_revenue" INTEGER DEFAULT 0 NOT NULL,
  "commission_earned" INTEGER DEFAULT 0 NOT NULL,
  "commission_paid" INTEGER DEFAULT 0 NOT NULL,
  "commission_rate" INTEGER DEFAULT 20 NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Affiliate Referrals Table
CREATE TABLE IF NOT EXISTS "affiliate_referrals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "affiliate_link_id" UUID NOT NULL REFERENCES "affiliate_links"("id") ON DELETE CASCADE,
  "referred_user_id" UUID REFERENCES "user"("id") ON DELETE SET NULL,
  "referred_guest_id" UUID REFERENCES "guest"("id") ON DELETE SET NULL,
  "subscription_id" UUID REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'converted', 'paid', 'cancelled')),
  "commission_amount" INTEGER DEFAULT 0 NOT NULL,
  "bonus_credits" INTEGER DEFAULT 0 NOT NULL,
  "converted_at" TIMESTAMP WITH TIME ZONE,
  "paid_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Affiliate Payouts Table
CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "affiliate_link_id" UUID NOT NULL REFERENCES "affiliate_links"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL,
  "method" TEXT DEFAULT 'paypal' NOT NULL CHECK ("method" IN ('paypal', 'stripe', 'bank_transfer')),
  "paypal_email" TEXT,
  "stripe_account_id" TEXT,
  "status" TEXT DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
  "transaction_id" TEXT,
  "notes" TEXT,
  "requested_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "processed_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE
);

-- Indexes for affiliate_links
CREATE INDEX IF NOT EXISTS "affiliate_links_code_idx" ON "affiliate_links"("code");
CREATE INDEX IF NOT EXISTS "affiliate_links_user_idx" ON "affiliate_links"("user_id");
CREATE INDEX IF NOT EXISTS "affiliate_links_active_idx" ON "affiliate_links"("is_active");

-- Indexes for affiliate_referrals
CREATE INDEX IF NOT EXISTS "affiliate_referrals_link_idx" ON "affiliate_referrals"("affiliate_link_id");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_user_idx" ON "affiliate_referrals"("referred_user_id");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_guest_idx" ON "affiliate_referrals"("referred_guest_id");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_subscription_idx" ON "affiliate_referrals"("subscription_id");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_status_idx" ON "affiliate_referrals"("status");

-- Indexes for affiliate_payouts
CREATE INDEX IF NOT EXISTS "affiliate_payouts_link_idx" ON "affiliate_payouts"("affiliate_link_id");
CREATE INDEX IF NOT EXISTS "affiliate_payouts_user_idx" ON "affiliate_payouts"("user_id");
CREATE INDEX IF NOT EXISTS "affiliate_payouts_status_idx" ON "affiliate_payouts"("status");
