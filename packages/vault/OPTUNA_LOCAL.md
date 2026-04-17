# 🏠 Local Optuna Setup Guide

**Hedef**: Local makinende (Mac/Windows/Linux) agent hyperparameter tuning çalıştırmak.

## ✅ Prerequisites

- **Docker Desktop** (Windows/Mac) veya **Docker + Docker Compose** (Linux)
- **~4GB RAM** boş (PostgreSQL + Worker + Dashboard)
- (Opsiyonel) **VEX DB erişimi** - Yoksa synthetic data ile çalışır

## 🚀 Quick Start (3 Komut)

```bash
# 1. Setup script'i çalıştır
./scripts/setup-optuna-local.sh

# 2. veya direkt demo başlat
./scripts/setup-optuna-local.sh demo

# 3. Dashboard'u aç
open http://localhost:8081
```

## 📁 Dosya Yapısı

```
📦 Local Optuna Setup
├── docker-compose.optuna.local.yml    # Local compose
├── .env.optuna.example                # Env şablonu
├── 📄 scripts/
│   └── setup-optuna-local.sh          # Setup script
└── 🔬 workers/trial-worker/
    ├── Dockerfile.local               # Local Dockerfile
    ├── trial_worker_local.py          # Local worker kodu
    └── requirements.txt               # Python deps
```

## 🔧 Manuel Kurulum (Adım Adım)

### 1. Environment Hazırla

```bash
# .env.optuna oluştur
cp .env.optuna.example .env.optuna

# İsteğe göre düzenle
nano .env.optuna
```

**.env.optuna içeriği:**
```bash
# Database (local PostgreSQL için)
OPTUNA_DB_PASS=local_pass_123

# VEX DB (varsa bağlanır, yoksa synthetic data)
VEX_DB_URL=postgresql://postgres@host.docker.internal:5432/v

# Mode: 'mock' (hızlı, API key gerekmez) veya 'real' (gerçek API çağrıları)
TRIAL_MODE=mock

# Opsiyonel API keys (real mode için)
# OPENAI_API_KEY=sk-xxx
```

### 2. Infrastructure'ı Başlat

```bash
# PostgreSQL + Dashboard + Redis
docker compose -f docker-compose.optuna.local.yml up -d

# Portlar:
# - PostgreSQL: localhost:5433
# - Dashboard:  http://localhost:8081
# - Redis:      localhost:6381
```

### 3. Worker'ı Çalıştır

```bash
# Tek seferlik worker (50 trial)
docker compose -f docker-compose.optuna.local.yml --profile worker up -d

# veya interaktif çalıştır
./scripts/setup-optuna-local.sh demo
```

## 🎯 Kullanım Modları

### Mode 1: Mock (Önerilen - Başlangıç için)

```bash
# .env.optuna
TRIAL_MODE=mock
```

**Avantajları:**
- ✅ API key gerektirmez
- ✅ Ücretsiz
- ✅ Hızlı (saniyede 1-2 trial)
- ✅ Synthetic data ile çalışır

**Sonuç:** Hyperparameter kombinasyonlarını test eder, optimal değerleri bulur.

### Mode 2: Real (Gerçek API)

```bash
# .env.optuna
TRIAL_MODE=real
OPENAI_API_KEY=sk-xxx
```

**Avantajları:**
- ✅ Gerçek LLM yanıtları
- ✅ Daha doğru ROUGE skorları
- ✅ Production'a yakın sonuçlar

**Maliyet:** ~$5-10 (100 trial için)

## 📊 Dashboard Kullanımı

### Optuna Dashboard
URL: http://localhost:8081

**Özellikler:**
- 📈 Real-time trial grafiği
- 🔍 Hyperparameter importance
- 📊 Parallel coordinate plot
- 🎯 Contour plot (2D ilişkiler)

### Önemli Metrikler

| Metrik | Açıklama | Hedef |
|--------|----------|-------|
| **Best Value** | En iyi composite score | > 0.70 |
| **ROUGE-1** | Context recall | > 0.65 |
| **ROUGE-L** | Fluency | > 0.50 |
| **Latency** | Yanıt süresi | < 500ms |

## 🧪 Test Senaryoları

### Senaryo 1: Hızlı Test (2 dk)

```bash
# 5 trial, mock mode
./scripts/setup-optuna-local.sh demo

# Sonuçları gör
curl http://localhost:8081/api/studies
```

### Senaryo 2: Derinlemesine Optimizasyon (30 dk)

```bash
# 100 trial, 8 parallel worker (128GB VPS için)
docker compose -f docker-compose.optuna.local.yml up -d
docker compose -f docker-compose.optuna.local.yml --profile worker up -d --scale trial-worker-local=8
```

### Senaryo 3: Gerçek Veri ile

```bash
# .env.optuna düzenle
VEX_DB_URL=postgresql://postgres@host.docker.internal:5432/v
TRIAL_MODE=mock  # veya real

# Çalıştır
docker compose -f docker-compose.optuna.local.yml --profile worker up -d
```

## 🔍 Troubleshooting

### PostgreSQL Bağlantı Hatası

```bash
# Container durumunu kontrol et
docker ps | grep optuna

# Log kontrolü
docker logs optuna-postgres-local

# Manuel test
docker exec -it optuna-postgres-local psql -U optuna -c "SELECT 1;"
```

### Port Çakışması

```bash
# Portları değiştir (docker-compose.optuna.local.yml'de)
ports:
  - "5434:5432"  # PostgreSQL
  - "8082:8080"  # Dashboard
  - "6382:6379"  # Redis
```

### VEX DB Bağlanamıyor

```bash
# Host'tan test et
psql postgresql://postgres@localhost:5432/v -c "SELECT 1;"

# Docker'dan erişim için host.docker.internal kullan
VEX_DB_URL=postgresql://postgres@host.docker.internal:5432/v

# Linux'ta çalışmazsa:
VEX_DB_URL=postgresql://postgres@172.17.0.1:5432/v  # Docker bridge IP
```

### Worker Crash

```bash
# Worker log'u
docker logs optuna-worker-local

# Restart
docker compose -f docker-compose.optuna.local.yml restart trial-worker-local
```

## 📈 Sonuçları Değerlendirme

### En İyi Parametreleri Alma

```bash
# Container içinden
docker exec optuna-postgres-local psql -U optuna -d optuna -c "
SELECT 
    s.study_name,
    t.trial_id,
    t.value as best_score
FROM studies s
JOIN trials t ON s.study_id = t.study_id
WHERE t.state = 'COMPLETE'
ORDER BY t.value DESC
LIMIT 1;
"
```

### Python ile Detaylı Analiz

```python
import optuna

study = optuna.load_study(
    study_name="local-memory-optimizer",
    storage="postgresql://optuna:local_pass_123@localhost:5433/optuna"
)

print(f"Best score: {study.best_value:.3f}")
print(f"Best params: {study.best_params}")

# Importance plot
optuna.visualization.plot_param_importances(study)
```

## 🆚 Cloud (VPS) vs Local

| Özellik | Local | Cloud VPS |
|---------|-------|-----------|
| **Maliyet** | $0 | $200-400/ay |
| **Hız** | 1-2 trial/sn | 5-10 trial/sn |
| **Parallel** | 1-2 worker | 10-20 worker |
| **Veri** | Synthetic/Local DB | Production DB |
| **Kullanım** | Development | Production |

**Öneri:**
- **Local**: Hyperparameter search space'i keşfetmek için
- **Cloud**: Production optimizasyon için

## 🎓 Best Practices

### 1. Başlangıç: Mock Mode
```bash
# İlk olarak mock mode'da 50 trial çalıştır
# Sonuçları değerlendir, search space'i daralt
# Sonra real mode'a geç
```

### 2. Incremental Optimizasyon
```bash
# Aşama 1: Geniş search space (100 trial)
# Aşama 2: Daraltılmış space (50 trial)
# Aşama 3: Fine-tuning (25 trial)
```

### 3. Sonuçları Kaydet
```bash
# Önemli çalışmaları kaydet
docker exec optuna-postgres-local pg_dump -U optuna optuna > optuna_backup.sql
```

## 📝 Özet

Local kurulum için:
1. ✅ Docker Desktop kurulu olsun
2. ✅ `./scripts/setup-optuna-local.sh` çalıştır
3. ✅ http://localhost:8081 adresinden izle
4. ✅ Sonuçları `docker exec` ile al

**Sorun yaşarsan:**
- `docker logs [container-name]` ile log kontrolü
- Port çakışması varsa compose dosyasında değiştir
- VEX DB yoksa synthetic data otomatik kullanılır

Başlayalım mı? 🚀
