#!/bin/bash

# Fetch news cron job for VPS
# This script calls the news fetcher API endpoint

# Set your production URL
PRODUCTION_URL="https://chrry.ai"

# Use the same CRON_SECRET as other cron jobs
CRON_SECRET="e66a44a41883ec0bee58d24e29054e335cbdf6ba74701ca3b1a72baea9614bc6"

# Make the request
curl -X GET \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$PRODUCTION_URL/api/cron/fetchNews" \
    2>&1

echo ""
echo "News fetch completed at $(date)"
