#!/bin/bash

# Test the AI commit message generator manually

echo "🧪 Testing AI commit message generator..."
echo ""

# Check if there are staged changes
if ! git diff --cached --quiet; then
  echo "✅ Found staged changes"
  echo ""
  
  # Run the generator
  node scripts/generate-commit-message.js
else
  echo "⚠️  No staged changes found"
  echo ""
  echo "Stage some changes first:"
  echo "  git add ."
  exit 1
fi
