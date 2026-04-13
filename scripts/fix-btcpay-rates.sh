#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔧 BTCPay Rate Provider Fix
# ═══════════════════════════════════════════════════════════════

set -e

BTCPAY_URL="${BTCPAY_URL:-https://vault.chrry.dev}"
BTCPAY_API_KEY="${BTCPAY_API_KEY:-}"
BTCPAY_STORE_ID="${BTCPAY_STORE_ID:-}"

PROVIDER="${1:-kraken}"

echo "📝 Updating rate provider to $PROVIDER..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: token $BTCPAY_API_KEY" \
  -d "{\"preferredSource\":\"$PROVIDER\",\"isCustomSource\":false}" \
  "$BTCPAY_URL/api/v1/stores/$BTCPAY_STORE_ID/rates/configuration")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Rate provider updated to $PROVIDER: $BODY"
else
  echo "❌ Failed (HTTP $HTTP_CODE): $BODY"
  exit 1
fi
