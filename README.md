# 🍣 Sushi

> A unified monorepo for building polymorphic AI applications across web, desktop, mobile, and browser extensions.

Sushi is the codename for the internal monorepo that powers the **Chrry** ecosystem. It uses a single toolchain (Vite+, pnpm, Turbo) to deliver multiple apps and reusable packages.

## 🗂️ Workspace Structure

```
sushi/
├── apps/
│   ├── api/           # Core API (Hono + Bun) — private
│   ├── chrry/         # Main PWA / marketing web app — private
│   ├── extension/     # Browser extension (Chrome/Firefox)
│   ├── desktop/       # Tauri desktop app
│   ├── mobile/        # Capacitor mobile app
│   └── agent/         # Autonomous AI agent
├── packages/
│   ├── ui/            # @chrryai/donut — cross-platform UI library
│   ├── waffles/       # @chrryai/waffles — testing utilities
│   ├── machine/       # @chrryai/machine — AI state machines
│   ├── calendar/      # @chrryai/calendar — calendar components
│   ├── focus/         # @chrryai/focus — productivity components
│   ├── typescript-config/ # Shared tsconfig presets
│   ├── vault/            # Drizzle schema & migrations — private
│   ├── shared/        # Shared contexts & stores — private
│   ├── donut/         # UI
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

These packages are published under the `@chrryai` scope and synced to the public AGPL repository.

| Package             | Description                                   | License |
| ------------------- | --------------------------------------------- | ------- |
| `@chrryai/donut`    | Cross-platform web, extension, and mobile     | AGPL    |
| `@chrryai/waffles`  | Playwright + Vitest testing primitives        | AGPL    |
| `@chrryai/machine`  | Effect.js + XState AI orchestration utilities | AGPL    |
| `@chrryai/calendar` | Calendar primitives for extensions            | AGPL    |
| `@chrryai/focus`    | Pomodoro / focus mode components              | AGPL    |

## 🔒 Private Packages

The following packages and apps contain proprietary business logic and **do not** leave this private monorepo:

- `apps/api`, `apps/chrry`
- `packages/vault`, `packages/shared`, `packages/donut`, `packages/sushi`
- `infra/docker/`, `infra/hetzner/`, `infra/vps/`

## 🤝 Contributing

We welcome contributions to the **public packages**. Please read [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) before opening a PR.

For agents and automated tooling, see [AGENTS.md](AGENTS.md) for conventions and build instructions.

## 🔑 License

- **Public packages** (`@chrryai/*`): AGPL
- **Private platform code** (`apps/api`, `apps/chrry`, `packages/vault`, etc.): Proprietary / All rights reserved

See individual `package.json` files for package-level license details.
