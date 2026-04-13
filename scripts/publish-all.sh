#!/bin/bash

# Publish all @chrryai packages to npm
# Usage: npm run publish

set -e  # Exit on error

echo "🚀 Publishing all @chrryai packages..."
echo ""

# Build and publish Pepper
echo "🌶️  Publishing Pepper..."
cd packages/pepper
npm run build
npm publish --access public
cd ../..
echo "✅ Pepper published!"
echo ""

# Build and publish Chrry
echo "🍒 Publishing Chrry..."
cd packages/ui
npm run build
npm publish --access public
cd ../..
echo "✅ Chrry published!"
echo ""

# Build and publish Waffles
echo "🧇 Publishing Waffles..."
cd packages/waffles
npm run build
npm publish --access public
cd ../..
echo "✅ Waffles published!"
echo ""

echo "🎉 All packages published successfully!"
