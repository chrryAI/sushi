#!/bin/bash

# Deploy Chrry Apps to Production
# This script uploads all signed and notarized DMG installers to your server

set -e  # Exit on error

echo "🚀 Deploying Chrry Apps to Production"
echo "======================================"
echo ""

# Configuration
SERVER="162.55.97.114"
SERVER_PATH="/var/www/vex.chrry.ai/public/installs"
LOCAL_PATH="../../public/installs"

# Check if DMGs exist
if [[ ! -d "$LOCAL_PATH" ]]; then
  echo "❌ Error: $LOCAL_PATH directory not found"
  echo "   Run ./build-and-release.sh first"
  exit 1
fi

DMG_COUNT=$(find "$LOCAL_PATH" -name "*.dmg" -type f | wc -l | tr -d ' ')
if [[ "$DMG_COUNT" -eq 0 ]]; then
  echo "❌ Error: No DMG files found in $LOCAL_PATH"
  exit 1
fi

echo "📦 Found $DMG_COUNT DMG installers"
echo ""

# List files to upload
echo "Files to upload:"
find "$LOCAL_PATH" -name "*.dmg" -type f -exec basename {} \;
echo ""

# Confirm deployment
read -p "Deploy to $SERVER? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# Upload DMGs
echo ""
echo "📤 Uploading DMGs to MinIO..."

# MinIO configuration
MINIO_ALIAS="production"  # Your MinIO alias (configure with: mc alias set production https://minio.example.com ACCESS_KEY SECRET_KEY)
MINIO_BUCKET="vex"        # Your bucket name
MINIO_PATH="installs"     # Path within bucket

# Check if mc (MinIO Client) is installed
if ! command -v mc &> /dev/null; then
    echo "❌ Error: MinIO Client (mc) is not installed"
    echo "Install it with: brew install minio/stable/mc"
    echo "Or visit: https://min.io/docs/minio/linux/reference/minio-mc.html"
    exit 1
fi

# Check if MinIO alias is configured
if ! mc alias list | grep -q "^$MINIO_ALIAS"; then
    echo "❌ Error: MinIO alias '$MINIO_ALIAS' not configured"
    echo "Configure it with:"
    echo "  mc alias set $MINIO_ALIAS https://your-minio-url.com ACCESS_KEY SECRET_KEY"
    exit 1
fi

# Upload each DMG file
echo "Uploading to: $MINIO_ALIAS/$MINIO_BUCKET/$MINIO_PATH/"
for dmg in "$LOCAL_PATH"/*.dmg; do
    if [[ -f "$dmg" ]]; then
        filename=$(basename "$dmg")
        echo "  📦 Uploading $filename..."
        mc cp "$dmg" "$MINIO_ALIAS/$MINIO_BUCKET/$MINIO_PATH/$filename" --attr "Content-Type=application/x-apple-diskimage"
    fi
done

# Set public read policy for the installs folder
echo ""
echo "🔓 Setting public read access..."
mc anonymous set download "$MINIO_ALIAS/$MINIO_BUCKET/$MINIO_PATH"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Apps available at:"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Sushi.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Atlas.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Focus.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Vex.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Popcorn.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Chrry.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Zarathustra.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Search.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Grape.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Burn.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Vault.dmg"
echo "   https://your-minio-url.com/$MINIO_BUCKET/$MINIO_PATH/Pear.dmg"
echo ""
echo "🎉 Ready to announce!"
