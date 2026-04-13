#!/bin/bash
set -e

# ── Renkler ──────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; NC='\033[0m'
step() { echo -e "\n${B}▶ $1${NC}"; }
ok()   { echo -e "${G}✓ $1${NC}"; }

# ── 1. OrbStack Hard Reset ───────────────────────────────────
step "OrbStack Nuke: Eski Dünya Yıkılıyor..."
orb delete ubuntu -f || true
orb create ubuntu ubuntu
ok "Yeni Ubuntu (Vex-Core) Tertemiz Açıldı."

# ── 2. Akıllı Kurulum (Inside Ubuntu) ────────────────────────
step "Sistem ve Swarm Konfigürasyonu Yapılıyor..."

orb -m ubuntu bash -s << 'EOF'
  set -e
  # 1. Önce temel araçlar
  sudo apt update && sudo apt install -y curl git jq docker.io lsof psmisc build-essential

  # 2. Tailscale Akıllı Yükleme
  curl -fsSL https://tailscale.com/install.sh | sh
  
  # 3. Tailscale Başlat
  sudo tailscale up --accept-dns=false || true
  
  # 4. Tailscale IP'sini Yakala (Gerekirse bekle)
  TS_IP=""
  for i in {1..5}; do
    TS_IP=$(ip -4 addr show tailscale0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "")
    [ -n "$TS_IP" ] && break
    sleep 2
  done

  if [ -z "$TS_IP" ]; then
    echo "⚠ Tailscale IP bulunamadı! Lütfen terminalde 'sudo tailscale up' linkine tıkla."
    # Burada durup kullanıcının login olmasını bekleyebiliriz ama script akışını bozmayalım
  fi

  # 5. Swarm'ı Tailscale IP'si üzerinden ayağa kaldır
  sudo docker swarm init --advertise-addr $TS_IP || true
  
  # 6. Dokploy Kurulumu
  sudo fuser -k 3000/tcp || true
  curl -sSL https://dokploy.com/install.sh | sudo bash || true

  # 7. Token Hazırla
  sudo docker swarm join-token worker -q > /tmp/swarm_token
  echo "$TS_IP" > /tmp/swarm_ip
EOF

# ── 3. Verileri Çek ve VPS Komutunu Hazırla ───────────────────
TOKEN=$(orb -m ubuntu cat /tmp/swarm_token)
IP=$(orb -m ubuntu cat /tmp/swarm_ip)

step "BÜYÜK FİNAL: Sushi'yi (VPS) Bağlama Vakti"
echo -e "${Y}Hocam, VPS (125GB RAM) terminaline git ve şu satırı YAPIŞTIR:${NC}"
echo -e "${G}docker swarm leave --force && docker swarm join --token $TOKEN $IP:2377${NC}"

echo -e "\n${B}👉 Dokploy Arayüzü: http://localhost:3000${NC}"