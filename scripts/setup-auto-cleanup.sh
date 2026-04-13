#!/bin/bash

# Setup automatic Coolify cleanup cron job
# This will run cleanup daily at 3 AM

set -e

echo "⏰ Setting up automatic Coolify cleanup..."

# Create the cron job
CRON_JOB="0 3 * * * /root/cleanup-coolify.sh >> /var/log/coolify-cleanup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "cleanup-coolify.sh"; then
    echo "✅ Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added - will run daily at 3 AM"
fi

# Make cleanup script executable
chmod +x /root/cleanup-coolify.sh

echo "🎉 Auto-cleanup setup complete!"
echo "📝 Logs will be saved to: /var/log/coolify-cleanup.log"
