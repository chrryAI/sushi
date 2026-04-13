#!/usr/bin/env node

/**
 * Convert only changed SCSS files to TypeScript
 * Detects git staged changes and converts them
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log("🔍 Detecting changed SCSS files...\n")

// Get staged files from git
let stagedFiles = []
try {
  const output = execSync(`git diff --cached --name-only --diff-filter=ACM`, {
    encoding: "utf-8",
  })
  stagedFiles = output.trim().split("\n").filter(Boolean)
} catch (_error) {
  console.log("⚠️  Not in a git repository or no staged files")
  process.exit(0)
}

// Filter for .module.scss files (excluding test files)
const scssFiles = stagedFiles.filter(
  (file) =>
    file.endsWith(".module.scss") &&
    !file.includes("__tests__") &&
    !file.includes("TestComponent"),
)

if (scssFiles.length === 0) {
  console.log("✅ No SCSS files changed, skipping conversion\n")
  process.exit(0)
}

console.log(`📝 Found ${scssFiles.length} changed SCSS file(s):\n`)
scssFiles.forEach((file) => console.log(`   - ${file}`))

// Convert each file
let successCount = 0
let failCount = 0
const errors = []

scssFiles.forEach((scssFile) => {
  // Generate output path: .module.scss -> .styles.ts
  const outputFile = scssFile.replace(".module.scss", ".styles.ts")

  // Skip empty files
  const fullPath = path.join(process.cwd(), scssFile)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf-8").trim()
    if (!content) {
      console.log(`⏭️  Skipping empty file: ${path.basename(scssFile)}\n`)
      successCount++
      return
    }
  }

  console.log(`🔄 Converting: ${path.basename(scssFile)}`)

  try {
    execSync(
      `node "${path.join(__dirname, "scss-to-universal.js")}" "${scssFile}" "${outputFile}"`,
      { encoding: "utf-8", stdio: "pipe" },
    )

    // Only stage if file was created
    if (fs.existsSync(outputFile)) {
      execSync(`git add '${outputFile}'`)
      console.log(`✅ Generated: ${path.basename(outputFile)}\n`)
    } else {
      console.log(`⚠️  No output generated for: ${path.basename(scssFile)}\n`)
    }

    successCount++
  } catch (error) {
    console.error(`❌ Failed: ${path.basename(scssFile)}`)
    console.error(`   Error: ${error.message}\n`)
    failCount++
    errors.push({ file: scssFile, error: error.message })
  }
})

// Summary
console.log("━".repeat(50))
console.log(`\n📊 Conversion Summary:`)
console.log(`   ✅ Success: ${successCount}`)
console.log(`   ❌ Failed:  ${failCount}`)

if (failCount > 0) {
  console.log("\n❌ Some conversions failed:")
  errors.forEach(({ file, error }) => {
    console.log(`   - ${file}`)
    console.log(`     ${error}`)
  })
  process.exit(1)
}

console.log("\n✅ All SCSS files converted successfully!")
process.exit(0)
