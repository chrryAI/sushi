# 🎯 SonarCloud Auto-Sync Setup

## ✅ Tamamlandı

### 1. **Smart Sync Logic**

- `hasNewAnalysis()` fonksiyonu eklendi
- Son analiz zamanı ile son sync zamanını karşılaştırır
- Yeni analiz yoksa sync'i skip eder (gereksiz API calls'dan kaçınır)

### 2. **GitHub Actions Workflow**

Dosya: `.github/workflows/sonarcloud.yml`

**Tetiklenme:**

- Her push (main, prod, dev branches)
- Her PR
- Manuel trigger

**Adımlar:**

1. Kod checkout
2. Dependencies install
3. Test coverage (optional)
4. **SonarCloud analizi**
5. 90 saniye bekle (SonarCloud processing için)
6. **Database sync trigger** (`/api/cron/syncSonarCloud`)

### 3. **Coolify Post-Deploy Hook**

Dosya: `scripts/coolify-post-deploy.sh`

Coolify'da kullanmak için:

1. Coolify dashboard'a git
2. Application Settings > Post-Deployment Command
3. Script'i yapıştır veya dosya yolunu ver

## 🚀 Kullanım

### GitHub Actions (Otomatik)

```bash
# Her merge'de otomatik çalışır
git push origin main
```

### Manuel Trigger

```bash
# GitHub Actions UI'dan "Run workflow" butonuna tıkla
# veya
gh workflow run sonarcloud.yml
```

### Coolify (Deployment sonrası)

```bash
# Coolify otomatik çalıştırır her deployment'ta
# Ek ayar gerekmez
```

## 📊 Akış

```
Code Push → GitHub Actions
    ↓
SonarCloud Analysis
    ↓
Wait 90s (processing)
    ↓
Check hasNewAnalysis()
    ↓
    ├─ No new → Skip ✓
    └─ New → Sync to DB ✓
```

## 🔧 Gerekli Secrets

GitHub Repository Settings > Secrets:

- `SONAR_TOKEN` - SonarCloud API token
- `CRON_SECRET` - API endpoint auth

## 📝 Notlar

- **Free Plan**: Webhook yok, GitHub Actions kullanıyoruz
- **Smart Sync**: Gereksiz sync'leri önler
- **Non-blocking**: Sync fail olursa build fail olmaz
- **Retry**: Sonraki deployment'ta tekrar dener

## 🎁 Bonus: Manual Sync

```bash
# Development
curl http://localhost:3000/api/cron/syncSonarCloud \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Production
curl https://chrry.dev/api/cron/syncSonarCloud \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📈 Monitoring

```sql
-- Son sync zamanı
SELECT
  project_key,
  MAX(measured_at) as last_sync,
  COUNT(*) as metric_count
FROM sonar_metrics
GROUP BY project_key;

-- Yeni issues
SELECT severity, COUNT(*)
FROM sonar_issues
WHERE status != 'RESOLVED'
GROUP BY severity;
```
