#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🧪 E2E Test Environment Manager
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="infra/docker/docker-compose.e2e.yml"
ENV_FILE=".env.e2e"

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    cat << EOF
🧪 E2E Test Environment Manager

Kullanım:
  ./scripts/e2e.sh [komut]

Komutlar:
  start       E2E ortamını başlat (build + up)
  stop        E2E ortamını durdur
  restart     E2E ortamını yeniden başlat
  reset       E2E ortamını tamamen sıfırla (verileri sil)
  logs        Logları göster (tüm servisler)
  logs-api    Sadece API logları
  logs-flash  Sadece Flash logları
  status      Servis durumlarını göster
  url         E2E URL'lerini göster
  test        Playwright testlerini çalıştır
  clean       Tüm E2E container ve volumelerini temizle

Örnekler:
  ./scripts/e2e.sh start     # E2E'yi başlat
  ./scripts/e2e.sh logs      # Logları izle
  ./scripts/e2e.sh reset     # Tam temizlik ve yeniden başlat

EOF
}

generate_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env.e2e bulunamadı! Oluşturuluyor..."
        cat > "$ENV_FILE" << 'ENVFILE'
# ⚠️  BU DOSYA OTOMATİK OLUŞTURULDU
# E2E test için rastgele değerler içerir
# Gerçek prod değerleriyle değiştirmeyin!

POSTGRES_USER='vex'
POSTGRES_PASSWORD='e2e_'$(openssl rand -hex 16)
POSTGRES_DB='vex'
DATABASE_URL="postgresql://vex:${POSTGRES_PASSWORD}@hippo:5432/vex"
DB_URL="${DATABASE_URL}"
DB_PROD_URL="${DATABASE_URL}"
DISABLE_DB_SSL='true'

REDIS_PASSWORD='e2e_'$(openssl rand -hex 24)
REDIS_URL="redis://:${REDIS_PASSWORD}@cherry:6379/0"

MINIO_ROOT_USER='e2e_minio'
MINIO_ROOT_PASSWORD='e2e_'$(openssl rand -hex 16)
S3_ACCESS_KEY_ID='e2e_'$(openssl rand -hex 8)
S3_SECRET_ACCESS_KEY='e2e_'$(openssl rand -hex 16)
S3_ENDPOINT='http://peach:9000'
S3_INTERNAL_ENDPOINT='http://peach:9000'
S3_PUBLIC_URL='http://localhost:9000'
S3_BUCKET_NAME='e2e-chat-files'
S3_BUCKET_NAME_APPS='e2e-app-profiles'
S3_BUCKET_NAME_INSTALLS='e2e-installs'

FALKORDB_HOST='vex'
FALKORDB_PORT='6379'
ENABLE_GRAPH_RAG='false'

NODE_ENV='e2e'
PORT='3000'
API_PORT='3002'
API_INTERNAL_URL='http://api:3002'
VITE_NODE_ENV='e2e'
VITE_API_URL='http://localhost:3001/api'
VITE_CHRRY_URL='http://localhost:3001'
VITE_WS_URL='ws://localhost:3001'
CHRRY_URL='http://localhost:3001'
FRONTEND_URL='http://localhost:3001'
API_URL='http://localhost:3001/api'

AUTH_SECRET='e2e_'$(openssl rand -hex 32)
AUTH_TOKEN="${AUTH_SECRET}"
AUTH_TRUST_HOST='true'
ENCRYPTION_KEY='e2e_'$(openssl rand -hex 32)
CRON_SECRET='e2e_'$(openssl rand -hex 32)
IP_PEPPER='e2e_'$(openssl rand -hex 32)
IP_SALT='e2e_'$(openssl rand -hex 32)

# AI Keys (FAKE - won't work with real APIs)
OPENAI_API_KEY='sk-e2e-fake-'$(openssl rand -hex 32)
CLAUDE_API_KEY='sk-e2e-fake-'$(openssl rand -hex 32)
GEMINI_API_KEY='e2e-fake-'$(openssl rand -hex 32)
DEEPSEEK_API_KEY='sk-e2e-fake-'$(openssl rand -hex 32)

# OAuth (TEST)
GOOGLE_WEB_CLIENT_ID='e2e-test.apps.googleusercontent.com'
GOOGLE_WEB_CLIENT_SECRET='e2e_'$(openssl rand -hex 32)
GITHUB_CLIENT_ID='Ov23liTEST'
GITHUB_CLIENT_SECRET='e2e_'$(openssl rand -hex 32)

# Stripe (TEST MODE)
STRIPE_SECRET_KEY='sk_test_e2e_'$(openssl rand -hex 32)
VITE_STRIPE_PUBLISHABLE_KEY='pk_test_e2e_'$(openssl rand -hex 32)
STRIPE_WEBHOOK_SECRET='whsec_e2e_'$(openssl rand -hex 32)

# Monitoring (OFF)
SENTRY_DSN=''
VITE_SENTRY_DSN=''

# Test Users
VEX_TEST_EMAIL='e2e@test.local'
VEX_TEST_PASSWORD='e2e-test-123'
SEED_MODE='e2e'
ENVFILE
        log_success ".env.e2e oluşturuldu"
    fi
}

start_e2e() {
    log_info "E2E ortamı başlatılıyor..."
    generate_env
    
    log_info "Docker container'ları build ediliyor..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel
    
    log_info "Servisler başlatılıyor..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_info "API'nin hazır olması bekleniyor..."
    sleep 5
    
    # Health check
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            log_success "E2E ortamı hazır!"
            show_urls
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "API başlatılamadı. Logları kontrol edin:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs api --tail=50
    return 1
}

stop_e2e() {
    log_info "E2E ortamı durduruluyor..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "E2E ortamı durduruldu"
}

reset_e2e() {
    log_warning "Tüm E2E verileri SİLİNECEK!"
    read -p "Emin misiniz? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v
        log_success "E2E ortamı tamamen temizlendi"
        start_e2e
    else
        log_info "İşlem iptal edildi"
    fi
}

show_logs() {
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$@"
}

show_status() {
    echo -e "\n${BLUE}🐳 E2E Container Durumu:${NC}\n"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo -e "\n${BLUE}🔗 Servis Sağlık Kontrolü:${NC}\n"
    
    # API Health
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ API (http://localhost:3001)${NC}"
    else
        echo -e "${RED}  ❌ API (http://localhost:3001)${NC}"
    fi
    
    # Flash Health
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Flash (http://localhost:3000)${NC}"
    else
        echo -e "${RED}  ❌ Flash (http://localhost:3000)${NC}"
    fi
    
    # MinIO
    if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ MinIO (http://localhost:9000)${NC}"
    else
        echo -e "${RED}  ❌ MinIO (http://localhost:9000)${NC}"
    fi
    
    # Mailhog
    if curl -s http://localhost:8025 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Mailhog (http://localhost:8025)${NC}"
    else
        echo -e "${RED}  ❌ Mailhog (http://localhost:8025)${NC}"
    fi
    
    echo ""
}

show_urls() {
    echo -e "\n${GREEN}🌐 E2E Uygulama URL'leri:${NC}\n"
    echo -e "  ${YELLOW}Frontend:${NC}  http://localhost:3000"
    echo -e "  ${YELLOW}API:${NC}       http://localhost:3001/api"
    echo -e "  ${YELLOW}Health:${NC}    http://localhost:3001/api/health"
    echo -e "  ${YELLOW}MinIO:${NC}     http://localhost:9000 (console: 9001)"
    echo -e "  ${YELLOW}Mailhog:${NC}   http://localhost:8025"
    echo ""
}

run_tests() {
    log_info "Playwright testleri çalıştırılıyor..."
    if [ -f "playwright.config.ts" ]; then
        npx playwright test
    else
        log_error "playwright.config.ts bulunamadı"
        exit 1
    fi
}

clean_e2e() {
    log_warning "Tüm E2E container, volume ve image'leri SİLİNECEK!"
    read -p "Emin misiniz? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --rmi all
        log_success "E2E tamamen temizlendi"
    else
        log_info "İşlem iptal edildi"
    fi
}

# Main
case "${1:-help}" in
    start)
        start_e2e
        ;;
    stop)
        stop_e2e
        ;;
    restart)
        stop_e2e
        start_e2e
        ;;
    reset)
        reset_e2e
        ;;
    logs)
        show_logs
        ;;
    logs-api)
        show_logs api
        ;;
    logs-flash)
        show_logs flash
        ;;
    status)
        show_status
        ;;
    url|urls)
        show_urls
        ;;
    test)
        run_tests
        ;;
    clean)
        clean_e2e
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac
