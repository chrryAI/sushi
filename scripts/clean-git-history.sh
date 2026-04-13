#!/bin/bash

# Vex - Git History Cleanup Script
# Use this ONLY if you accidentally committed sensitive files in the past
# WARNING: This rewrites git history - use with caution!

set -e

echo "🧹 Vex Git History Cleanup"
echo "=================================================="
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "This should only be used if you accidentally committed sensitive files."
echo ""
read -p "Have you backed up your repo? (yes/no): " backup_confirm

if [[ "$backup_confirm" != "yes" ]]; then
    echo "❌ Please backup your repo first, then run this script again."
    exit 1
fi

echo ""
read -p "Are you sure you want to continue? (yes/no): " continue_confirm

if [[ "$continue_confirm" != "yes" ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo ""
echo "Starting cleanup..."
echo ""

# Remove .env files from history
echo "1️⃣  Removing .env files from history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .env.local .env.production.local apps/*/.env apps/*/.env.local packages/*/.env' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "2️⃣  Removing certificate files from history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch *.pem *.key *.p12 *.jks google-*.json' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "3️⃣  Cleaning up refs..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Verify changes with: git log --all --oneline | head -20"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Force push tags: git push origin --force --tags"
echo ""
echo "⚠️  IMPORTANT: All collaborators must re-clone the repo!"
echo "Old clones will have the sensitive data in their history."
