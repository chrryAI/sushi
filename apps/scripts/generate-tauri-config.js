#!/usr/bin/env node

// Generate Tauri config with mode-specific names from template
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get MODE from environment
const mode = process.env.MODE || "vex"

// Dynamically import site config
const { getSiteConfig } = await import("../../packages/ui/utils/siteConfig.ts")
const siteConfig = getSiteConfig(mode)

// Read template config
const templatePath = join(
  __dirname,
  "../desktop/src-tauri/tauri.conf.template.json",
)
const outputPath = join(__dirname, "../desktop/src-tauri/tauri.conf.json")

let configContent = readFileSync(templatePath, "utf-8")

// Replace placeholders with mode-specific values
const productName = `${siteConfig.name} 🍒`
const windowTitle = `${siteConfig.name} 🍒`
const shortDescription = siteConfig.description.substring(0, 80)
const longDescription = siteConfig.description
const bundleId = `dev.chrry.${mode.toLowerCase()}`

configContent = configContent
  .replace(/{{PRODUCT_NAME}}/g, productName)
  .replace(/{{WINDOW_TITLE}}/g, windowTitle)
  .replace(/{{SHORT_DESCRIPTION}}/g, shortDescription)
  .replace(/{{LONG_DESCRIPTION}}/g, longDescription)
  .replace(/{{BUNDLE_ID}}/g, bundleId)

console.log(`🔧 Generated Tauri config for ${siteConfig.name} 🍒`)
console.log(`📦 Bundle ID: ${bundleId}`)

// Write generated config
writeFileSync(outputPath, configContent, "utf-8")
