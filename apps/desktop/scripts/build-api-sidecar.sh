#!/bin/bash
# Build the API server as a standalone binary using Bun
# This binary is bundled as a Tauri sidecar inside the .app
#
# Usage: ./scripts/build-api-sidecar.sh
# Output: apps/desktop/src-tauri/binaries/api-aarch64-apple-darwin
#         apps/desktop/src-tauri/binaries/api-x86_64-apple-darwin

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"
OUT_DIR="$REPO_ROOT/apps/desktop/src-tauri/binaries"

mkdir -p "$OUT_DIR"

echo "🔨 Building API sidecar binary..."
echo "   Source: $API_DIR/server.ts"
echo "   Output: $OUT_DIR/api"

cd "$API_DIR"

# Detect current architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  TARGET="bun-darwin-arm64"
  SUFFIX="aarch64-apple-darwin"
else
  TARGET="bun-darwin-x64"
  SUFFIX="x86_64-apple-darwin"
fi

echo "   Target: $TARGET"

bun build \
  --compile \
  --target="$TARGET" \
  --outfile="$OUT_DIR/api-$SUFFIX" \
  ./server.ts

echo "✅ API sidecar built: $OUT_DIR/api-$SUFFIX"
echo ""
echo "⚠️  Add this to Cargo.toml [package.metadata.bundle] or tauri.conf.json:"
echo '   "externalBin": ["binaries/api"]'
