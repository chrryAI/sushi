# 🍣 Sushi Bridge

**Connect your browser extension to the local file system and CLI.**

Sushi Bridge is a native application that enables browser extensions to securely access local files and execute commands. It supports both Chrome Native Messaging (primary) and WebSocket (fallback) for maximum compatibility.

## Features

- ✅ **File System Access** - Read, write, and list files
- ✅ **CLI Execution** - Run shell commands with streaming output
- ✅ **Git Operations** - Status and diff commands
- ✅ **.zshrc Aliases** - Execute your custom aliases (`p`, `pu`, `gacr`)
- ✅ **Dual Transport** - Chrome Native Messaging + WebSocket fallback
- ✅ **Secure** - Scoped to project directory only

## Installation

### 1. Build the Bridge

```bash
cd apps/bridge
bun install
bun run build
```

### 2. Install for Chrome

```bash
# Set your extension ID
export SUSHI_EXTENSION_ID="your-extension-id-here"

# Run installer (requires sudo for /usr/local/bin)
bun run install:chrome
```

This will:

- Compile Sushi Bridge to a standalone executable
- Install to `/usr/local/bin/bridge`
- Register as a Chrome native host

### 3. Verify Installation

```bash
# Test the bridge
echo '{"type":"ping"}' | bridge

# Expected output: {"success":true,"message":"pong","version":"1.0.0"}
```

## Usage

### From Extension (Chrome Native Messaging)

```typescript
// Send message to Sushi Bridge
chrome.runtime.sendNativeMessage(
  "com.chrry.sushi.bridge",
  { type: "fs:read", path: "package.json" },
  (response) => {
    console.log(response.content);
  },
);
```

### From Extension (WebSocket Fallback)

```typescript
const ws = new WebSocket("ws://localhost:3456");

ws.send(JSON.stringify({ type: "fs:read", path: "package.json" }));

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log(response.content);
};
```

## API

### File System

#### `fs:read`

Read file content.

```json
{ "type": "fs:read", "path": "src/index.ts" }
```

Response:

```json
{ "success": true, "content": "..." }
```

#### `fs:write`

Write file content.

```json
{ "type": "fs:write", "path": "src/index.ts", "content": "..." }
```

#### `fs:ls`

List directory contents.

```json
{ "type": "fs:ls", "path": "src" }
```

Response:

```json
{
  "success": true,
  "items": [
    { "name": "index.ts", "type": "file" },
    { "name": "handlers", "type": "dir" }
  ]
}
```

### CLI

#### `cli:exec`

Execute a shell command.

```json
{ "type": "cli:exec", "command": "git status" }
```

Response:

```json
{ "success": true, "output": "...", "exitCode": 0 }
```

#### `cli:exec_alias`

Execute a .zshrc alias.

```json
{ "type": "cli:exec_alias", "alias": "p" }
```

### Git

#### `git:status`

Get repository status.

```json
{ "type": "git:status" }
```

#### `git:diff`

Get diff for a file or all changes.

```json
{ "type": "git:diff", "path": "src/index.ts" }
```

## Development

### Run in Development Mode

```bash
# Chrome Native Messaging only
SUSHI_MODE=native bun run dev /path/to/project

# WebSocket only
SUSHI_MODE=websocket bun run dev /path/to/project

# Both (default)
bun run dev /path/to/project
```

### Project Structure

```
apps/bridge/
├── src/
│   ├── index.ts              # Main entry point
│   ├── transports/
│   │   ├── native.ts         # Chrome Native Messaging
│   │   └── websocket.ts      # WebSocket fallback
│   └── handlers/
│       ├── fs.ts             # File system operations
│       ├── cli.ts            # CLI execution
│       └── git.ts            # Git operations
├── scripts/
│   └── install-chrome.js     # Chrome installer
├── manifest.json             # Chrome native host manifest
└── package.json
```

## Security

- **Path Validation** - All file paths are validated to prevent directory traversal
- **Project Scope** - Bridge only accesses files within the configured project directory
- **No External Network** - Chrome Native Messaging uses stdin/stdout (no network)
- **User Approval** - Extension must request `nativeMessaging` permission

## Troubleshooting

### Extension can't connect to bridge

1. Check if bridge is installed:

   ```bash
   which bridge
   ```

2. Verify manifest exists:

   ```bash
   ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
   ```

3. Check extension ID in manifest matches your extension

### Commands fail to execute

1. Ensure project root is set correctly
2. Check that .zshrc is sourced for aliases
3. Verify file permissions

## License

AGPL-3.0
