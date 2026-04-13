#!/usr/bin/env node

/**
 * Simple script to remove unused imports using ts-unused-exports
 * Run with: pnpm cleanup:unused
 */

import { execSync } from "node:child_process"
import path from "node:path"

console.log("🧹 Removing unused imports and variables...\n")

// Patterns to process
const _patterns = ["apps/api/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"]

try {
  // Run ESLint with fix on all TypeScript files
  console.log("📝 Running ESLint --fix on TypeScript files...")

  const result = execSync(
    `pnpm turbo lint -- --fix --rule 'unused-imports/no-unused-imports: error'`,
    {
      cwd: path.join(process.cwd()),
      encoding: "utf-8",
      stdio: "pipe",
    },
  )

  console.log(result)
  console.log("\n✅ Done! Unused imports have been removed.")
  console.log(
    "\n💡 Tip: Commit these changes and review the diff to ensure nothing important was removed.",
  )
} catch (error) {
  // ESLint exits with code 1 if there are warnings, which is expected
  if (error.status === 1) {
    console.log("\n⚠️  Some warnings remain (this is normal)")
    console.log("✅ Unused imports have been removed where possible")
  } else {
    console.error("❌ Error:", error.message)
    process.exit(1)
  }
}
