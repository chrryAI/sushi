#!/bin/bash
# PostgreSQL Health Check Script

echo "🔍 PostgreSQL Health Check"
echo "=========================="

DB_NAME="chrry"
DB_USER="postgres"
CONTAINER_NAME="peach-postgres"

# Check disk space
echo ""
echo "💾 Disk Space:"
df -h / | grep -v "Filesystem"

# Check container
echo ""
echo "🐳 Container Status:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# PostgreSQL readiness
echo ""
echo "🐘 PostgreSQL Status:"
if docker exec $CONTAINER_NAME pg_isready -U $DB_USER > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
    
    # Database stats
    echo ""
    echo "📊 Database Stats:"
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            pg_size_pretty(pg_database_size('$DB_NAME')) as db_size,
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public') as table_count,
            (SELECT COUNT(*) FROM pg_stat_activity WHERE datname='$DB_NAME') as active_connections
        " 2>/dev/null || echo "❌ Unable to query stats"
    
    # Recent errors
    echo ""
    echo "📋 Recent Connections:"
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
        SELECT COUNT(*) as total_users FROM users;
        " 2>/dev/null || echo "❌ Unable to query users"
        
else
    echo "❌ PostgreSQL is NOT responding"
    echo ""
    echo "📜 Last 50 lines of logs:"
    docker logs --tail 50 $CONTAINER_NAME 2>&1 | tail -20
fi
