#!/bin/bash
set -e

# PostgreSQL Restore Script for Production
# Usage: ./restore-postgres.sh [backup_file]

BACKUP_FILE=${1:-"/root/backups/chrry_backup_latest.sql"}
DB_NAME="chrry"
DB_USER="postgres"
CONTAINER_NAME="peach-postgres"

echo "🔄 PostgreSQL Restore Script"
echo "=============================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo "Available backups:"
    ls -lah /root/backups/ 2>/dev/null || echo "No backup directory found"
    exit 1
fi

echo "📁 Backup file: $BACKUP_FILE"
echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"

# Check container status
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "⚠️  Container $CONTAINER_NAME not running, starting..."
    docker start $CONTAINER_NAME || {
        echo "❌ Failed to start container"
        exit 1
    }
    sleep 5
fi

echo ""
echo "⚠️  WARNING: This will REPLACE the current database!"
echo "Current database size:"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null || echo "Unable to check size"

echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🛑 Stopping dependent services..."
docker stop peach-api peach-worker 2>/dev/null || true

echo "📥 Restoring database..."
# Drop and recreate database
docker exec $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
docker exec $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"

echo "🔧 Reinitializing extensions..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "🚀 Starting services..."
docker start peach-api peach-worker 2>/dev/null || true

echo ""
echo "✅ Restore completed!"
echo "New database size:"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null || echo "Unable to check size"

echo ""
echo "📝 Checking database health..."
docker exec $CONTAINER_NAME pg_isready -U $DB_USER
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"
