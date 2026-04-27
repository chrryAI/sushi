#!/bin/bash
set -e

echo "🔒 Adding SSL certificate to Turbo cache server..."

# Install certbot
echo "📦 Installing certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx -d turbo.chrry.dev \
  --non-interactive \
  --agree-tos \
  --email admin@chrry.dev \
  --redirect

# Test HTTPS
echo "🧪 Testing HTTPS endpoint..."
sleep 2
curl https://turbo.chrry.dev/v8/artifacts/status

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "📋 Your Turbo cache is now available at:"
echo "   https://turbo.chrry.dev"
echo ""
echo "🔄 Update GitHub secrets:"
echo "   TURBO_API: https://turbo.chrry.dev"
echo "   VPS_TURBO_TOKEN: KwbLMNV8SoWIuSzp/z0X+FigFNR72tIzScQyGFqQ//Q="
echo ""
echo "📝 SSL certificate will auto-renew via certbot"
echo ""
