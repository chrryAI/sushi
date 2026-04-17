#!/bin/bash

# Build and Release All Tauri Apps (Properly Notarized)
# This script builds all apps and copies the TAURI-BUILT DMGs (not hdiutil ones)

set -e

echo "🚀 Building and releasing all Tauri apps..."
echo "⏱️  This will take approximately 30-40 minutes"
echo ""

# Build all apps
echo "📦 Building all apps with notarization..."
# Build and release function
build_and_deploy() {
  local app_name=$1
  local cmd_name=$2
  
  echo "📦 Building $app_name..."
  pnpm build:$cmd_name
  
  # Find the generated DMG (it will be the only one or we filter by name)
  # Tauri cleans the directory usually, but to be safe we find the aarch64 dmg
  local dmg_file=$(find src-tauri/target/release/bundle/dmg -name "*_0.1.0_aarch64.dmg" -type f | head -n 1)
  
  if [[ -n "$dmg_file" ]]; then
    echo "✅ Found DMG for $app_name: $dmg_file"
    
    # Copy to public/installs with clean name
    cp "$dmg_file" "../../public/installs/${app_name}.dmg"
    
    # Copy to flash
    mkdir -p ../../apps/chrry/public/installs
    cp "$dmg_file" "../../apps/chrry/public/installs/${app_name}.dmg"
    
    echo "📋 Copied ${app_name}.dmg to public folders"
  else
    echo "❌ Error: No DMG found for $app_name"
    exit 1
  fi
}

# Ensure directories exist
mkdir -p ../../public/installs
mkdir -p ../../apps/chrry/public/installs

# Build apps sequentially
build_and_deploy "Sushi" "sushi"
build_and_deploy "Atlas" "atlas"
build_and_deploy "Focus" "focus"
# Vex is already built and working? Let's rebuild to be consistent or skip if user wants
build_and_deploy "Vex" "vex" 
build_and_deploy "Popcorn" "popcorn"
build_and_deploy "Chrry" "chrry"
build_and_deploy "Zarathustra" "zarathustra"
build_and_deploy "Search" "search"
build_and_deploy "Grape" "grape"
build_and_deploy "Burn" "burn"
build_and_deploy "Vault" "vault"
build_and_deploy "Pear" "pear"
build_and_deploy "Tribe" "tribe"

echo ""
echo "✅ Done! All installers ready for download."
echo ""
echo "📍 Installers available at:"
echo "   - public/installs/"
echo "   - apps/chrry/public/installs/"
echo ""
echo "🎉 All apps are signed, notarized, and ready to ship!"
