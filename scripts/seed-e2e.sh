#!/bin/bash

# Smart E2E database seeding
# Only seeds if database is empty or stale

set -e

echo "🔍 Checking E2E database state..."

# Check if test users exist
USER_COUNT=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM \"user\" WHERE email LIKE '%test%'")

if [[ "$USER_COUNT" -lt 4 ]]; then
  echo "🌱 Database needs seeding (found $USER_COUNT test users, need 4)"
  pnpm --filter @chrryai/machine run seed
  echo "✅ Database seeded!"
else
  echo "✅ Database already seeded (found $USER_COUNT test users)"
fi
