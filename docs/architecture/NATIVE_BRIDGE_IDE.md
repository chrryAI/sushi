# Vex Native Bridge: Browser-First IDE Architecture

## Vision

The **Vex Native Bridge** enables a revolutionary Browser-First, AI-Driven IDE that turns your browser extension into a complete development environment. Unlike traditional VS Code extensions that are isolated to the editor, Vex leverages its position as a LifeOS overlay to provide contextual, zero-friction development workflows.

## Why This is Unique

### The Vex Advantage Over VS Code Extensions

| Feature         | VS Code AI Extension      | Vex Browser-First IDE                                      |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Context**     | Only sees code files      | Sees entire browser context (Figma, docs, production site) |
| **Interaction** | Requires app switching    | Overlay - zero context switch                              |
| **Execution**   | Generic environment       | Your custom `.zshrc` aliases (`p`, `pu`, `gacr`)           |
| **Flow**        | Multi-step manual process | Single AI command                                          |
| **Integration** | Isolated to editor        | Integrated with your entire workflow                       |

### Key Differentiators

1. **AI as Super-CLI**: Chat becomes the command interface
   - "Agent, create a Drizzle schema for userSettings"
   - "Agent, fix the merge conflict and push"
   - "Agent, run the build and check the output"

2. **Zero Context Switch**: IDE overlays on any environment
   - Review code while on production site
   - Edit files while reading documentation
   - Commit changes while viewing design files

3. **Your Power Aliases**: Direct integration with your workflow
   ```bash
   alias p="pnpm run build && pnpm run publish"
   alias pu="pnpm run build:all"
   alias gacr="ga -A && gc '🚀' && gps"
   ```

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Vex Browser Extension (Client)   │
│   - AI Chat Interface               │
│   - File Tree View                  │
│   - Git Status Display              │
└──────────────┬──────────────────────┘
               │ WebSocket/Native Messaging
               │
┌──────────────▼──────────────────────┐
│   Vex Native Bridge (Local Server)  │
│   - File System Access              │
│   - CLI Execution                   │
│   - Git Operations                  │
│   - Environment: Your .zshrc        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   ~/Documents/vex (Your Project)    │
│   - Full file system access         │
│   - Git repository                  │
│   - PNPM workspace                  │
└─────────────────────────────────────┘
```

## Core Principles

1. **Security First**: All operations scoped to user-approved directory (`~/Documents/vex`)
2. **User Consent**: Explicit permission required for Bridge installation
3. **Minimalism**: Only expose strictly necessary functionality
4. **Streaming**: Real-time output for CLI commands (terminal feel)
5. **Efficiency**: Leverage existing aliases and environment

## API Specification

### Communication Protocol

**Transport**: WebSocket (preferred) or Chrome Native Messaging
**Format**: JSON
**Authentication**: Local token-based auth

### 1. File System Operations (`/fs`)

#### Read File

```typescript
// Request
POST /fs/read
{
  "path": "apps/web/App.tsx"
}

// Response
{
  "success": true,
  "content": "import React from 'react'...",
  "encoding": "utf-8"
}
```

#### Write File

```typescript
// Request
POST /fs/write
{
  "path": "apps/web/App.tsx",
  "content": "import React from 'react'..."
}

// Response
{
  "success": true,
  "message": "File written successfully",
  "bytesWritten": 1234
}
```

#### List Directory

```typescript
// Request
POST /fs/ls
{
  "path": "apps/web"
}

// Response
{
  "success": true,
  "items": [
    { "name": "App.tsx", "type": "file", "size": 1234 },
    { "name": "components", "type": "dir" }
  ]
}
```

### 2. CLI Execution (`/cli`)

#### Execute Command (Streaming)

```typescript
// Request (WebSocket)
{
  "type": "cli.exec",
  "command": "pnpm run build",
  "streamId": "build-123",
  "cwd": "apps/web"
}

// Response Stream
{
  "streamId": "build-123",
  "output": "> vite build\n",
  "isDone": false
}
{
  "streamId": "build-123",
  "output": "✓ built in 2.5s\n",
  "isDone": true,
  "exitCode": 0
}
```

#### Execute Alias

```typescript
// Request
POST /cli/exec_alias
{
  "alias": "gacr",
  "args": []
}

// Response
{
  "success": true,
  "output": "[main abc123] 🚀\n 3 files changed...\nPushing to origin...",
  "exitCode": 0
}
```

### 3. Git Operations (`/git`)

#### Get Status

```typescript
// Request
POST /git/status
{}

// Response
{
  "success": true,
  "status": " M apps/web/App.tsx\n?? new-file.ts",
  "branch": "main",
  "ahead": 0,
  "behind": 0
}
```

#### Get Diff

```typescript
// Request
POST /git/diff
{
  "path": "apps/web/App.tsx"
}

// Response
{
  "success": true,
  "diff": "@@ -10,7 +10,7 @@\n-const old = 'value'\n+const new = 'value'"
}
```

## AI Agent Workflows

### Example 1: Implement Feature

```
User: "Agent, create a new feature component in apps/web"

1. Agent → Bridge: POST /fs/write
   path: apps/web/components/Feature.tsx
   content: <generated component code>

2. Agent → Bridge: POST /cli/exec_alias
   alias: gacr

3. Agent → User: "Feature component created and committed! 🚀"
```

### Example 2: Fix Bug

```
User: "Agent, there's a bug in App.tsx line 42"

1. Agent → Bridge: POST /fs/read
   path: apps/web/App.tsx

2. Agent analyzes code with Claude/DeepSeek

3. Agent → Bridge: POST /fs/write
   path: apps/web/App.tsx
   content: <fixed code>

4. Agent → Bridge: POST /cli/exec
   command: pnpm run build

5. Agent → User: "Bug fixed and build successful! ✅"
```

### Example 3: Check Status

```
User: "What are my uncommitted changes?"

1. Agent → Bridge: POST /git/status

2. Agent → User: "You have 3 unstaged files:
   - apps/web/App.tsx
   - packages/db/schema.ts
   - README.md"
```

## Implementation Roadmap

### Phase 1: Minimal Viable Bridge (MVP)

- [ ] Basic WebSocket server (Node.js/Bun)
- [ ] `/fs/read` and `/fs/write` endpoints
- [ ] `/cli/exec` with streaming output
- [ ] Extension connection UI
- [ ] Security: Directory scope validation

### Phase 2: Git Integration

- [ ] `/git/status` endpoint
- [ ] `/git/diff` endpoint
- [ ] Git status UI in extension
- [ ] Alias execution (`/cli/exec_alias`)

### Phase 3: Advanced Features

- [ ] File tree view with live updates
- [ ] Terminal emulator in extension
- [ ] Multi-workspace support
- [ ] Remote bridge (SSH tunneling)

### Phase 4: AI Workflows

- [ ] Pre-built agent commands
- [ ] Workflow templates
- [ ] Code review agent
- [ ] Automated testing agent

## Technology Stack

### Bridge Server

- **Runtime**: Bun (fast, modern) or Node.js
- **WebSocket**: `ws` library
- **File System**: Native `fs` module
- **CLI Execution**: `child_process.spawn`
- **Git**: `simple-git` library

### Extension Client

- **Existing**: Your current Vex extension architecture
- **WebSocket**: Existing `useWebSocket` hook
- **UI**: React components (file tree, terminal, git status)

## Security Considerations

1. **Directory Whitelist**: Only allow access to approved directories
2. **Command Whitelist**: Optionally restrict dangerous commands
3. **Local-Only**: Bridge only accepts connections from localhost
4. **Token Auth**: Shared secret between extension and bridge
5. **User Confirmation**: Prompt for destructive operations

## Why This Beats VS Code Extensions

1. **Contextual Intelligence**: Sees what you're doing in the browser
2. **Zero Friction**: No app switching, instant overlay
3. **Your Environment**: Uses your exact `.zshrc` setup
4. **AI-First**: Chat is the primary interface, not menus
5. **Universal**: Works across all your browser tabs

## Next Steps

1. **Create Bridge Server**: Start with basic WebSocket + `/fs/read`
2. **Test Connection**: Extension → Bridge → File read
3. **Add CLI Execution**: Implement streaming command output
4. **Build UI**: File tree and terminal components
5. **Integrate AI**: Connect agents to bridge operations

---

**This is the future of development tools**: AI-driven, browser-first, zero-friction coding.
