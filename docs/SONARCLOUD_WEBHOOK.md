# SonarCloud Webhook Integration

This integration allows real-time tracking of code quality metrics and issues from SonarCloud.

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# SonarCloud Configuration
SONAR_TOKEN=your_sonar_token_here
SONAR_WEBHOOK_SECRET=your_random_secret_here
```

**Getting your SonarCloud token:**

1. Go to https://sonarcloud.io/account/security
2. Generate a new token with "Execute Analysis" permission
3. Copy the token to `SONAR_TOKEN`

**Creating a webhook secret:**

```bash
# Generate a random secret
openssl rand -hex 32
```

### 2. Configure Webhook in SonarCloud

1. Go to your project in SonarCloud
2. Navigate to **Administration > Webhooks**
3. Click **Create**
4. Configure:
   - **Name**: `Vex Production` (or your environment name)
   - **URL**: `https://your-api-domain.com/api/sonarWebhook`
   - **Secret**: Use the same value as `SONAR_WEBHOOK_SECRET`

### 3. Test the Webhook

After configuration, trigger an analysis:

```bash
# Run SonarScanner (example for npm project)
npm run sonar
```

Check your API logs for:

```
🔔 SonarCloud webhook received: { project: 'chrryAI_vex', status: 'OK', ... }
✅ Stored X metrics for chrryAI_vex
```

## Webhook Payload

The webhook receives notifications for:

- **Project analysis completion** - Stores metrics snapshot
- **Quality gate status changes** - Logs status (OK/ERROR)
- **Issue updates** - Updates issue status in database

### Example Payload

```json
{
  "serverUrl": "https://sonarcloud.io",
  "taskId": "AXouyxDpizdp4B1K",
  "status": "SUCCESS",
  "analysedAt": "2023-05-11T10:00:00+0000",
  "project": {
    "key": "chrryAI_vex",
    "name": "vex",
    "url": "https://sonarcloud.io/dashboard?id=chrryAI_vex"
  },
  "qualityGate": {
    "name": "Sonar way",
    "status": "OK",
    "conditions": [
      {
        "metric": "new_coverage",
        "operator": "LESS_THAN",
        "value": "80",
        "status": "OK",
        "errorThreshold": "80"
      }
    ]
  }
}
```

## Security

The webhook uses **HMAC-SHA256** signature verification to ensure authenticity:

1. SonarCloud generates a signature using your secret
2. Signature is sent in `X-Sonar-Webhook-HMAC-SHA256` header
3. Our endpoint verifies the signature before processing

## Monitoring

### View Webhook Deliveries in SonarCloud

1. Go to **Administration > Webhooks**
2. Click the three-dot menu on your webhook
3. Select **Recent Deliveries**

### Database Tables

Metrics and issues are stored in:

- `sonar_metrics` - Historical metrics snapshots
- `sonar_issues` - Current and resolved issues

### Query Examples

```sql
-- Latest metrics for project
SELECT * FROM sonar_metrics
WHERE project_key = 'chrryAI_vex'
ORDER BY measured_at DESC
LIMIT 10;

-- Open issues by severity
SELECT severity, COUNT(*)
FROM sonar_issues
WHERE project_key = 'chrryAI_vex'
  AND status != 'RESOLVED'
GROUP BY severity;

-- Quality gate trend
SELECT
  DATE(measured_at) as date,
  AVG(value) as avg_coverage
FROM sonar_metrics
WHERE metric_key = 'coverage'
  AND project_key = 'chrryAI_vex'
GROUP BY DATE(measured_at)
ORDER BY date DESC
LIMIT 30;
```

## Troubleshooting

### Webhook not receiving data

1. Check SonarCloud webhook delivery status
2. Verify `SONAR_WEBHOOK_SECRET` matches in both places
3. Ensure your API is publicly accessible
4. Check API logs for errors

### Signature verification failing

```
❌ Invalid webhook signature
```

**Solution**: Ensure `SONAR_WEBHOOK_SECRET` in your `.env` matches the secret configured in SonarCloud.

### Missing metrics

If metrics aren't being stored, check:

1. `SONAR_TOKEN` has correct permissions
2. Project key matches (`chrryAI_vex`)
3. API logs for fetch errors

## Migration from Polling

The old `sonarSync.ts` cron job can be disabled once webhooks are working:

```typescript
// In apps/api/hono/routes/cron.ts
// Comment out or remove:
// cron.get("/sonar", async (c) => {
//   await syncSonarCloud()
//   return c.json({ success: true })
// })
```

Webhooks are more efficient because they:

- ✅ Provide real-time updates (no delay)
- ✅ Reduce API calls (no polling)
- ✅ Lower rate limit usage
- ✅ Capture exact analysis timestamps

## Adding Custom Properties

You can pass custom properties to the webhook payload:

```bash
sonar-scanner -Dsonar.analysis.buildNumber=12345
```

These appear in the webhook payload:

```json
{
  "properties": {
    "sonar.analysis.buildNumber": "12345"
  }
}
```

## Future Enhancements

- [ ] Send Slack/Discord notifications on quality gate failures
- [ ] Create GitHub issues for critical security vulnerabilities
- [ ] Track metrics trends and send weekly reports
- [ ] Integrate with CI/CD pipeline status checks
