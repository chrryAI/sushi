#!/bin/bash
set -e

echo "🚀 Starting Vex Local Development Stack..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop or Orbstack."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.local.template .env.local
    echo "✅ Created .env.local - please review and update with your API keys"
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

echo "🐳 Starting Docker containers..."
docker-compose -f infra/docker/docker-compose.local.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for PostgreSQL
echo "🔍 Checking PostgreSQL..."
until docker exec vex-postgres pg_isready -U ${POSTGRES_USER:-vex} > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
echo "🔍 Checking Redis..."
until docker exec vex-redis redis-cli -a ${REDIS_PASSWORD:-vex_redis_local} ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

# Wait for MinIO
echo "🔍 Checking MinIO..."
until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo "   Waiting for MinIO..."
    sleep 2
done
echo "✅ MinIO is ready"

# Wait for FalkorDB
echo "🔍 Checking FalkorDB..."
until docker exec vex-falkordb redis-cli ping > /dev/null 2>&1; do
    echo "   Waiting for FalkorDB..."
    sleep 2
done
echo "✅ FalkorDB is ready"

echo ""
echo "🎉 All services are running!"
echo ""
echo "📊 Service URLs:"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo "   MinIO API:   http://localhost:9000"
echo "   MinIO UI:    http://localhost:9001 (user: vex, pass: vex_minio_local_password)"
echo "   FalkorDB:    localhost:6380"
echo "   Mailhog UI:  http://localhost:8025"
echo ""

# Auto-run database setup (create DB, extensions, migrations, seed)
echo "🔧 Auto-setting up database..."
cd "$(dirname "$0")/../.."
if pnpm ensure-db --seed; then
    echo ""
    echo "✅ Database is ready!"
else
    echo ""
    echo "⚠️  Database setup failed. You can retry manually:"
    echo "   pnpm ensure-db --seed"
fi

echo ""
echo "🚀 Start development:"
echo "   pnpm dev"
echo ""
echo "🛑 To stop all services: docker-compose -f infra/docker/docker-compose.local.yml down"
