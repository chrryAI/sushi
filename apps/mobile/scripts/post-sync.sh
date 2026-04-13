#!/bin/bash

# Post-sync hook to add Capacitor plugins to Podfile
# This runs after 'cap sync' to ensure plugins are always included

PODFILE="ios/App/Podfile"

# Check if plugins are already in Podfile
if grep -q "CapacitorBrowser" "$PODFILE"; then
  echo "✅ Capacitor plugins already in Podfile"
  exit 0
fi

echo "📦 Adding Capacitor Browser and App plugins to Podfile..."

# Find the line number where capacitor_pods function ends
LINE_NUM=$(grep -n "^end$" "$PODFILE" | head -1 | cut -d: -f1)

# Insert plugins before the 'end' line
sed -i.bak "${LINE_NUM}i\\
  # Capacitor plugins for OAuth\\
  pod 'CapacitorBrowser', :path => '../../../../node_modules/.pnpm/@capacitor+browser@7.0.3_@capacitor+core@7.4.4/node_modules/@capacitor/browser'\\
  pod 'CapacitorApp', :path => '../../../../node_modules/.pnpm/@capacitor+app@7.1.1_@capacitor+core@7.4.4/node_modules/@capacitor/app'\\
" "$PODFILE"

echo "✅ Plugins added to Podfile"

# Run pod install
cd ios/App && pod install

echo "✅ Pod install complete"
