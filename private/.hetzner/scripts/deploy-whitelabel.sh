#!/bin/bash

# Auto-deploy white-label Nginx configuration with SSL
# Usage: ./deploy-whitelabel.sh <subdomain> <port>
# Example: ./deploy-whitelabel.sh burn 3008

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ "$EUID" -ne 0 ]]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Check arguments
if [[ $# -lt 2 ]]; then
    echo -e "${RED}Usage: $0 <subdomain> <port>${NC}"
    echo -e "${YELLOW}Example: $0 burn 3009${NC}"
    exit 1
fi

SUBDOMAIN=$1
PORT=$2
DOMAIN="chrry.ai"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/${FULL_DOMAIN}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${FULL_DOMAIN}.conf"

echo -e "${GREEN}🚀 Deploying white-label configuration for ${FULL_DOMAIN}${NC}"

# Create Nginx configuration
echo -e "${YELLOW}📝 Creating Nginx configuration...${NC}"
cat > "$NGINX_CONF" << EOF
server {
    server_name ${FULL_DOMAIN};
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;    # 5 minutes for long AI responses
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    listen 80;
    listen [::]:80;
}
EOF

echo -e "${GREEN}✅ Nginx configuration created${NC}"

# Enable site
echo -e "${YELLOW}🔗 Enabling site...${NC}"
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

# Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
systemctl reload nginx

# Obtain SSL certificate with Certbot
echo -e "${YELLOW}🔒 Obtaining SSL certificate...${NC}"
certbot --nginx -d "${FULL_DOMAIN}" --non-interactive --agree-tos --email iliyan@chrry.ai --redirect

echo -e "${GREEN}✅ SSL certificate obtained and configured${NC}"

# Final Nginx reload
echo -e "${YELLOW}🔄 Final Nginx reload...${NC}"
systemctl reload nginx

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://${FULL_DOMAIN}" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Site is live at: https://${FULL_DOMAIN}${NC}"
else
    echo -e "${YELLOW}⚠️  Site deployed but may not be responding yet${NC}"
    echo -e "${YELLOW}   Make sure your app is running on port ${PORT}${NC}"
fi

# Display configuration summary
echo -e "\n${GREEN}📋 Configuration Summary:${NC}"
echo -e "   Domain: ${FULL_DOMAIN}"
echo -e "   Port: ${PORT}"
echo -e "   Nginx Config: ${NGINX_CONF}"
echo -e "   SSL: Enabled (Let's Encrypt)"
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Make sure your app is running on port ${PORT}"
echo -e "   2. Set VITE_SITE_MODE=${SUBDOMAIN} in your environment"
echo -e "   3. Visit https://${FULL_DOMAIN} to test"
