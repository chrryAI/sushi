#!/bin/bash
# add-city.sh - Launch a new city subdomain in 30 seconds
# Usage: ./add-city.sh <city> <country> <emoji> <color> <language>
# Example: ./add-city.sh berlin Germany 🇩🇪 "#000000" German

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
CITY=$1
COUNTRY=$2
EMOJI=$3
COLOR=$4
LANGUAGE=$5

# Validate arguments
if [[ -z "$CITY" ]] || [[ -z "$COUNTRY" ]] || [[ -z "$EMOJI" ]] || [[ -z "$COLOR" ]] || [[ -z "$LANGUAGE" ]]; then
  echo -e "${RED}❌ Missing arguments${NC}"
  echo ""
  echo "Usage: ./add-city.sh <city> <country> <emoji> <color> <language>"
  echo ""
  echo "Examples:"
  echo "  ./add-city.sh berlin Germany 🇩🇪 '#000000' German"
  echo "  ./add-city.sh paris France 🇫🇷 '#0055A4' French"
  echo "  ./add-city.sh tokyo Japan 🇯🇵 '#BC002D' Japanese"
  echo "  ./add-city.sh mumbai India 🇮🇳 '#FF9933' Hindi"
  echo "  ./add-city.sh saopaulo Brazil 🇧🇷 '#009739' Portuguese"
  echo ""
  exit 1
fi

# Validate environment variables
if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_TOKEN" ]; then
  echo -e "${RED}❌ Missing environment variables${NC}"
  echo ""
  echo "Please set:"
  echo "  export CLOUDFLARE_ZONE_ID='your-zone-id'"
  echo "  export CLOUDFLARE_TOKEN='your-api-token'"
  echo ""
  exit 1
fi

# Capitalize city name
CITY_UPPER=$(echo "$CITY" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

echo ""
echo -e "${PURPLE}╔════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║  🌍 Launching ${CITY_UPPER}.chrry.ai${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Add DNS record via Cloudflare API
echo -e "${CYAN}[1/6]${NC} 📡 Adding DNS record..."
DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"$CITY\",
    \"content\": \"chrry.ai\",
    \"proxied\": true,
    \"ttl\": 1
  }")

DNS_SUCCESS=$(echo "$DNS_RESPONSE" | jq -r '.success')
if [ "$DNS_SUCCESS" != "true" ]; then
  echo -e "${RED}❌ DNS creation failed${NC}"
  echo "$DNS_RESPONSE" | jq '.'
  exit 1
fi
echo -e "${GREEN}✅ DNS record created${NC}"

# Step 2: Create nginx config on server
echo -e "${CYAN}[2/6]${NC} 🔧 Creating nginx config..."
ssh root@162.55.97.114 bash << ENDSSH
cat > /etc/nginx/sites-available/$CITY.chrry.ai.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name $CITY.chrry.ai;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_set_header X-Forwarded-Host \\\$host;
        proxy_set_header X-Forwarded-Port \\\$server_port;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files \\\$uri =404;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$CITY.chrry.ai.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
ENDSSH

if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}✅ Nginx config created${NC}"
else
  echo -e "${RED}❌ Nginx config failed${NC}"
  exit 1
fi

# Step 3: Get SSL certificate
echo -e "${CYAN}[3/6]${NC} 🔒 Getting SSL certificate..."
ssh root@162.55.97.114 "certbot --nginx -d $CITY.chrry.ai --non-interactive --agree-tos --email iliyan@chrry.ai" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ SSL certificate obtained${NC}"
else
  echo -e "${RED}❌ SSL certificate failed${NC}"
  exit 1
fi

# Step 4: Update siteConfig.ts - Add domain detection
echo -e "${CYAN}[4/6]${NC} 📝 Updating siteConfig.ts..."

# Find the line with "// City subdomains" and add after it
SITE_CONFIG="packages/ui/utils/siteConfig.ts"
if ! grep -q "matchesDomain(host, \"$CITY.chrry.ai\")" "$SITE_CONFIG"; then
  # Add domain detection before vex.chrry.ai check
  sed -i '' "/if (matchesDomain(host, \"vex.chrry.ai\"))/i\\
  if (matchesDomain(host, \"$CITY.chrry.ai\")) {\\
    return \"$CITY\"\\
  }\\
\\
" "$SITE_CONFIG"
  
  # Add to validModes array
  sed -i '' "s/\"newYork\",/\"newYork\",\\
    \"$CITY\",/" "$SITE_CONFIG"
  
  echo -e "${GREEN}✅ Domain detection added${NC}"
else
  echo -e "${YELLOW}⚠️  Domain detection already exists${NC}"
fi

# Step 5: Add site configuration
echo -e "${CYAN}[5/6]${NC} 🎨 Adding site configuration..."

# Check if config already exists
if ! grep -q "// $CITY_UPPER configuration" "$SITE_CONFIG"; then
  # Find the line before "// Vex configuration" and add the new config
  TEMP_FILE=$(mktemp)
  awk -v city="$CITY" -v city_upper="$CITY_UPPER" -v country="$COUNTRY" -v emoji="$EMOJI" -v color="$COLOR" -v language="$LANGUAGE" '
  /\/\/ Vex configuration/ {
    print "  // " city_upper " configuration"
    print "  if (mode === \"" city "\") {"
    print "    return {"
    print "      mode: \"" city "\","
    print "      slug: \"" city "\","
    print "      storeSlug: \"compass\","
    print "      name: \"" city_upper "\","
    print "      domain: \"" city ".chrry.ai\","
    print "      url: \"https://" city ".chrry.ai\","
    print "      store: \"https://atlas.chrry.ai\","
    print "      email: \"iliyan@chrry.ai\","
    print "      description:"
    print "        \"Your personal AI assistant designed for " city_upper " and " country ". Chat in " language ", collaborate locally, and get things done faster.\","
    print "      logo: \"" emoji "\","
    print "      primaryColor: \"" color "\","
    print "      links: {"
    print "        github: \"https://github.com/chrryai/vex\","
    print "        docs: \"https://" city ".chrry.ai/docs\","
    print "      },"
    print "      features: ["
    print "        {"
    print "          title: \"" language " Language Support\","
    print "          description: \"Native " language " AI assistance\","
    print "          icon: \"🗣️\","
    print "          link: \"/language\","
    print "          isOpenSource: false,"
    print "        },"
    print "        {"
    print "          title: \"Local Insights\","
    print "          description: \"" city_upper "-specific recommendations\","
    print "          icon: \"📍\","
    print "          link: \"/local\","
    print "          isOpenSource: false,"
    print "        },"
    print "        {"
    print "          title: \"Local Collaboration\","
    print "          description: \"Connect with " city_upper " users\","
    print "          icon: \"👥\","
    print "          link: \"/community\","
    print "          isOpenSource: false,"
    print "        },"
    print "      ],"
    print "    }"
    print "  }"
    print ""
  }
  { print }
  ' "$SITE_CONFIG" > "$TEMP_FILE"
  
  mv "$TEMP_FILE" "$SITE_CONFIG"
  echo -e "${GREEN}✅ Site configuration added${NC}"
else
  echo -e "${YELLOW}⚠️  Site configuration already exists${NC}"
fi

# Step 6: Commit and push
echo -e "${CYAN}[6/6]${NC} 🚀 Deploying to Git..."
git add "$SITE_CONFIG"
git commit -m "🌍 Add $CITY_UPPER subdomain ($EMOJI)" > /dev/null 2>&1
git push origin chrry > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Deployed to Git${NC}"
else
  echo -e "${YELLOW}⚠️  Git push failed (might need manual push)${NC}"
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ ${CITY_UPPER}.chrry.ai is LIVE! ${EMOJI}${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌍 URL:${NC} https://$CITY.chrry.ai"
echo -e "${BLUE}🎨 Color:${NC} $COLOR"
echo -e "${BLUE}🗣️  Language:${NC} $LANGUAGE"
echo -e "${BLUE}📍 Country:${NC} $COUNTRY"
echo ""
echo -e "${YELLOW}⚠️  Note: Run 'pnpm dbs' to seed the database${NC}"
echo ""
