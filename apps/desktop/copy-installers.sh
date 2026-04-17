#!/bin/bash

# Copy all .app bundles to public/installs
echo "📦 Copying .app bundles..."
cp -r src-tauri/target/release/bundle/macos/*.app ../../public/installs/

# Create DMG files for each app (without emojis in filename)
echo "💿 Creating DMG installers..."
cd ../../public/installs

for app in *.app; do
  # Remove emoji and extra spaces from filename
  appname="${app%.app}"
  cleanname=$(echo "$appname" | sed 's/ 🍒//g' | sed 's/  / /g')
  
  # Only create DMG if it doesn't exist or app is newer
  if [[ ! -f "${cleanname}.dmg" ]] || [[ "$app" -nt "${cleanname}.dmg" ]]; then
    echo "  Creating ${cleanname}.dmg..."
    hdiutil create -volname "$appname" -srcfolder "$app" -ov -format UDZO "${cleanname}.dmg" > /dev/null 2>&1
  else
    echo "  Skipping ${cleanname}.dmg (already up to date)"
  fi
done

# Copy to flash/public/installs as well
echo "📋 Copying to apps/chrry/public/installs..."
mkdir -p ../flash/public/installs
cp *.dmg ../flash/public/installs/

echo "✅ Done! All installers copied and ready for download."
echo ""
echo "📍 Installers available at:"
echo "   - public/installs/"
echo "   - apps/chrry/public/installs/"
