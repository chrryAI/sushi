#!/bin/bash
# Coolify Post-Deploy Hook for SonarCloud Sync
# Add this to your Coolify deployment settings under "Post-Deployment Command"

echo "🔄 Triggering SonarCloud sync after deployment..."

# Wait a bit for the new deployment to be fully ready
sleep 10

# Trigger the sync endpoint
curl -X GET https://chrry.dev/api/cron/syncSonarCloud \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -f

if [ $? -eq 0 ]; then
  echo "✅ SonarCloud sync triggered successfully"
else
  echo "⚠️ SonarCloud sync failed, will retry on next deployment"
  exit 0  # Don't fail the deployment
fi
