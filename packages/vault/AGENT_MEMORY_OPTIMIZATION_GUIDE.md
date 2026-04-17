# 🧠 Agent Memory Optimization Guide

## 📋 Özet

Bu proje, agent'ların uzun konuşmalardaki hafıza performansını ölçer ve optimize eder.

**Mevcut Durum (Benchmark Sonuçları):**
- 22,039 mesaj analiz edildi
- 117 mesajlı en uzun thread
- **ROUGE-1: 0.026** (mock) / hedef: > 0.70
- Context retention ratio: 0.76

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT MEMORY OPTIMIZATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌──────────────────┐                  │
│  │  1. BENCHMARK   │────▶│  2. OPTIMIZATION │                  │
│  │                 │     │                  │                  │
│  │  Real user-agent│     │  Optuna + n8n    │                  │
│  │  dialogue analysis│   │  Hyperparameter  │                  │
│  │  ROUGE scoring  │     │  tuning          │                  │
│  └─────────────────┘     └──────────────────┘                  │
│           │                         │                           │
│           ▼                         ▼                           │
│  ┌──────────────────────────────────────────┐                  │
│  │           3. PRODUCTION                   │                  │
│  │  Optimized params → Real API config      │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Bölüm 1: Benchmark (Mevcut Durum Analizi)

### Ne Yapar?
Gerçek kullanıcı-agent diyaloğunu analiz eder:
1. Thread'de kullanıcı mesajı bulur
2. O mesajdan ÖNCEKİ tüm mesajları context alır
3. Bu context'e göre yeni yanıt üretir
4. Thread'deki GERÇEK agent yanıtı ile karşılaştırır
5. ROUGE-1 ve ROUGE-L skoru hesaplar

### Çalıştırma

```bash
# Mock mode (hızlı, ücretsiz)
./scripts/run-memory-benchmark.sh

# Real API mode (gerçek LLM)
export OPENAI_API_KEY=sk-xxx
./scripts/run-memory-benchmark.sh real
```

### Çıktı Örneği
```
📊 BENCHMARK RESULTS
======================================================================
📈 Overall Statistics (45 samples):
   Average ROUGE-1: 0.026  ← ÇOK DÜŞÜK!
   Average ROUGE-L: 0.015
   
📊 Context Distance Analysis:
   Medium (4-10)    0.027 🔴
   Recent (≤3)      0.025 🔴
   
💡 For Optuna Optimization:
   Target ROUGE-1: > 0.70
   Current: 0.026
   Gap: 0.674  ← İYİLEŞTİRME ALANI
```

---

## 🔧 Bölüm 2: Optimization (Optuna)

### Ne Yapar?
Benchmark sonuçlarını kullanarak en iyi hyperparameter'ları bulur.

### Optimize Edilen Parametreler

| Parametre | Range | Etki |
|-----------|-------|------|
| `context_window` | 4K-32K | Token limiti |
| `temperature` | 0.1-1.0 | Yaratıcılık |
| `max_tokens` | 200-2000 | Yanıt uzunluğu |
| `presence_penalty` | -1.0-1.0 | Tekrar cezası |
| `summary_threshold` | 10-100 | Özetleme eşiği |
| `use_rag` | true/false | RAG kullanımı |

### Kurulum

```bash
# 1. Local setup
./scripts/setup-optuna-local.sh

# 2. veya manuel
docker compose -f docker-compose.optuna.local.yml up -d

# 3. Worker başlat
docker compose -f docker-compose.optuna.local.yml --profile worker up -d
```

### Dashboard'lar
- **Optuna**: http://localhost:8081
- **n8n**: http://localhost:5678

---

## 📊 Dosya Referansı

### Benchmark Scripts
| Dosya | Açıklama |
|-------|----------|
| `scripts/benchmark-agent-memory-real.ts` | 🎯 Gerçek user-agent benchmark |
| `scripts/run-memory-benchmark.sh` | Benchmark runner CLI |
| `scripts/comprehensive-intelligence-report.ts` | 📊 Genel DB analizi |

### Optuna Infrastructure
| Dosya | Açıklama |
|-------|----------|
| `docker-compose.optuna.local.yml` | Local compose |
| infra/docker/docker-compose.optuna.yml | VPS/production compose |
| `workers/trial-worker/trial_worker_v2.py` | 🧠 Yeni worker (real benchmark) |
| `scripts/setup-optuna-local.sh` | Setup script |
| `scripts/optuna-manager.sh` | Yönetim CLI |

---

## 🎯 Çalışma Akışı

### Adım 1: Mevcut Durumu Ölç
```bash
# Benchmark çalıştır
./scripts/run-memory-benchmark.sh

# Sonuç: ROUGE-1 = 0.026 (çok düşük)
```

### Adım 2: Optimize Et
```bash
# Optuna başlat
./scripts/setup-optuna-local.sh start

# 100 trial çalıştır
# Hyperparameter'ları dene
# En iyi kombinasyonu bul
```

### Adım 3: Sonuçları Uygula
```bash
# En iyi parametreleri al
docker exec optuna-postgres-local psql -U optuna -d optuna -c "
SELECT param_name, param_value 
FROM trials t
JOIN trial_params tp ON t.trial_id = tp.trial_id
WHERE t.trial_id = (SELECT trial_id FROM trials 
                    WHERE state = 'COMPLETE' 
                    ORDER BY value DESC LIMIT 1);
"

# API config'ine uygula
# Örnek: context_window = 16384, temperature = 0.3, etc.
```

### Adım 4: Doğrula
```bash
# Yeni benchmark ile doğrula
./scripts/run-memory-benchmark.sh real

# Beklenen: ROUGE-1 > 0.50 (iyileşme)
```

---

## 💡 Önemli Notlar

### Mock vs Real Mode

**Mock Mode** (Başlangıç için):
- ✅ API key gerekmez
- ✅ Ücretsiz
- ✅ Hızlı (1-2 trial/sn)
- ⚠️ ROUGE skorları düşük (simülasyon)

**Real Mode** (Production için):
- ✅ Gerçek LLM yanıtları
- ✅ Doğru ROUGE skorları
- 💰 Maliyet: ~$5-10/100 trial

### Local vs VPS

**Local** (Development):
- 1-2 worker
- Synthetic/Local DB data
- Hızlı iterasyon

**VPS** (Production):
- 10-20 worker
- Production DB bağlantısı
- Paralel optimizasyon

---

## 🔍 Troubleshooting

### Benchmark düşük skor veriyor?
```bash
# Normal! Mock mode'da expected
# Real API mode'a geç:
export OPENAI_API_KEY=sk-xxx
./scripts/run-memory-benchmark.sh real
```

### Optuna worker başlamıyor?
```bash
# Log kontrolü
docker logs optuna-worker-local

# Bağımlılıkları yeniden kur
docker compose -f docker-compose.optuna.local.yml build --no-cache
```

### VEX DB'ye bağlanamıyor?
```bash
# Host.docker.internal çalışmıyorsa:
# .env.optuna'da VEX_DB_URL'i düzenle
VEX_DB_URL=postgresql://postgres@172.17.0.1:5432/v
```

---

## 📈 Hedefler

| Metric | Mevcut | Hedef | Yöntem |
|--------|--------|-------|--------|
| ROUGE-1 | 0.026 | > 0.70 | Hyperparameter tuning |
| Context Retention | 0.76 | > 0.90 | Summary + RAG |
| Latency | ~500ms | < 300ms | Model selection |
| Token Efficiency | Düşük | Yüksek | Context window opt. |

---

## 🎓 Kaynaklar

- [Optuna Docs](https://optuna.readthedocs.io/)
- [ROUGE Score Explained](https://medium.com/@yash009/rouge-score-explained-9e5a8a499102)
- [Agent Memory Best Practices](./OPTUNA_LOCAL.md)

---

## ✅ Başlarken

```bash
# 1. Benchmark (5 dk)
./scripts/run-memory-benchmark.sh

# 2. Optuna Setup (2 dk)
./scripts/setup-optuna-local.sh

# 3. Optimization (30-60 dk)
./scripts/setup-optuna-local.sh start

# 4. Sonuçları gör (http://localhost:8081)
open http://localhost:8081
```

Hazır mısın? 🚀
