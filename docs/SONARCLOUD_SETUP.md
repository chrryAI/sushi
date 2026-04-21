# SonarCloud Integration Summary

## Current Setup: Manual Polling (Free Plan)

Since SonarCloud webhooks require a **Team or Enterprise plan** ($32+/month), we're using a **polling-based approach** with cron jobs.

## What's Implemented

### 1. **Cron Endpoint** ✅

- **URL**: `GET /api/cron/syncSonarCloud`
- **Auth**: Requires `CRON_SECRET` in Authorization header
- **Frequency**: Can be called manually or scheduled (e.g., every 6 hours)

### 2. **Sync Function** ✅

Located in `apps/api/lib/cron/sonarSync.ts`:

- Fetches **unresolved issues** from SonarCloud
- Fetches **metrics** (bugs, vulnerabilities, coverage, etc.)
- Stores in database tables:
  - `sonar_issues` - Current and historical issues
  - `sonar_metrics` - Metrics snapshots over time

### 3. **Webhook Endpoint** ✅ (Ready for future upgrade)

- **URL**: `POST /api/sonarWebhook`
- **Features**:
  - HMAC-SHA256 signature verification
  - Real-time metrics storage
  - Quality gate status tracking
  - Issue updates
- **Status**: Implemented but requires Team/Enterprise plan to use

## How to Use

### Manual Sync (Development)

```bash
curl http://localhost:3000/api/cron/syncSonarCloud \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Scheduled Sync (Production)

Add to your cron scheduler (e.g., Vercel Cron, GitHub Actions):

```yaml
# .github/workflows/sonar-sync.yml
name: Sync SonarCloud
on:
  schedule:
    - cron: "0 */6 * * *" # Every 6 hours
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger SonarCloud Sync
        run: |
          curl -X GET https://chrry.dev/api/cron/syncSonarCloud \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### View Data

```sql
-- Latest metrics
SELECT * FROM sonar_metrics
WHERE project_key = 'chrryAI_vex'
ORDER BY measured_at DESC
LIMIT 10;

-- Open issues by severity
SELECT severity, COUNT(*) as count
FROM sonar_issues
WHERE project_key = 'chrryAI_vex'
  AND status != 'RESOLVED'
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'BLOCKER' THEN 1
    WHEN 'CRITICAL' THEN 2
    WHEN 'MAJOR' THEN 3
    WHEN 'MINOR' THEN 4
    ELSE 5
  END;
```

## Environment Variables

Required in `.env`:

```bash
SONAR_TOKEN=your_sonar_token_here
CRON_SECRET=your_cron_secret_here
```

Optional (for future webhook support):

```bash
SONAR_WEBHOOK_SECRET=your_webhook_secret_here
```

## Upgrade Path: Webhooks

When you upgrade to Team/Enterprise plan:

1. **Configure webhook in SonarCloud**:
   - Go to Organization > Administration > Webhooks
   - Create webhook:
     - **URL**: `https://chrry.dev/api/sonarWebhook`
     - **Secret**: Use `SONAR_WEBHOOK_SECRET` from `.env`

2. **Benefits of webhooks**:
   - ✅ Real-time updates (no delay)
   - ✅ Reduced API calls
   - ✅ Lower rate limit usage
   - ✅ Exact analysis timestamps

3. **Disable cron** (optional):
   - Remove/comment out the cron schedule
   - Keep endpoint for manual syncs

## Files Created/Modified

- ✅ `apps/api/lib/cron/sonarSync.ts` - Sync logic
- ✅ `apps/api/hono/routes/sonarWebhook.ts` - Webhook endpoint (future)
- ✅ `apps/api/hono/routes/cron.ts` - Added `/syncSonarCloud` endpoint
- ✅ `apps/api/hono/index.ts` - Registered webhook route
- ✅ `docs/SONARCLOUD_WEBHOOK.md` - Full documentation

## Next Steps

1. **Set up scheduled cron** (GitHub Actions or Vercel Cron)
2. **Monitor sync logs** to ensure it's working
3. **Consider upgrading** to Team plan for webhooks if real-time updates are critical
