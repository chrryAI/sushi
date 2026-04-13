# 🍉 WATERMELON - 🖥️ MACHINE

Complete container environment for Dokploy deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    🖥️ MACHINE (Main App)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   🍩 Donut   │  │     API      │  │   Web View   │      │
│  │  (Web UI)    │  │   (Port 3001)│  │   (Port 3000)│      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
          └─────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐
│  🦛    │    │  🧇    │    │  🍒    │
│ Hippo  │    │Waffles │    │ Cherry │
│(MainDB)│    │ (E2E)  │    │ (Redis)│
└────────┘    └────────┘    └────────┘
    │               │               │
    ▼               ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐
│  🍑    │    │  🔷    │    │  📧    │
│ Peach  │    │  Vex   │    │Mailhog │
│(MinIO) │    │(Falkor)│    │(Email) │
└────────┘    └────────┘    └────────┘
```

## Quick Start

```bash
# Deploy to Dokploy
docker compose -f docker-compose.nuke.yml up -d

# Or local development
pnpm nuke
```

## Services

| Service | Name | Port | Description | Type |
|---------|------|------|-------------|------|
| 🖥️ | **machine** | 3000/3001 | Main App (Donut + API) | App |
| 🦛 | **hippo** | 5432 | PostgreSQL Main DB | Database |
| 🧇 | **waffles** | 5432 | PostgreSQL E2E Test | Database |
| 🍒 | **cherry** | 6379 | Redis Cache | Cache |
| 🍑 | **peach** | 9000 | MinIO S3 Storage | Storage |
| 🔷 | **vex** | 6379 | FalkorDB Graph | Cache |
| 📧 | **mailhog** | 8025 | Email Testing | Utils |

## 📊 Machine Dashboard - Web UI

Access the web UI at `http://localhost:3000` (or Dokploy URL)

Features:
- 📊 Service status monitoring
- 🎛️ Start/Stop containers
- 🔌 Connection URL display
- ⚡ Quick actions

## Database URLs (Internal)

```bash
# 🦛 Hippo (Main DB)
DB_URL="postgresql://vex:vex_local_dev@hippo:5432/vex"

# 🧇 Waffles (E2E Test)
DB_LOCAL_E2E_URL="postgresql://postgres:postgres@waffles:5432/waffles"

# 🍒 Cherry (Redis)
REDIS_URL="redis://:cherry_redis_local@cherry:6379"

# 🍑 Peach (MinIO)
S3_ENDPOINT="http://peach:9000"
```

## Commands

```bash
# Start everything
pnpm nuke

# Stop
pnpm nuke:down

# View logs
docker compose -f docker-compose.nuke.yml logs -f machine

# Access machine shell
docker exec -it watermelon-machine sh

# Access database
docker exec -it watermelon-hippo psql -U vex -d vex
```

## Dokploy Deployment

1. Add `docker-compose.nuke.yml` to Dokploy
2. Set environment variables in Dokploy dashboard
3. Expose ports: `3000` (Donut) and `3001` (API)
4. Deploy!

## Development

```bash
# Run migrations
cd packages/db && pnpm migrate

# Start dev mode
pnpm dev
```

## Ports

| Port | Service | Public |
|------|---------|--------|
| 3000 | 🍩 Donut Web UI | ✅ Yes |
| 3001 | 🔌 API | ✅ Yes |
| 5432 | 🦛 Hippo | ❌ Internal |
| 5433 | 🧇 Waffles | ❌ Internal |
| 6379 | 🍒 Cherry | ❌ Internal |
| 9000 | 🍑 Peach | ❌ Internal |
| 6380 | 🔷 Vex | ❌ Internal |
| 8025 | 📧 Mailhog | ✅ Optional |
