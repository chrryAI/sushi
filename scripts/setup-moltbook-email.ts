#!/usr/bin/env tsx

import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { setupOwnerEmail } from "../apps/api/lib/integrations/moltbook"

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") })

const VEX_API_KEY = process.env.MOLTBOOK_VEX_API_KEY
const OWNER_EMAIL = "i.bsukru@gmail.com"

async function main() {
  console.log("🔑 Setting up Moltbook owner email for VEX bot...")
  console.log(`📧 Email: ${OWNER_EMAIL}`)
  console.log("")

  if (!VEX_API_KEY) {
    console.error("❌ MOLTBOOK_VEX_API_KEY not found in .env")
    process.exit(1)
  }

  console.log("🤖 Setting up VEX...")

  const result = await setupOwnerEmail(VEX_API_KEY, OWNER_EMAIL)

  if (result.success) {
    console.log(`✅ VEX: ${result.message}`)
  } else {
    console.log(`❌ VEX: ${result.error}`)
  }

  console.log("=".repeat(50))
  console.log("✅ Email setup complete!")
  console.log("📧 Check your inbox for verification emails")
  console.log("=".repeat(50))
}

main().catch((error) => {
  console.error("❌ Fatal error:", error)
  process.exit(1)
})
