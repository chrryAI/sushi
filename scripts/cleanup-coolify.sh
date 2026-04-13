#!/bin/bash

# Coolify Docker Cleanup Script
# Run this on your Coolify server to free up disk space

set -e

echo "🧹 Starting Coolify cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check disk usage before cleanup
echo -e "${YELLOW}📊 Disk usage before cleanup:${NC}"
df -h / | grep -v Filesystem

# 1. Remove stopped containers
echo -e "\n${YELLOW}🗑️  Removing stopped containers...${NC}"
docker container prune -f

# 2. Remove unused images
echo -e "\n${YELLOW}🖼️  Removing unused images...${NC}"
docker image prune -a -f

# 3. Remove unused volumes
echo -e "\n${YELLOW}💾 Removing unused volumes...${NC}"
docker volume prune -f

# 4. Remove unused networks
echo -e "\n${YELLOW}🌐 Removing unused networks...${NC}"
docker network prune -f

# 5. Remove build cache
echo -e "\n${YELLOW}🏗️  Removing build cache...${NC}"
docker builder prune -a -f

# 6. Clean up old logs (Coolify specific)
echo -e "\n${YELLOW}📝 Cleaning up old logs...${NC}"
find /data/coolify/logs -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
find /data/coolify/applications -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true

# 7. Remove dangling images
echo -e "\n${YELLOW}🏷️  Removing dangling images...${NC}"
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || echo "No dangling images found"

# 8. Clean up old deployments (keep last 3)
echo -e "\n${YELLOW}🚀 Cleaning up old deployments...${NC}"
# This removes old deployment images, keeping only the 3 most recent
docker images | grep -E "coolify|deployment" | awk '{print $1":"$2}' | tail -n +4 | xargs -r docker rmi 2>/dev/null || echo "No old deployments to remove"

# 9. System-wide cleanup
echo -e "\n${YELLOW}🧽 Running system-wide cleanup...${NC}"
docker system prune -a -f --volumes

# Check disk usage after cleanup
echo -e "\n${GREEN}✅ Cleanup complete!${NC}"
echo -e "${YELLOW}📊 Disk usage after cleanup:${NC}"
df -h / | grep -v Filesystem

# Show space freed
echo -e "\n${GREEN}💾 Docker disk usage:${NC}"
docker system df

echo -e "\n${GREEN}🎉 Coolify cleanup finished!${NC}"
