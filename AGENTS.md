# Sushi Monorepo — Agent Guide

> **Read this first.** This document is the authoritative guide for AI agents working in the `ibsukru/sushi` monorepo (codename: Sushi, product: Vex / Chrry). It covers architecture, conventions, commands, and boundaries. When in doubt, prefer this file over external documentation.

---

## 1. Project Overview

**Sushi** is a unified TypeScript monorepo that powers the **Chrry** ecosystem — a polymorphic AI application platform delivered across web, desktop, mobile, and browser extensions. It is built as a white-label system where a single codebase produces multiple branded products (Vex, Chrry, Atlas, Focus, Popcorn, Zarathustra, Search, Grape, Burn, Vault, Pear, Tribe, Sushi, etc.).

The repository is split across two GitHub remotes:
- **`ibsukru/sushi`** — Private monorepo (this repo). Contains everything.
- **`chrryai/vex`** — Public MIT repo. Contains only public packages and apps.

---

## 2. Technology Stack

### Core Toolchain
- **Package Manager:** pnpm 10.33.0 (enforced via `packageManager` field)
- **Node.js:** >=20.19 (Bun is used for `apps/api` runtime)
- **Monorepo Orchestration:** Turborepo 2.8.20
- **Unified Frontend Tooling:** Vite+ (`vp` CLI) — wraps Vite, Vitest, Oxlint, Oxfmt, tsdown
- **Formatter / Linter:** Biome 2.4.9
- **TypeScript:** 5.9.3 (strict mode)

### Apps
| App | Framework | Runtime | Key Tech |
|-----|-----------|---------|----------|
| `apps/api` | Hono | Bun | Drizzle ORM, Auth.js, WebSockets, Stripe, BTCPay |
| `apps/chrry` | React 19 + Vite SSR | Node.js | Express SSR server, SCSS, white-label routing |
| `apps/extension` | React 19 + Vite | Browser | Chrome Extension Manifest V3, webextension-polyfill |
| `apps/desktop` | Tauri v2 + React 19 | Rust + Node.js | White-label desktop builds (DMG) |
| `apps/mobile` | Capacitor v8 + React 19 | iOS / Android | Firebase Auth, react-native-web |
| `apps/bridge` | Bun (standalone) | Native host | Chrome Native Messaging, WebSocket fallback |
| `apps/agent` | TypeScript + Playwright | Node.js | Autonomous AI agent (job hunting, XP system) |
| `apps/web` | Legacy/minimal | — | Dormant test helpers |

### Packages
| Package | Name | Purpose |
|---------|------|---------|
| `packages/ui` | `@chrryai/chrry` | Cross-platform React UI component library (AGPL-3.0) |
| `packages/pepper` | `@chrryai/pepper` | Universal router for web/native/extension (AGPL-3.0) |
| `packages/waffles` | `@chrryai/waffles` | Playwright + Vitest testing utilities (AGPL-3.0) |
| `packages/machine` | `@chrryai/machine` | Effect.js + XState AI orchestration primitives |
| `packages/calendar` | `@chrryai/calendar` | Calendar components for extensions (stub) |
| `packages/focus` | `@chrryai/focus` | Pomodoro/focus components for extensions (stub) |
| `packages/vault` | `@chrryai/machine` | Drizzle ORM schemas, migrations, AI vault, cache |
| `packages/shared` | `@repo/shared` | Shared React contexts, hooks, platform adapters |
| `packages/donut` | — | Internal UI playground / demo app |
| `packages/sushi` | — | Legacy nested sub-workspace (not integrated) |
| `packages/typescript-config` | `@repo/typescript-config` | Shared tsconfig presets |

### Data & Infrastructure
- **Database:** PostgreSQL 16+ with `pgvector` extension
- **Cache:** Redis 7.2+
- **Graph DB:** FalkorDB (Redis-compatible, for knowledge graph / RAG)
- **Object Storage:** MinIO (local/dev) → AWS S3 (production)
- **Email (local):** Mailhog
- **CI/CD:** GitHub Actions (`.github/workflows/pr.yml`)
- **Deployment:** Coolify (primary), with legacy Dokploy artifacts

---

## 3. Workspace Structure

```
sushi/
├── apps/
│   ├── agent/          # Autonomous AI agent (Zarathustra)
│   ├── api/            # Core backend API (Hono + Bun) — PRIVATE
│   ├── bridge/         # Native messaging bridge for extension
│   ├── desktop/        # Tauri desktop app (white-label)
│   ├── extension/      # Browser extension (Chrome/Firefox, white-label)
│   ├── flash/          # Main SSR web frontend — PRIVATE
│   ├── mobile/         # Capacitor iOS/Android app
│   ├── scripts/        # Shared build utilities (icons, config generators)
│   └── web/            # Legacy/minimal helpers
├── packages/
│   ├── calendar/       # @chrryai/calendar
│   ├── db/             # @chrryai/machine — PRIVATE
│   ├── donut/          # UI playground — PRIVATE
│   ├── focus/          # @chrryai/focus
│   ├── machine/        # @chrryai/machine
│   ├── pepper/         # @chrryai/pepper
│   ├── shared/         # @repo/shared — PRIVATE
│   ├── sushi/          # Nested legacy workspace — PRIVATE
│   ├── typescript-config/ # @repo/typescript-config
│   ├── ui/             # @chrryai/chrry
│   └── waffles/        # @chrryai/waffles
├── infra/              # Docker, nginx, deployment scripts
│   ├── docker/         # All Docker Compose files
│   ├── nginx/          # Nginx configurations
│   ├── hetzner/        # Hetzner VPS configs
│   ├── vps/            # VPS setup scripts
│   ├── aws/            # AWS infrastructure
│   ├── malwareScanner/ # ClamAV scanner setup
│   └── nixpacks.toml   # Nixpacks build config
├── scripts/            # DevOps, CI, and OSS sync scripts
│   ├── deploy/         # Deployment and rescue scripts
│   ├── dev/            # Local development helpers
│   └── oss/            # Open-source sync automation
├── docs/               # Architecture, vision, setup guides
│   ├── architecture/   # Technical architecture docs
│   ├── guides/         # CONTRIBUTING.md, SECURITY.md, SELF_HOSTING.md
│   ├── setup/          # Third-party setup guides
│   └── vision/         # Product vision documents
├── workers/            # Background workers (Python Optuna trial worker)
└── tools/              # Internal tooling
```

---

## 4. Build, Dev, and Test Commands

### Local Development Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Start local Docker stack (Postgres, Redis, MinIO, FalkorDB, Mailhog)
pnpm docker:start
#    or: bash scripts/dev/start-local-stack.sh

# 3. Initialize database
cd packages/vault
pnpm run generate   # Generate Drizzle artifacts
pnpm run migrate    # Run migrations
pnpm run seed       # Seed default data
cd ../..

# 4. Start API + Flash dev servers
pnpm dev            # Runs api (port 3001) + flash (port 3000)
```

### Running Tasks
```bash
# Development
pnpm dev            # API + Flash concurrently
pnpm dev:all        # Same as above

# Build
pnpm build          # turbo build (all packages/apps)

# Lint / Format / Type Check
vp check            # Format + lint + TypeScript type checks
vp lint             # Lint only (Biome)
vp fmt              # Format only (Biome)

# Tests
pnpm test           # Run all unit tests (turbo run test)
vp test             # Same, via Vite+
pnpm run test:unit  # Unit tests excluding waffles
pnpm run test:coverage  # Coverage across packages

# E2E
pnpm run test:e2e   # Playwright E2E via waffles (Chromium)
pnpm run e2e        # Full E2E flow: generate -> migrate -> seed -> e2e

# Database
cd packages/vault
pnpm run generate   # drizzle-kit generate
pnpm run migrate    # drizzle-kit migrate
pnpm run seed       # Seed scripts via tsx
pnpm run studio     # Drizzle Studio

# Docker helpers
pnpm docker:start
pnpm docker:stop
pnpm docker:restart
pnpm docker:clean   # Down + volumes
```

### Vite+ Commands
This project uses **Vite+** (`vp` CLI). Key commands:
- `vp dev` — Vite dev server
- `vp build` — Production build
- `vp test` — Run Vitest
- `vp lint` — Run Oxlint
- `vp fmt` — Run Oxfmt
- `vp check` — Format + lint + type-check
- `vp run <script>` — Run a package.json script (use this if a script name collides with a built-in command)

**Critical:** Do not use `pnpm`, `npm`, or `yarn` directly for package operations. Use `vp install`, `vp add`, `vp remove`, etc. Do not install `vitest`, `oxlint`, `oxfmt`, or `tsdown` directly — they are bundled in Vite+.

**Imports:** Always import from `vite-plus` rather than `vite` or `vitest`:
```ts
import { defineConfig } from "vite-plus";
import { expect, test, vi } from "vite-plus/test";
```

---

## 5. Code Style Guidelines

### Formatter / Linter: Biome
Configuration lives in `biome.json` at the repo root.

**Key settings:**
- Indent: 2 spaces
- Line width: 80
- Line ending: `lf`
- Quotes: double (JSX too)
- Trailing commas: all
- Semicolons: `asNeeded`
- Arrow parentheses: always
- Bracket spacing: true

**Notable linter overrides (many rules are relaxed):**
- `useExhaustiveDependencies`: off
- `noUnusedImports`: off
- `noUnusedVariables`: off
- `noExplicitAny`: off
- `noArrayIndexKey`: off
- `noNonNullAssertion`: off
- `noDangerouslySetInnerHtml`: off
- `useKeyWithClickEvents`: off

**Run formatting/linting:**
```bash
vp check      # Recommended before committing
vp fmt        # Format only
vp lint       # Lint only
pnpm cleanup  # biome check --write --unsafe .
```

### TypeScript Conventions
- Strict mode is enabled.
- Functional components with hooks are preferred.
- Barrel files are common in packages (e.g., `packages/ui/index.ts`).
- Path aliases: `chrry/*` maps to `packages/ui/*` at the root tsconfig level.

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New features
- `fix:` — Bug fixes
- `docs:` — Documentation
- `style:` — Formatting / style changes
- `refactor:` — Refactoring
- `test:` — Tests
- `chore:` — Maintenance

An AI-generated commit message hook runs automatically if the commit message is empty (see `.husky/prepare-commit-msg`).

---

## 6. Testing Instructions

### Test Runners
- **Vitest** — Primary unit/integration runner (apps/api, apps/chrry, packages/ui, packages/vault, packages/machine).
- **Playwright** — E2E and API contract testing (packages/waffles).

### Test Locations
| Package / App | Test Location | Runner |
|---------------|---------------|--------|
| `packages/waffles` | `src/__tests__/` (unit/integration), root `*.spec.ts` (Playwright E2E) | Vitest + Playwright |
| `packages/ui` | `__tests__/*.test.tsx` | Vitest (happy-dom) |
| `packages/vault` | `__tests__/*.test.ts` | Vitest (v8 coverage) |
| `packages/machine` | `src/__tests__/unit/`, `src/__tests__/integration/` | Vitest |
| `apps/api` | `hono/routes/*.test.ts`, `lib/*.test.ts`, `test/*.test.ts` | Vitest |
| `apps/chrry` | `src/server-loader.test.ts` | Vitest |

### Running Specific Test Suites
```bash
# All unit tests
pnpm test

# UI component tests
cd packages/ui && pnpm test

# DB logic tests
cd packages/vault && pnpm test

# Machine integration tests (real AI API calls, 60s timeout, 2 retries)
cd packages/machine && pnpm test:integration

# Waffles E2E
cd packages/waffles && pnpm e2e           # Chromium E2E
pnpm run test:e2e                         # From root

# Waffles API tests (no browser)
cd packages/waffles && pnpm api:test

# Full E2E with DB setup
pnpm run e2e
```

### Testing Patterns
- **API route tests** instantiate Hono apps directly and use `app.request(...)` without starting a real server.
- **Mocking** is heavy in API/Flash tests: `vi.mock("@chrryai/machine", ...)`, `vi.mock("../../lib/rateLimiting", ...)`.
- **UI tests** use `happy-dom` (not jsdom) with `globals: true` and a comprehensive mock context fixture at `packages/ui/__tests__/mocks/mockContexts.tsx`.
- **Machine integration tests** hit real OpenRouter APIs and are skipped if `OPENROUTER_API_KEY` is missing.
- **DB tests** hardcode `DB_URL` to `postgres://postgres:postgres@localhost:5432/postgres` in their Vitest configs — a running local Postgres is required.

### Coverage
| Package | Provider |
|---------|----------|
| `apps/api` | v8 |
| `apps/chrry` | v8 |
| `packages/ui` | istanbul |
| `packages/vault` | v8 |
| `packages/machine` | v8 |

---

## 7. Security Considerations

### Secrets Management
- **Never commit `.env`, `.env.local`, `google-*.json`, `*.pem`, or `*.key` files.**
- All `.env` files are gitignored.
- Use `.env.local.template` as a reference for local development.
- Production secrets are injected via GitHub Actions or Docker Compose environment blocks.

### Pre-Commit Hooks
Two hooks run on every commit:
1. **Gitleaks** scans staged files for secrets (`gitleaks protect --staged`).
2. **Large file check** blocks files >50MB (GitHub limit is 100MB).
3. **SCSS tests** run via `pnpm run test:scss`.

Emergency bypass (use with extreme caution):
```bash
SKIP=gitleaks git commit -m "your message"
```

### API Keys
- AI provider keys support a BYOK (Bring Your Own Key) model.
- User-provided keys are encrypted at rest (`packages/vault/encryption.ts`).
- Rate limiting is enforced in production.

### Database Security
- Use strong passwords in production.
- Enable SSL/TLS for PostgreSQL and Redis.
- Restrict DB access by IP.

---

## 8. Deployment & Infrastructure

### Local Development Stack (`infra/docker/docker-compose.local.yml`)
Services started by `pnpm docker:start`:
| Service | Port | Purpose |
|---------|------|---------|
| Postgres | 5432 | Main DB (user: `vex`, pass: `vex_local_dev`) |
| Redis | 6379 | Cache/sessions (pass: `vex_redis_local`) |
| MinIO | 9000/9001 | S3-compatible storage (user: `vex`, pass: `vex_minio_local_password`) |
| FalkorDB | 6380 | Knowledge graph |
| Mailhog | 1025/8025 | Local SMTP capture |

### Production Deployment
- **Primary platform:** Coolify (`coolify.askvex.com`)
- **Server:** Hetzner VPS (`162.55.97.114`)
- **Reverse proxy:** Nginx on the host handles SSL termination and domain routing.
- **Web app** proxies to port `3008` (Coolify).
- **API** proxies to port `3001`/`3005` (Coolify).
- **Migration in progress:** Moving away from Dokploy to Coolify + raw Nginx.

### CI/CD (`.github/workflows/pr.yml`)
- **Trigger:** Pull requests to `ramen` branch.
- **Jobs:**
  1. `cancel-deployments` — Cancels in-progress Coolify deployments.
  2. `build` — Installs deps, runs `pnpm turbo test`, type-checks, and builds.
  3. `auto-merge` — Automatically merges the PR to `main` if `build` succeeds (restricted to non-fork PRs and trusted bots).
- **Note:** Deploy and live E2E jobs are currently commented out in the workflow.

### Docker Compose Variants
- `docker-compose.local.yml` — Local dev stack
- `docker-compose.sushi.yml` — Legacy production stack on Dokploy/Coolify
- `docker-compose.yml` — Newer production stack (`vex3-stack`), MinIO commented out (migrated to AWS S3)
- `docker-compose.nuke.yml` — "Watermelon" isolated full-stack environment
- `docker-compose.optuna.yml` — Self-hosted hyperparameter tuning
- `docker-compose.btcpay.yml` — Bitcoin payment server
- `docker-compose.tribe.yml` — Mattermost team chat

### White-Label Deployment
`infra/hetzner/.hetzner/scripts/deploy-whitelabel.sh` automates Nginx vhost + SSL setup for new subdomains. Active ports/domains route through a unified Coolify deployment at port `3008` with dynamic domain-based routing inside the app.

---

## 9. Database Architecture

`packages/vault/` is the single source of truth for all data access.

- **ORM:** Drizzle ORM with `postgres-js` driver
- **Schema:** Monolithic `src/schema.ts` (~6,300 lines, 112 tables) plus `src/better-auth-schema.ts`
- **Migrations:** 265+ Drizzle-generated SQL files in `packages/vault/drizzle/`
- **Key domains:** Auth, AI agents/messages/threads, app store, social (tribes), payments/credits, scheduling/jobs, analytics, recruitment, retro/PM, feedback, agent XP/RPG stats

### AI Vault (`src/ai/vault/`)
The AI vault abstracts model selection, API-key resolution, and provider instantiation.
- **Legacy API:** Imperative functions (`getModelProvider`, `getEmbeddingProvider`).
- **Modern API:** Effect-based functional API (`resolveProviderConfig`, `ServerLanguageModelLayer`).
- **Provider routing:** OpenRouter is the primary routing layer.
- **Key hierarchy:** BYOK (user key) → App key → System env key (`OPENROUTER_API_KEY`).
- **Credit gating:** Free tiers use system keys; paid tiers require app keys or BYOK.

---

## 10. OSS Sync Rules

This monorepo is split across two GitHub remotes:

- **`ibsukru/sushi`** — Private monorepo (this repo). Contains everything.
- **`chrryai/vex`** — Public MIT repo. Contains only public packages and apps.

**Public (synced to `chrryai`)**: `packages/donut`, `pepper`, `waffles`, `calendar`, `focus`, `machine`, `typescript-config`, plus `apps/extension`, `desktop`, `mobile`, `bridge`, `agent`.

**Private (never leave this repo)**: `apps/api`, `apps/chrry`, `packages/vault`, `packages/shared`, `packages/donut`, `packages/sushi`, and everything under `infra/`.

**License map:**
- `@chrryai/*` packages: MIT (public)
- Private platform code (`apps/api`, `apps/chrry`, `packages/vault`, etc.): Proprietary / All rights reserved

---

## 11. What NOT to Commit

- **Secrets:** `.env`, `.env.local`, `google-*.json`, `*.pem`, `*.key`
- **Runtime data:** `falkordb_data/`, `redis_waffles_data/`, `*.log`
- **Personal tooling dirs:** `.claude/`, `.iliyan/`, `.qodo/`, `.kiro/`, `.Jules/`, `.zed/`
- **Business docs in root:** All vision and setup docs belong under `docs/`
- **Deployment configs in root:** All Docker and nginx configs belong under `infra/`

---

## 12. Review Checklist for Agents

Before finishing work, verify:

- [ ] Ran `vp install` after pulling remote changes and before getting started.
- [ ] Ran `vp check` and `vp test` to validate changes.
- [ ] If files were moved, updated any relative paths in scripts, Docker Compose, or `package.json`.
- [ ] Did not commit `.env` files, runtime data directories, or personal assistant folders.
- [ ] Did not move proprietary logic into public packages.
- [ ] Verified Biome formatting passes (`vp fmt`).
