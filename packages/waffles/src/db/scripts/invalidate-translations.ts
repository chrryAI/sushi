#!/usr/bin/env ts-node
/**
 * Script to invalidate translations cache
 * Only runs in production/server environments
 *
 * Usage:
 *   NODE_ENV=production pnpm tsx packages/db/src/scripts/invalidate-translations.ts [locale]
 *
 * Examples:
 *   NODE_ENV=production pnpm tsx packages/db/src/scripts/invalidate-translations.ts      # Invalidate all locales
 *   NODE_ENV=production pnpm tsx packages/db/src/scripts/invalidate-translations.ts en   # Invalidate only English
 */

import { invalidateTranslations } from "../cache"

const locale = process.argv[2]

async function main() {
  // Only run in production/server environments
  if (process.env.NODE_ENV === "development") {
    console.log("⚠️  Cache invalidation skipped in development mode")
    console.log("   Cache is disabled in development by default")
    process.exit(0)
  }

  console.log("🗑️  Invalidating translations cache...")

  if (locale) {
    console.log(`   Locale: ${locale}`)
    await invalidateTranslations(locale)
  } else {
    console.log("   All locales")
    await invalidateTranslations()
  }

  console.log("✅ Translations cache invalidated successfully")
  process.exit(0)
}

main().catch((error) => {
  console.error("❌ Error invalidating translations cache:", error)
  process.exit(1)
})
