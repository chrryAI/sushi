# #!/bin/bash
# set -e

# echo "🚀 Coolify Build Script"
# echo "Checking if build artifacts exist from CI..."

# # Check if .next directories exist (from CI build)
# if [ -d "apps/flash/.next" ] && [ -d "apps/api/.next" ]; then
#   echo "✅ Build artifacts found! Skipping build..."
#   echo "Using cached build from GitHub Actions CI"
#   exit 0
# else
#   echo "⚠️  No cached build found. Building now..."

#   # Turbo remote cache config (set via Coolify env vars)
#   export TURBO_API="${TURBO_API:-}"
#   export TURBO_TOKEN="${TURBO_TOKEN:-}"
#   export TURBO_TEAM="${TURBO_TEAM:-}"
#   export TURBO_REMOTE_CACHE_SIGNATURE_KEY="${TURBO_REMOTE_CACHE_SIGNATURE_KEY:-}"

#   if [ -n "$TURBO_API" ]; then
#     echo "📦 Remote caching enabled: $TURBO_API"
#   else
#     echo "⚠️  No TURBO_API set, remote caching disabled"
#   fi

#   # Install dependencies
#   pnpm install --frozen-lockfile

#   # Build packages first
#   pnpm turbo build --filter="@repo/db" --filter="@chrryai/donut" --filter="@chrryai/waffles" --filter="@chrryai/pepper"

#   # Build apps
#   NODE_OPTIONS='--max-old-space-size=8192' CI=true pnpm turbo build --filter="flash"
#   NODE_OPTIONS='--max-old-space-size=8192' CI=true pnpm turbo build --filter="api"

#   echo "✅ Build complete!"
# fi
