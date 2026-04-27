#!/bin/bash

# Setup e2e.chrry.ai nginx + SSL
# Run this on your Hetzner server

set -e

DOMAIN="e2e.chrry.ai"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

echo "🚀 Setting up ${DOMAIN}..."

# Step 1: Copy nginx config
echo "📝 Creating nginx config..."
cat > ${NGINX_CONF} << 'EOF'
# Basic HTTP config for e2e.chrry.ai (before SSL)
server {
    listen 80;
    listen [::]:80;
    server_name e2e.chrry.ai;
    client_max_body_size 100M;

    # ACME challenge for Let's Encrypt
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files $uri =404;
    }

    # Proxy to your staging app (adjust port as needed)
    location / {
        proxy_pass http://127.0.0.1:3009;  # Change port if needed
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }
}
EOF

# Step 2: Enable site
echo "🔗 Enabling site..."
ln -sf ${NGINX_CONF} ${NGINX_ENABLED}

# Step 3: Test nginx config
echo "🧪 Testing nginx config..."
nginx -t

# Step 4: Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Step 5: Get SSL certificate
echo "🔒 Getting SSL certificate..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email iliyan@chrry.ai

# Step 6: Test SSL
echo "✅ Testing SSL..."
curl -I https://${DOMAIN} || echo "⚠️  SSL might take a moment to propagate"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your app is running on port 3009"
echo "2. Update Coolify to deploy to this server"
echo "3. Test: https://${DOMAIN}"
echo ""
echo "🔧 Useful commands:"
echo "  - Check nginx status: systemctl status nginx"
echo "  - View logs: tail -f /var/log/nginx/error.log"
echo "  - Reload nginx: systemctl reload nginx"
echo "  - Renew SSL: certbot renew"
