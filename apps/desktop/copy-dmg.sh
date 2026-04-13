#!/bin/bash

# Auto-copy DMG after Tauri build
# Usage: ./copy-dmg.sh <app-name>

APP_NAME=$1

if [[ -z "$APP_NAME" ]]; then
  echo "❌ Error: App name required"
  echo "Usage: ./copy-dmg.sh <app-name>"
  exit 1
fi

# Find the DMG (with emoji in filename)
DMG_FILE=$(find src-tauri/target/release/bundle/dmg -name "*${APP_NAME}*_0.1.0_aarch64.dmg" -type f | head -n 1)

if [[ -z "$DMG_FILE" ]]; then
  echo "❌ Error: No DMG found for $APP_NAME"
  exit 1
fi

echo "📦 Found: $DMG_FILE"

# Create directories if they don't exist
mkdir -p ../../public/installs
mkdir -p ../../apps/flash/public/installs

# Copy with clean name
cp "$DMG_FILE" "../../public/installs/${APP_NAME}.dmg"
cp "$DMG_FILE" "../../apps/flash/public/installs/${APP_NAME}.dmg"

echo "✅ Copied ${APP_NAME}.dmg to:"
echo "   - public/installs/"
echo "   - apps/flash/public/installs/"
