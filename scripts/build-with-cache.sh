#!/bin/bash

# Build script for VPS with Turbo
# Uses local cache for fast incremental builds

set -e

echo "🚀 Building with Turbo..."

npx turbo build

echo "✅ Build complete!"
