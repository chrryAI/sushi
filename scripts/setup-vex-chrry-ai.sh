#!/bin/bash

# Setup vex.chrry.ai nginx config (HTTP only for now)

echo "🚀 Setting up vex.chrry.ai..."

# 1. Copy nginx config to server
echo "📋 Copying nginx config..."
scp nginx/vex.chrry.ai.conf root@162.55.97.114:/etc/nginx/sites-available/

# 2. Enable site
echo "🔗 Enabling site..."
ssh root@162.55.97.114 "ln -sf /etc/nginx/sites-available/vex.chrry.ai.conf /etc/nginx/sites-enabled/"

# 3. Test nginx config
echo "🧪 Testing nginx config..."
ssh root@162.55.97.114 "nginx -t"

if [ $? -ne 0 ]; then
    echo "❌ Nginx config test failed!"
    exit 1
fi

# 4. Reload nginx
echo "🔄 Reloading nginx..."
ssh root@162.55.97.114 "systemctl reload nginx"

echo ""
echo "✅ vex.chrry.ai is now live!"
echo "🌐 https://vex.chrry.ai → localhost:3009"
echo ""
echo "Next steps:"
echo "1. Make sure your app is running on port 3009"
echo "2. Update DNS: vex.chrry.ai → 162.55.97.114"
echo "3. Test: curl https://vex.chrry.ai"
echo ""
echo "To add SSL later:"
echo "ssh root@162.55.97.114"
echo "certbot --nginx -d vex.chrry.ai"
