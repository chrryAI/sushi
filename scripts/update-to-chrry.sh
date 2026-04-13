#!/bin/bash

# Migration script: askvex.com → chrry.ai
# Run this after updating your .env files manually

echo "🍒 Migrating to chrry.ai..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update package.json files
echo "${YELLOW}Step 1: Updating package.json files...${NC}"
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i '' 's/askvex\.com/chrry.ai/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i '' 's/Ask Vex/Chrry/g' {} \;
echo "${GREEN}✓ Updated package.json files${NC}"
echo ""

# Step 2: Update README files
echo "${YELLOW}Step 2: Updating README files...${NC}"
find . -name "README.md" -not -path "*/node_modules/*" -exec sed -i '' 's/askvex\.com/chrry.ai/g' {} \;
find . -name "README.md" -not -path "*/node_modules/*" -exec sed -i '' 's/Ask Vex/Chrry/g' {} \;
echo "${GREEN}✓ Updated README files${NC}"
echo ""

# Step 3: Update TypeScript/JavaScript files (be careful!)
echo "${YELLOW}Step 3: Searching for domain references in code...${NC}"
echo "Files containing 'askvex.com':"
grep -r "askvex\.com" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist . || echo "None found"
echo ""

# Step 4: Check for email references
echo "${YELLOW}Step 4: Searching for old email references...${NC}"
echo "Files containing 'ibsukru@gmail.com':"
grep -r "ibsukru@gmail.com" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist . || echo "None found"
echo ""

# Step 5: List .env files that need manual update
echo "${YELLOW}Step 5: Environment files that need manual update:${NC}"
find . -name ".env*" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null || echo "No .env files found (they might be gitignored)"
echo ""

echo "${GREEN}🎉 Basic migration complete!${NC}"
echo ""
echo "${YELLOW}⚠️  MANUAL STEPS REQUIRED:${NC}"
echo "1. Update .env files with new Stripe keys"
echo "2. Update VITE_APP_URL=https://chrry.ai"
echo "3. Update NEXTAUTH_URL=https://chrry.ai"
echo "4. Review files listed above for domain references"
echo "5. Update OAuth redirect URLs in Google/GitHub consoles"
echo "6. Set up DNS records for chrry.ai"
echo ""
echo "📖 See MIGRATION_TO_CHRRY_AI.md for full checklist"
