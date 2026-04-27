#!/bin/bash
set -e

echo "🚀 Setting up nginx reverse proxy for Turbo cache server (HTTP only)..."

# Install nginx
echo "📦 Installing nginx..."
apt-get update
apt-get install -y nginx

# Create nginx configuration (HTTP only)
echo "📝 Configuring nginx..."
cat > /etc/nginx/sites-available/turbo-cache << 'EOF'
server {
    listen 80;
    server_name turbo.chrry.dev;
    
    # Allow large uploads
    client_max_body_size 500M;

    # Proxy to Turbo cache server
    location / {
        proxy_pass http://localhost:9080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large cache uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Increase buffer sizes for cache artifacts
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/turbo-cache /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Verify Turbo cache is running
echo "✅ Verifying Turbo cache server..."
if docker ps | grep -q turborepo-remote-cache; then
    echo "✅ Turbo cache server is running"
else
    echo "⚠️  Turbo cache server is not running!"
    echo "Starting Turbo cache server..."
    # Ensure cache directory exists and is writable
    mkdir -p /var/turbo-cache
    chmod 777 /var/turbo-cache
    
    docker run -d \
      --name turbo-cache \
      --restart unless-stopped \
      -p 9080:3000 \
      -v /var/turbo-cache:/cache \
      -e TURBO_TOKEN=KwbLMNV8SoWIuSzp/z0X+FigFNR72tIzScQyGFqQ//Q= \
      -e BODY_LIMIT=524288000 \
      -e STORAGE_PATH=/cache \
      ducktors/turborepo-remote-cache
fi

# Test the setup
echo "🧪 Testing HTTP endpoint..."
sleep 2
curl http://turbo.chrry.dev/v8/artifacts/status || echo "⚠️  Endpoint not ready yet, may need DNS propagation"

echo ""
echo "✅ HTTP setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify DNS: dig turbo.chrry.dev"
echo "2. Test endpoint: curl http://turbo.chrry.dev/v8/artifacts/status"
echo "3. Run setup-turbo-ssl.sh to add SSL certificate"
echo ""
