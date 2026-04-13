#!/bin/bash

# Vex - Pre-Open Source Security Check Script
# This script checks for sensitive data before pushing to public repo

set -e

echo "🔒 Vex Security Check - Scanning for sensitive data..."
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Function to report issues
report_issue() {
    echo -e "${RED}❌ ISSUE: $1${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "1️⃣  Checking for .env files in git..."
if git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production\.local$" > /dev/null 2>&1; then
    report_issue ".env files found in git! Remove them immediately:"
    git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production\.local$"
else
    report_success "No .env files in git"
fi
echo ""

echo "2️⃣  Checking for API keys (sk-, AKIA, etc.)..."
if git grep -E "sk-[A-Za-z0-9]{48}|AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16}" -- '*.ts' '*.tsx' '*.js' '*.json' ':!node_modules' ':!dist' ':!.next' > /dev/null 2>&1; then
    report_issue "Potential API keys found in code:"
    git grep -E "sk-[A-Za-z0-9]{48}|AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16}" -- '*.ts' '*.tsx' '*.js' '*.json' ':!node_modules' ':!dist' ':!.next' | head -10
else
    report_success "No API keys found in code"
fi
echo ""

echo "3️⃣  Checking for database URLs..."
if git grep -E "postgresql://[^@]+:[^@]+@|mongodb://[^@]+:[^@]+@|mysql://[^@]+:[^@]+@" -- '*.ts' '*.tsx' '*.js' ':!node_modules' ':!dist' | grep -v "process.env" | grep -v "example" > /dev/null 2>&1; then
    report_issue "Hardcoded database URLs found:"
    git grep -E "postgresql://[^@]+:[^@]+@|mongodb://[^@]+:[^@]+@|mysql://[^@]+:[^@]+@" -- '*.ts' '*.tsx' '*.js' ':!node_modules' ':!dist' | grep -v "process.env" | grep -v "example" | head -5
else
    report_success "No hardcoded database URLs"
fi
echo ""

echo "4️⃣  Checking for private keys and certificates..."
if find . -type f \( -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.jks" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | grep -v ".gitignore" > /dev/null 2>&1; then
    report_issue "Private keys/certificates found:"
    find . -type f \( -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.jks" \) ! -path "*/node_modules/*" ! -path "*/.git/*"
else
    report_success "No private keys or certificates"
fi
echo ""

echo "5️⃣  Checking for hardcoded secrets in code..."
if git grep -iE "password\s*=\s*['\"][^'\"]+['\"]|secret\s*=\s*['\"][^'\"]+['\"]|token\s*=\s*['\"][^'\"]+['\"]" -- '*.ts' '*.tsx' '*.js' ':!node_modules' ':!dist' | grep -v "process.env" | grep -v "example" | grep -v "placeholder" | grep -v "test" > /dev/null 2>&1; then
    report_warning "Potential hardcoded secrets (review manually):"
    git grep -iE "password\s*=\s*['\"][^'\"]+['\"]|secret\s*=\s*['\"][^'\"]+['\"]|token\s*=\s*['\"][^'\"]+['\"]" -- '*.ts' '*.tsx' '*.js' ':!node_modules' ':!dist' | grep -v "process.env" | grep -v "example" | grep -v "placeholder" | grep -v "test" | head -5
else
    report_success "No obvious hardcoded secrets"
fi
echo ""

echo "6️⃣  Checking git history for accidentally committed .env files..."
if git log --all --full-history --diff-filter=A -- "*.env" "*.env.local" "*.env.production.local" | grep -q "commit"; then
    report_warning ".env files found in git history (may need to clean history):"
    git log --all --full-history --oneline --diff-filter=A -- "*.env" "*.env.local" "*.env.production.local" | head -10
else
    report_success "No .env files in git history"
fi
echo ""

echo "7️⃣  Checking for TODO/FIXME comments about secrets..."
if git grep -iE "TODO.*secret|FIXME.*password|TODO.*key|HACK.*token" -- '*.ts' '*.tsx' '*.js' ':!node_modules' > /dev/null 2>&1; then
    report_warning "TODO/FIXME comments mentioning secrets:"
    git grep -iE "TODO.*secret|FIXME.*password|TODO.*key|HACK.*token" -- '*.ts' '*.tsx' '*.js' ':!node_modules' | head -5
else
    report_success "No TODO comments about secrets"
fi
echo ""

echo "8️⃣  Checking for email addresses (review if they should be public)..."
if git grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" -- '*.ts' '*.tsx' '*.js' ':!node_modules' | grep -v "example@" | grep -v "test@" | grep -v "@types" | grep -v "@repo" | grep -v "@chrryai" | grep -v "noreply@" | grep -v "mailto:" > /dev/null 2>&1; then
    report_warning "Email addresses found in code (verify these should be public):"
    git grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" -- '*.ts' '*.tsx' '*.js' ':!node_modules' | grep -v "example@" | grep -v "test@" | grep -v "@types" | grep -v "@repo" | grep -v "@chrryai" | grep -v "noreply@" | grep -v "mailto:" | head -5
else
    report_success "No personal email addresses found"
fi
echo ""

echo "9️⃣  Checking .gitignore coverage..."
REQUIRED_IGNORES=(".env" ".env.local" ".env.production.local" "*.pem" "*.key" "*.p12" "google-*.json")
for pattern in "${REQUIRED_IGNORES[@]}"; do
    if grep -q "^${pattern}$" .gitignore 2>/dev/null; then
        report_success ".gitignore contains: $pattern"
    else
        report_warning ".gitignore missing: $pattern"
    fi
done
echo ""

echo "🔟 Checking for .env.example files..."
ENV_DIRS=("apps/api" "apps/web" "apps/ws" "apps/extension" "packages/db")
for dir in "${ENV_DIRS[@]}"; do
    if [[ -f "$dir/.env.example" ]]; then
        report_success "$dir/.env.example exists"
    else
        report_warning "$dir/.env.example missing (create one for contributors)"
    fi
done
echo ""

echo "=================================================="
if [[ $ISSUES_FOUND -eq 0 ]]; then
    echo -e "${GREEN}🎉 All critical checks passed! Ready for open source.${NC}"
    echo ""
    echo "Recommended next steps:"
    echo "1. Review warnings above"
    echo "2. Create missing .env.example files"
    echo "3. Update README.md with setup instructions"
    echo "4. Add SECURITY.md and CONTRIBUTING.md"
    echo "5. Run: git push origin main"
    exit 0
else
    echo -e "${RED}⚠️  Found $ISSUES_FOUND critical issue(s)! DO NOT push until fixed.${NC}"
    echo ""
    echo "Fix these issues first:"
    echo "1. Remove any committed .env files: git rm --cached .env"
    echo "2. Remove hardcoded secrets from code"
    echo "3. Clean git history if needed (see cleanup script)"
    exit 1
fi
