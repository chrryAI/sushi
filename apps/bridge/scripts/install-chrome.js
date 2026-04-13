#!/usr/bin/env node

/**
 * Install Sushi Bridge for Chrome
 * Compiles the bridge and registers it as a Chrome native host
 */

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const BRIDGE_NAME = "com.chrry.sushi.bridge"
const EXTENSION_ID = process.env.SUSHI_EXTENSION_ID || "YOUR_EXTENSION_ID_HERE"

console.log("🍣 Installing Sushi Bridge for Chrome...\n")

// Step 1: Build the bridge
console.log("📦 Building Sushi Bridge...")
try {
  execSync("bun build src/index.ts --compile --outfile dist/bridge", {
    cwd: join(process.cwd()),
    stdio: "inherit",
  })
  console.log("✅ Build complete\n")
} catch (error) {
  console.error("❌ Build failed:", error.message)
  process.exit(1)
}

// Step 2: Copy to /usr/local/bin
console.log("📋 Installing to /usr/local/bin...")
try {
  const source = join(process.cwd(), "dist", "bridge")
  const dest = "/usr/local/bin/bridge"

  execFileSync("sudo", ["cp", source, dest], { stdio: "inherit" })
  execFileSync("sudo", ["chmod", "+x", dest], { stdio: "inherit" })

  console.log("✅ Installed to /usr/local/bin/bridge\n")
} catch (error) {
  console.error("❌ Installation failed:", error.message)
  process.exit(1)
}

// Step 3: Create native messaging manifest
console.log("📝 Creating native messaging manifest...")
const manifestTemplate = readFileSync(
  join(process.cwd(), "manifest.json"),
  "utf-8",
)
const manifest = manifestTemplate.replace(
  "EXTENSION_ID_PLACEHOLDER",
  EXTENSION_ID,
)

const manifestDir = join(
  homedir(),
  "Library",
  "Application Support",
  "Google",
  "Chrome",
  "NativeMessagingHosts",
)

try {
  mkdirSync(manifestDir, { recursive: true })
  const manifestPath = join(manifestDir, `${BRIDGE_NAME}.json`)
  writeFileSync(manifestPath, manifest)

  console.log(`✅ Manifest created at: ${manifestPath}\n`)
} catch (error) {
  console.error("❌ Manifest creation failed:", error.message)
  process.exit(1)
}

console.log("🎉 Sushi Bridge installed successfully!")
console.log("\nNext steps:")
console.log("1. Load your Sushi extension in Chrome")
console.log("2. The extension will connect to Sushi Bridge automatically")
console.log("\nTo test the bridge:")
console.log('  echo \'{"type":"ping"}\' | bridge')
