#!/bin/bash

# Script to get your Turbo token for GitHub Secrets and Coolify

echo "🔍 Finding your Turbo token..."
echo ""

if [ -f .turbo/config.json ]; then
    TOKEN=$(cat .turbo/config.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
elif [ -f ~/.turbo/config.json ]; then
    TOKEN=$(cat ~/.turbo/config.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
        echo "✅ Found Turbo token!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 Your Turbo Token:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "$TOKEN"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📝 Next steps:"
        echo ""
        echo "1️⃣  GitHub Actions:"
        echo "   → Go to: https://github.com/YOUR_USERNAME/vex/settings/secrets/actions"
        echo "   → Add secret: TURBO_TOKEN = (token above)"
        echo ""
        echo "2️⃣  Coolify:"
        echo "   → Add environment variable: TURBO_TOKEN = (token above)"
        echo "   → Add environment variable: TURBO_TEAM = diplomaticTechno"
        echo ""
        echo "3️⃣  Copy to clipboard (macOS):"
        echo "   → Run: echo '$TOKEN' | pbcopy"
        echo ""
        echo "🎉 Done! Your builds will be 5-10x faster!"
else
    echo "❌ Token not found in config files"
    echo "Checked: .turbo/config.json and ~/.turbo/config.json"
    echo ""
    echo "Run these commands:"
    echo "  1. npx turbo login"
    echo "  2. npx turbo link"
    echo "  3. ./scripts/get-turbo-token.sh"
fi
