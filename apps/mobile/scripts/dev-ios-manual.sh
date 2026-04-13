#!/bin/bash

# Vex Mobile iOS Development Script
# Bypasses Capacitor CLI bug by using Xcode directly

echo "🚀 Starting Vex Mobile iOS Development..."

# 1. Build web assets
echo "📦 Building web assets..."
pnpm run build

# 2. Copy assets manually (skip cap sync due to CLI bug)
echo "📋 Copying web assets to iOS..."
rm -rf ios/App/App/public
cp -r dist ios/App/App/public

# 3. Create capacitor.config.json manually
echo "⚙️  Creating capacitor.config.json..."
cat > ios/App/App/capacitor.config.json << 'EOF'
{
  "appId": "ai.chrry.mobile",
  "appName": "Chrry",
  "webDir": "dist",
  "server": {
    "url": "http://localhost:5175",
    "cleartext": true
  },
  "ios": {
    "contentInset": "always"
  }
}
EOF

# 4. Open Xcode workspace
echo "🔨 Opening Xcode workspace..."
open ios/App/App.xcworkspace

echo "✅ Done! Build and run from Xcode."
echo "💡 Make sure to select a simulator or device in Xcode."
