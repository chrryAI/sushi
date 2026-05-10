    _____ __  _______ __  ______
    / ___// / / / ___// / / /  _/
    \__ \/ / / /\__ \/ /_/ // /  
   ___/ / /_/ /___/ / __  // /   
  /____/\____//____/_/ /_/___/

# 🍣 Sushi Monorepo

> A unified TypeScript monorepo for building polymorphic AI applications across web, desktop, mobile, and browser extensions.

Sushi is the internal codename for the monorepo powering the **Chrry** ecosystem — a polymorphic AI application store.

```
sushi/
├── apps/
│   ├── api/            Hono + Bun core API — private
│   ├── chrry/          Main SSR web app — private
│   ├── desktop/        Tauri v2 desktop app
│   ├── extension/      Chrome/Firefox browser extension
│   ├── mobile/         Capacitor iOS / Android app
│   └── agent/          Autonomous AI agent (Zarathustra)
├── packages/
│   ├── donut/          @chrryai/donut — cross-platform UI
│   ├── pepper/         @chrryai/pepper — universal router
│   ├── waffles/        @chrryai/waffles — Playwright + Vitest
│   ├── machine/        @chrryai/machine — Effect.js AI orchestration
│   └── vault/          Drizzle ORM, schemas, AI vault — private
├── infra/              Docker, nginx, deployment configs
├── docs/               Architecture, vision, setup guides
├── scripts/            DevOps, CI, OSS sync automation
└── workers/            Background workers (Python Optuna)
```

## 🛠 Quick Start

```bash
# 1. Install deps
pnpm install

# 2. Start local stack (Postgres, Redis, MinIO, FalkorDB, Mailhog)
pnpm docker:start

# 3. Init database
cd packages/vault && pnpm run migrate && pnpm run seed

# 4. Dev
pnpm dev          # API (3001) + chrry (3000)
```

## 📦 Built With

| Layer | Stack |
|-------|-------|
| Monorepo | pnpm + Turborepo |
| Frontend | React 19 + Vite+ (SSR) |
| API | Hono + Bun |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7.2+ |
| Graph DB | FalkorDB |
| Storage | MinIO (dev) → AWS S3 (prod) |
| AI Vault | OpenRouter + BYOK encryption |

## 🔒 OSS Boundary

| Scope | License |
|-------|---------|
| `@chrryai/*` packages | AGPL-3.0 (public) |
| Platform code (api, chrry, vault) | Proprietary |

## 🚫 What NOT to Commit

- `.env` files, `*.pem`, `*.key`
- Runtime data: `falkordb_data/`, `redis_waffles_data/`, `*.log`
- Personal tooling dirs: `.claude/`, `.hermes/`, `.qodo/`, etc.

---

Private: https://git.chrry.ai/iliyan/vex  
Public: https://github.com/chrryai/sushi
