# 🧠 Optuna Hyperparameter Tuning Setup

Agent memory ve performans optimizasyonu için self-hosted hyperparameter tuning altyapısı.

## 🎯 Piyasa Konumumuz

Mevcut benchmark sonuçlarımız:
- **22,039 mesaj** analiz edildi
- **117 mesajlı** en uzun thread
- **0.76 retention ratio** (uzun thread'lerde context koruma)
- **53.4%** agent mesaj oranı

Bu kurulum ile **ROUGE skorlarını 0.33 → 0.70+** çıkarmayı hedefliyoruz.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      128GB VPS                                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Optuna     │  │     n8n      │  │   MLflow     │          │
│  │  Dashboard   │  │  Workflow    │  │  Tracking    │          │
│  │   :8080      │  │    :5678     │  │   :5001      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              │  PostgreSQL (optuna-db)  │                       │
│              │   - Trial storage        │                       │
│              │   - n8n workflows        │                       │
│              └────────────┬────────────┘                       │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐           │
│  │   Worker    │  │   Worker    │  │   Worker    │  x N      │
│  │    #1       │  │    #2       │  │    #N       │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Başlat
```bash
# Infrastructure'ı başlat
./scripts/optuna-manager.sh start

# 8 worker ile scale et
./scripts/optuna-manager.sh scale 8
```

### 2. Optimizasyon Başlat
```bash
# Varsayılan study ile 1000 trial
./scripts/optuna-manager.sh optimize agent-memory-optimizer 1000 8

# veya custom study
STUDY_NAME=my-experiment ./scripts/optuna-manager.sh optimize my-experiment 500 4
```

### 3. Monitor
- **Optuna Dashboard**: http://localhost:8080
- **n8n**: http://localhost:5678
- **MLflow**: http://localhost:5001

### 4. Sonuçları Gör
```bash
# En iyi parametreleri göster
./scripts/optuna-manager.sh best

# HTML rapor oluştur
./scripts/optuna-manager.sh report agent-memory-optimizer report.html
```

## ⚙️ Hyperparameter Space

| Parametre | Range | Açıklama |
|-----------|-------|----------|
| `context_window` | 4K-32K | Token limiti |
| `temperature` | 0.1-1.0 | Yaratıcılık vs tutarlılık |
| `top_p` | 0.1-1.0 | Nucleus sampling |
| `max_tokens` | 100-4000 | Maksimum yanıt uzunluğu |
| `presence_penalty` | -2.0-2.0 | Tekrar cezası |
| `frequency_penalty` | -2.0-2.0 | Frekans cezası |
| `retrieval_k` | 1-20 | RAG için chunk sayısı |
| `summary_threshold` | 10-100 | Özetleme mesaj eşiği |
| `use_rag` | true/false | RAG kullanımı |
| `model_name` | gpt-4o-mini, gpt-4o, claude-3-haiku | Model seçimi |

## 📊 Objective Function

```python
composite_score = (
    0.6 * rouge1_score +
    0.4 * rougeL_score
) * (1 - latency_penalty * 0.3)
```

**Hedef**: `composite_score > 0.70`

## 🔧 Advanced Usage

### Custom Trial Worker
```bash
# Worker kodunu düzenle
vim workers/trial-worker/trial_worker.py

# Rebuild et
docker compose -f docker-compose.optuna.yml build trial-worker

# Restart
./scripts/optuna-manager.sh restart
```

### n8n Workflow Entegrasyonu
1. http://localhost:5678 adresine git
2. Login: admin / n8n_pass_123 (default)
3. "New Workflow" → Optuna webhook entegrasyonu kur

### API Integration
Worker'lar mevcut API'nizi çağırabilir:
```python
# trial_worker.py içinde
response = httpx.post(
    f"{API_URL}/api/chat",
    json={
        "messages": context,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens
    }
)
```

## 💰 Maliyet Analizi

| Component | CPU | RAM | Maliyet (aylık) |
|-----------|-----|-----|-----------------|
| VPS (128GB) | 16 cores | 128GB | ~$200-400 |
| Optuna | - | - | Free (open source) |
| n8n | - | - | Free (self-hosted) |
| OpenAI API | - | - | ~$50-200 (trial sayısına göre) |

**Vertex AI karşılaştırması:**
- Google Vertex AI: ~$500-1000/ay
- Self-hosted Optuna: ~$250-600/ay
- **Tasarruf: %40-50**

## 🎓 Best Practices

### 1. Pruning Kullan
```python
# Zayıf trial'ları erken kes
if trial.should_prune():
    raise optuna.TrialPruned()
```

### 2. Distributed Optimization
```bash
# Birden fazla VPS'de çalıştır
# Aynı PostgreSQL storage'a bağlan
WORKER_ID=vps-1 ./scripts/optuna-manager.sh start
WORKER_ID=vps-2 ./scripts/optuna-manager.sh start  # başka VPS'de
```

### 3. Checkpointing
```python
# Uzun trial'lar için ara sonuç raporla
trial.report(intermediate_score, step=1)
```

## 📈 Beklenen Sonuçlar

Mevcut durumumuzdan optimizasyon sonrasına:

| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| ROUGE-1 | 0.33 | 0.70 | **+112%** |
| ROUGE-L | 0.21 | 0.55 | **+162%** |
| Latency | ~500ms | ~300ms | **-40%** |
| Token Usage | Yüksek | Optimized | **-30%** |

## 🆘 Troubleshooting

### Worker'lar başlamıyor
```bash
# Log kontrolü
docker logs optuna-worker-1

# Bağımlılıkları yeniden build et
docker compose -f docker-compose.optuna.yml build --no-cache trial-worker
```

### Database bağlantı hatası
```bash
# PostgreSQL health check
docker exec optuna-db pg_isready -U optuna

# Manuel bağlantı testi
psql $OPTUNA_STORAGE -c "SELECT 1;"
```

### Optuna dashboard boş görünüyor
```bash
# Study oluşturulmuş mu kontrol et
docker exec optuna-db psql -U optuna -d optuna -c "SELECT * FROM studies;"
```

## 📚 CLI Referans

```bash
./scripts/optuna-manager.sh [command]

Commands:
  start              Infrastructure'ı başlat
  stop               Durdur
  restart            Yeniden başlat
  status             Durum göster
  scale <n>          n worker'a scale et
  optimize [study] [trials] [workers]  Optimizasyon başlat
  best [study]       En iyi parametreleri göster
  report [study] [file]  HTML rapor oluştur
  logs [service]     Log göster
  clean              Tüm veriyi sil (DANGER)
  help               Yardım
```

## 🔗 Links

- [Optuna Docs](https://optuna.readthedocs.io/)
- [n8n Docs](https://docs.n8n.io/)
- [MLflow Docs](https://mlflow.org/docs/latest/index.html)
- [Benchmark Sonuçları](./scripts/comprehensive-intelligence-report.ts)

---

**Not**: Bu kurulum mevcut DB yapımıza (22K+ mesaj, 117 max thread depth) göre optimize edilmiştir.
