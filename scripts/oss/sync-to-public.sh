#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔁 OSS Sync Script
# Copies the public subset of the Sushi monorepo to chrryai/vex
# ═══════════════════════════════════════════════════════════════

set -e

SOURCE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET_REMOTE="https://github.com/chrryai/sushi.git"
TMP_DIR=$(mktemp -d)
BRANCH="ramen"

# Cleanup on exit
trap 'rm -rf "$TMP_DIR"' EXIT

echo "🔄 Syncing public subset to chrryai/sushi..."

# Clone target repo (use token if provided via GITHUB_TOKEN)
if [ -n "$GITHUB_TOKEN" ]; then
  AUTH_REMOTE="https://${GITHUB_TOKEN}@github.com/chrryai/sushi.git"
else
  AUTH_REMOTE="$TARGET_REMOTE"
fi
git clone --depth 1 "$AUTH_REMOTE" "$TMP_DIR"

# Clear existing contents (preserve .git)
find "$TMP_DIR" -mindepth 1 -not -path "$TMP_DIR/.git/*" -not -name ".git" -exec rm -rf {} + 2>/dev/null || true

# Copy full repo into temp
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.turbo' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.next' \
  --exclude='*.log' \
  --exclude='playwright-report' \
  --exclude='apps/chrry/public/install/*.dmg' \
  --exclude='public/installs/*.dmg' \
  "$SOURCE_DIR/" "$TMP_DIR/"

cd "$TMP_DIR"

# Remove private apps
echo "🗑️  Removing private apps..."
rm -rf \
  apps/api \
  apps/chrry

# Remove private packages
echo "🗑️  Removing private packages..."
rm -rf \
  packages/vault \
  packages/shared \
  packages/sushi \
  packages/cache

# Remove private infrastructure (infra komple gider, sadece docker compose dosyaları geri gelir)
echo "🗑️  Removing private infrastructure..."
rm -rf \
  infra \
  .hetzner \
  .vps

# Sadece docker compose dosyalarını geri kopyala
echo "📦 Keeping public docker compose files..."
mkdir -p infra/docker
find "$SOURCE_DIR/infra/docker" -maxdepth 1 -name 'docker-compose*.yml' -exec cp {} infra/docker/ \;

# Remove private/internal tools and scripts
rm -rf \
  tools \
  scripts/deploy \
  workers/trial-worker/Dockerfile \
  workers/trial-worker/setup_study.py \
  workers/trial-worker/worker.py \
  2>/dev/null || true

# Remove docs that are too business-specific
echo "🗑️  Filtering docs..."
rm -rf \
  docs/setup \
  docs/vision \
  docs/assets/Sato.pdf

# Remove noise files that may have been copied
rm -rf \
  .iliyan .claude .cleanai .qodo .kiro .agent .expect .Jules .oldGH .vscode .zed \
  screenshots \
  falkordb_data \
  header_test.dmg \
  fix-*.sh fix-*.txt quick-fix.sh sato-check.js \
  2>/dev/null || true

# Replace README with public version (already written)
# The current README is already monorepo-focused, so we keep it.

# Ensure .gitignore is clean
cat > .gitignore << 'GITIGNORE'
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/
build

# misc
.DS_Store
*.pem
*.key
google-*.json

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dev_output.log*
tsc_output.txt

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# turbo
.turbo

# vercel
.vercel

# ui
dist/

# typedoc generated docs
docs/api/
docs/api-markdown/
.stryker
.stryker-tmp
stryker.log

# Android/Expo
artifacts/
android/app/build/
android/app/debug
android/app/release/
android/build/
android/gradlew
android/gradlew.bat
android/gradle/
android/.gradle/
android/local.properties
android/app/google-services.json

# Firebase iOS
**/GoogleService-Info.plist
GoogleService-Info.plist
android/app/src/debug/
android/app/src/release/
android/*.keystore
android/*.jks
*.p12
*.jks
*.apk
*.aab
apps/extension/dist-*.zip

# Translation temp files
packages/donut/locales/en.new.json

# test results
test-results
packages/waffles/test-results/*
**/dist-chrome-*.zip
junit.xml

# Binary / installer files
*.dmg
*.app
*.p8
apps/chrry/public/install/*.dmg
public/installs/*.dmg
apps/chrry/public/installs/*.dmg

# Generated Tauri config
apps/desktop/src-tauri/tauri.conf.json

# Logs
*.log
dev.log
GITIGNORE

# Commit and push
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ No changes to sync."
  exit 0
fi

git add -A
git commit -m "chore: sync public subset from sushi monorepo ($(date -u +%Y-%m-%d))"
git push --force "$AUTH_REMOTE" HEAD:refs/heads/$BRANCH

echo "✅ Public sync complete: $TARGET_REMOTE"
