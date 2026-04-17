#!/usr/bin/env node

/**
 * Generate Tauri app icons based on MODE environment variable
 *
 * Usage: MODE=blossom node scripts/generate-icons.js
 *
 * This script uses high-res 500x500 source icons from apps/chrry/public/images/apps
 * and generates all required sizes for Tauri (16, 32, 48, 128, 256, 512, 1024)
 */

import { execSync } from "node:child_process"
import { copyFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get mode from environment or default to 'vex'
let mode = process.env.MODE || "vex"

if (mode === "chrryAI") {
  mode = "chrry"
}

// Check for ImageMagick dependency
try {
  execSync("magick --version", { stdio: "pipe" })
} catch (_error) {
  console.error("❌ ImageMagick is required but not found!")
  console.error("")
  console.error("📦 Installation instructions:")
  console.error("")
  if (process.platform === "darwin") {
    console.error("  macOS:   brew install imagemagick")
  } else if (process.platform === "linux") {
    console.error("  Ubuntu:  sudo apt-get install imagemagick")
    console.error("  Fedora:  sudo dnf install imagemagick")
  } else if (process.platform === "win32") {
    console.error(
      "  Windows: Download from https://imagemagick.org/script/download.php",
    )
  }
  console.error("")
  console.error("After installation, run this script again.")
  process.exit(1)
}

console.log(`🎨 Generating Tauri icons for mode: ${mode}`)

// Paths
const sourceIconsDir = join(__dirname, "../flash/public/images/apps")
const tauriIconsDir = join(__dirname, "../desktop/src-tauri/icons")

// Source icon (500x500 high-res)
const sourceIcon = join(sourceIconsDir, `${mode}.png`)

if (!existsSync(sourceIcon)) {
  console.error(`❌ Source icon not found: ${sourceIcon}`)
  process.exit(1)
}

// Icon sizes needed for Tauri
const sizes = [16, 32, 48, 128, 256, 512, 1024]

// Generate all PNG sizes using ImageMagick
console.log("🖼️  Generating PNG icons at all sizes...")
for (const size of sizes) {
  const destIcon = join(tauriIconsDir, `${size}x${size}.png`)

  try {
    // SECURITY: Paths are constructed from trusted constants, not user input
    execSync(`magick "${sourceIcon}" -resize ${size}x${size} "${destIcon}"`)
    console.log(`✅ Generated ${size}x${size}.png`)
  } catch (error) {
    console.error(`❌ Failed to generate ${size}x${size}.png:`, error.message)
    process.exit(1)
  }

  // Also copy @2x version for Retina displays
  if (size === 128) {
    const dest2x = join(tauriIconsDir, "128x128@2x.png")
    copyFileSync(destIcon, dest2x)
    console.log(`✅ Copied 128x128@2x.png`)
  }
}

// Copy main icon.png (use 1024x1024 for best quality)
const destMainIcon = join(tauriIconsDir, "icon.png")
const mainIconSource = join(tauriIconsDir, "1024x1024.png")
copyFileSync(mainIconSource, destMainIcon)
console.log(`✅ Copied icon.png`)

// Generate .icns for macOS (requires iconutil on macOS)
if (process.platform === "darwin") {
  try {
    console.log("🍎 Generating .icns for macOS...")

    // Create iconset directory
    // SECURITY: Path is constructed from trusted constants, not user input
    const iconsetDir = join(tauriIconsDir, "icon.iconset")
    execSync(`mkdir -p "${iconsetDir}"`)

    // Copy icons to iconset with proper naming
    const iconsetSizes = [
      { size: 16, name: "icon_16x16.png" },
      { size: 32, name: "icon_16x16@2x.png" },
      { size: 32, name: "icon_32x32.png" },
      { size: 128, name: "icon_64x64@2x.png" },
      { size: 128, name: "icon_128x128.png" },
      { size: 256, name: "icon_128x128@2x.png" },
      { size: 256, name: "icon_256x256.png" },
      { size: 512, name: "icon_256x256@2x.png" },
      { size: 512, name: "icon_512x512.png" },
      { size: 1024, name: "icon_512x512@2x.png" },
    ]

    for (const { size, name } of iconsetSizes) {
      const source = join(tauriIconsDir, `${size}x${size}.png`)
      const dest = join(iconsetDir, name)
      copyFileSync(source, dest)
    }

    // Generate .icns
    // SECURITY: Paths are constructed from trusted constants, not user input
    execSync(
      `iconutil -c icns "${iconsetDir}" -o "${join(tauriIconsDir, "icon.icns")}"`,
    )

    // Clean up iconset
    // SECURITY: Path is constructed from trusted constants, not user input
    execSync(`rm -rf "${iconsetDir}"`)

    console.log("✅ Generated icon.icns")
  } catch (error) {
    console.warn("⚠️  Could not generate .icns:", error.message)
    console.warn("   Skipping .icns generation (requires macOS with iconutil)")
  }
}

// Generate .ico for Windows (requires ImageMagick)
try {
  console.log("🪟 Generating .ico for Windows...")

  // Try using ImageMagick convert
  // SECURITY: Paths are constructed from trusted constants (sizes array), not user input
  const icoSizes = [16, 32, 48, 128, 256]
  const icons = icoSizes
    .map((size) => `"${join(tauriIconsDir, `${size}x${size}.png`)}"`)
    .join(" ")
  execSync(`magick ${icons} "${join(tauriIconsDir, "icon.ico")}"`)

  console.log("✅ Generated icon.ico")
} catch (error) {
  console.warn("⚠️  Could not generate .ico:", error.message)
  console.warn("   Skipping .ico generation (requires ImageMagick)")
}

console.log(`\n✨ Icon generation complete for ${mode}!`)
console.log(`   Icons saved to: ${tauriIconsDir}`)
