#!/bin/bash

# Fix Coolify port conflict and orphaned containers

set -e

echo "🔍 Finding what's using port 3010..."

# Find container using port 3010
CONTAINER_ID=$(docker ps -q --filter "publish=3010")

if [[ -n "$CONTAINER_ID" ]]; then
    echo "📦 Found container using port 3010: $CONTAINER_ID"
    echo "🛑 Stopping container..."
    docker stop $CONTAINER_ID
    docker rm -f $CONTAINER_ID
    echo "✅ Container stopped and removed"
else
    echo "ℹ️  No container found using port 3010"
fi

# Clean up orphaned containers
echo ""
echo "🧹 Cleaning up orphaned containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Remove any containers with 'e2e' in the name
echo ""
echo "🗑️  Removing old e2e containers..."
docker ps -a | grep e2e | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || echo "No e2e containers to remove"

# Check if port is free now
echo ""
echo "🔍 Checking if port 3010 is free..."
if lsof -i :3010 > /dev/null 2>&1; then
    echo "⚠️  Port 3010 is still in use by:"
    lsof -i :3010
    echo ""
    echo "💡 You may need to manually kill the process or change the port"
else
    echo "✅ Port 3010 is now free!"
fi

echo ""
echo "🎉 Cleanup complete! Try deploying again."
