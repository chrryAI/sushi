# Generic Browser Foundation

White-label Electron browser core for Sushi, Vex, and Chrry browsers.

## Features

- ✅ Full Chromium engine
- ✅ Native file system access
- ✅ Terminal integration
- ✅ Git operations
- ✅ Hot reload
- ✅ Chrome DevTools

## Setup

```bash
# Install dependencies
pnpm install

# Run in development
pnpm dev

# Build for production
pnpm build:mac  # macOS
pnpm build:win  # Windows
pnpm build:linux  # Linux
```

## Architecture

```
src/
├── main/       # Electron main process (Node.js)
├── preload/    # IPC bridge (secure)
└── renderer/   # React UI (browser)
```

## White-Label Usage

This generic browser is consumed by:

- `apps/sushi` - Sushi Browser (dev-focused)
- `apps/vex` - Vex Browser (general AI)
- `apps/chrry` - Chrry Browser (marketplace)

Each brand provides its own:

- Theme colors
- Logo/icons
- Default apps
- AI model preferences
