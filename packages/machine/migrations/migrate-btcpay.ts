import { sql } from "drizzle-orm"
import { db } from "../index"

async function migrate() {
  return
  console.log("🔄 Creating btcpay_invoices table...")

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "btcpay_invoices" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" uuid REFERENCES "user"("id") ON DELETE set null,
        "guestId" uuid REFERENCES "guest"("id") ON DELETE set null,
        "plan" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "currency" text NOT NULL DEFAULT 'USD',
        "status" text NOT NULL DEFAULT 'New',
        "checkoutUrl" text NOT NULL,
        "metadata" jsonb,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
        "expiresAt" timestamp with time zone,
        "settledAt" timestamp with time zone
      );
    `)

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "btcpay_invoices_user_idx" ON "btcpay_invoices"("userId");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "btcpay_invoices_guest_idx" ON "btcpay_invoices"("guestId");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "btcpay_invoices_status_idx" ON "btcpay_invoices"("status");
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "btcpay_invoices_created_idx" ON "btcpay_invoices"("createdAt");
    `)

    console.log("✅ BTCPay invoices table created successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }

  process.exit(0)
}

migrate()
