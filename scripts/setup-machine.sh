#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🍣 SUSHI - MACHINE SETUP
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🍉 WATERMELON MACHINE SETUP                              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Soru 1: Deployment tipi
echo "🚀 Deployment tipi seçin:"
echo "   1) 🐳 Docker Compose (Stand-alone)"
echo "   2) 🐝 Docker Swarm (Cluster)"
echo "   3) 📦 Dokploy (PaaS)"
echo ""
read -p "Seçiminiz [1-3]: " DEPLOY_TYPE

case $DEPLOY_TYPE in
  1) COMPOSE_FILE="infra/docker/docker-compose.machine.yml" ;;
  2) COMPOSE_FILE="infra/docker/docker-compose.swarm.yml" ;;
  3) COMPOSE_FILE="docker-compose.dokploy.yml" ;;
  *) echo "❌ Geçersiz seçim"; exit 1 ;;
esac

# Soru 2: BTCPay Server
echo ""
echo "₿ BTCPay Server (Bitcoin Vault) kurulsun mu?"
read -p "E/H: " BTCPAY_ANSWER

if [[ "$BTCPAY_ANSWER" =~ ^[Ee]$ ]]; then
  BTCPAY_ENABLED=true
  echo "✅ BTCPay Server eklenecek"
else
  BTCPAY_ENABLED=false
  echo "❌ BTCPay Server eklenmeyecek"
fi

# Soru 3: Domain
echo ""
read -p "🌐 Domain adresi (boş bırakın for localhost): " DOMAIN

if [ -z "$DOMAIN" ]; then
  DOMAIN="localhost"
  echo "   → Localhost modu"
else
  echo "   → Domain: $DOMAIN"
fi

# Environment oluştur
echo ""
echo "📝 .env.machine oluşturuluyor..."

cat > .env.machine << EOF
# ═══════════════════════════════════════════════════════════════
# 🍉 WATERMELON - MACHINE ENVIRONMENT
# ═══════════════════════════════════════════════════════════════

# 🌐 Domain
DOMAIN=$DOMAIN

# 🦛 PostgreSQL (Hippo)
POSTGRES_USER=vex
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=vex

# 🍒 Redis (Cherry)
REDIS_PASSWORD=$(openssl rand -hex 16)

# 🍑 MinIO (Peach)
MINIO_ROOT_USER=sushi
MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)

# ₿ BTCPay Server
BTCPAY_ENABLED=$BTCPAY_ENABLED
BTCPAY_NETWORK=mainnet
BTCPAY_LIGHTNING=false

# 🔑 API Secrets
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
EOF

echo "✅ .env.machine oluşturuldu"

# Compose dosyasını seç
echo ""
echo "🐳 Docker Compose başlatılıyor..."

if [ "$DEPLOY_TYPE" = "2" ]; then
  # Docker Swarm
  echo "🐝 Swarm modu başlatılıyor..."
  docker swarm init 2>/dev/null || true
  docker stack deploy -c $COMPOSE_FILE watermelon
else
  # Standalone veya Dokploy
  docker compose -f $COMPOSE_FILE --env-file .env.machine up -d
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ KURULUM TAMAM                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Servisler:"
echo "   🖥️  Machine Dashboard: http://$DOMAIN:3000"
echo "   🔌 API:               http://$DOMAIN:3001"
echo "   🦛 PostgreSQL:        $DOMAIN:5432"
echo "   🍒 Redis:             $DOMAIN:6379"
echo "   🍑 MinIO:             http://$DOMAIN:9000"
echo "   📧 MailHog:           http://$DOMAIN:8025"

if [ "$BTCPAY_ENABLED" = true ]; then
  echo ""
  echo "₿ BTCPay Server:"
  echo "   🌐 Web UI:   http://$DOMAIN:49392"
  echo "   🔌 API:      http://$DOMAIN:49392/api"
  echo ""
  echo "⚠️  BTCPay Server ilk kurulum için 5-10 dk bekleyin"
fi

echo ""
echo "📝 Loglar için: docker compose -f $COMPOSE_FILE logs -f"
echo ""
