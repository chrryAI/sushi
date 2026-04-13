#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 Push & Sync Wrapper
# Pushes to the private monorepo, then syncs the public subset
# to chrryai/sushi automatically.
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "⬆️  Pushing to private repo..."
git push "$@"

echo ""
echo "🔄 Running public sync..."
bash "${SCRIPT_DIR}/sync-to-public.sh"
