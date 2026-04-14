# 🍣 Sushi

> A unified monorepo for building polymorphic AI applications across web, desktop, mobile, and browser extensions.

Sushi is the codename for the internal monorepo that powers the **Chrry** ecosystem. It uses a single toolchain (Vite+, pnpm, Turbo) to deliver multiple apps and reusable packages.

## 🗂️ Workspace Structure

```
sushi/
├── apps/
│   ├── api/           # Core API (Hono + Bun) — private
│   ├── flash/         # Main PWA / marketing web app — private
│   ├── extension/     # Browser extension (Chrome/Firefox)
│   ├── desktop/       # Tauri desktop app
│   ├── mobile/        # Capacitor mobile app
│   ├── bridge/        # Native messaging bridge
│   └── agent/         # Autonomous AI agent
├── packages/
│   ├── ui/            # @chrryai/donut — cross-platform UI library
│   ├── pepper/        # @chrryai/pepper — universal router
│   ├── waffles/       # @chrryai/waffles — testing utilities
│   ├── machine/       # @chrryai/machine — AI state machines
│   ├── calendar/      # @chrryai/calendar — calendar components
│   ├── focus/         # @chrryai/focus — productivity components
│   ├── typescript-config/ # Shared tsconfig presets
│   ├── db/            # Drizzle schema & migrations — private
│   ├── shared/        # Shared contexts & stores — private
│   ├── donut/         # Internal app template — private
│   └── sushi/         # Monorepo orchestration — private
├── infra/             # Docker, nginx, deployment scripts
├── scripts/           # DevOps, CI, and OSS sync scripts
├── docs/              # Architecture, vision, and setup guides
└── workers/           # Background Python workers
```

## ⚡ Quick Start

**Prerequisites:** Node.js ≥20, pnpm 10+

```bash
# Install dependencies
pnpm install

# Start local infrastructure (PostgreSQL, Redis, MinIO, FalkorDB)
pnpm docker:start

# Start API + Flash in development
pnpm dev
```

See [docs/guides/SELF_HOSTING.md](docs/guides/SELF_HOSTING.md) for the full self-hosting guide.

## 📦 Public Packages

These packages are published under the `@chrryai` scope and synced to the public MIT repository.

| Package | Description | License |
|---------|-------------|---------|
| `@chrryai/donut` | Cross-platform React / React Native UI library | MIT |
| `@chrryai/pepper` | Universal router for web, extension, and mobile | MIT |
| `@chrryai/waffles` | Playwright + Vitest testing primitives | MIT |
| `@chrryai/machine` | Effect.js + XState AI orchestration utilities | MIT |
| `@chrryai/calendar` | Calendar primitives for extensions | MIT |
| `@chrryai/focus` | Pomodoro / focus mode components | MIT |

## 🔒 Private Packages

The following packages and apps contain proprietary business logic and **do not** leave this private monorepo:

- `apps/api`, `apps/flash`
- `packages/db`, `packages/shared`, `packages/donut`, `packages/sushi`
- `infra/docker/`, `infra/hetzner/`, `infra/vps/`

## 🤝 Contributing

We welcome contributions to the **public packages**. Please read [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) before opening a PR.

For agents and automated tooling, see [AGENTS.md](AGENTS.md) for conventions and build instructions.

## 🔑 License

- **Public packages** (`@chrryai/*`): MIT
- **Private platform code** (`apps/api`, `apps/flash`, `packages/db`, etc.): Proprietary / All rights reserved

See individual `package.json` files for package-level license details.
