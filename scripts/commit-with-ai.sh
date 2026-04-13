#!/bin/bash

# AI-Powered Commit Script
# Usage: npm run c (or just 'c' if you add alias)

set -e

# Check if there are staged changes
if ! git diff --cached --quiet; then
  echo "🤖 Generating AI commit message..."
  
  # Generate commit message
  COMMIT_MSG=$(node scripts/generate-commit-message.js)
  
  # Commit with generated message
  git commit -m "$COMMIT_MSG"
  
  echo "✅ Committed with message: $COMMIT_MSG"
else
  echo "⚠️  No staged changes to commit"
  exit 1
fi
