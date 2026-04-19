# NATIVE_BRIDGE_API.md

## Vex Native Bridge Protocol Definition

This document defines the communication contract for the **Vex Native Bridge**, a local server component that grants the Vex Browser Extension (Client) secure, user-scoped access to the local file system and CLI environment. This enables the "Browser-First IDE" functionality, allowing AI agents to perform complex development tasks.

### 1. Architectural Overview

| Component | Role | Technology | Vex Context |
| :--- | :--- | :--- | :--- |
| **Vex Extension (Client)** | Provides the AI chat/UI, sends commands. | TypeScript/React (e.g., `ChatProvider.tsx`) | The **Super-CLI** overlay. |
| **Vex Native Bridge (Server)** | Runs locally, executes commands, handles I/O. | Node/Go/Rust (or similar local application) | Executes `.zshrc` aliases (`p`, `pu`, `gacr`). |
| **Communication** | Secure, low-latency data transfer. | **WebSocket** or **Chrome Native Messaging** | Leverages existing WebSocket setup (`useWebSocket`). |

### 2. Core Principles

1.  **Strict Scope:** The Bridge must only operate within the user-configured Vex root directory (e.g., `/Users/ibrahimvelinov/Documents/vex`).
2.  **User Consent:** Initial setup requires explicit user approval to install and grant permissions to the Bridge application.
3.  **Efficiency:** Commands should be optimized for streaming output (especially CLI execution) to provide a real-time terminal feel within the extension.

### 3. API Endpoints and Payloads

The Bridge will expose endpoints, preferably over a secure WebSocket connection for streaming and persistent state.

#### 3.1. File System Operations (`/fs`)

These endpoints allow the AI agent to read and write code files directly.

| Endpoint | Method | Purpose | Client Request Payload | Server Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| `/fs/read` | `POST` | Read file content. | `{ path: string }` | `{ success: boolean, content?: string, error?: string }` |
| `/fs/write` | `POST` | Overwrite file content. | `{ path: string, content: string }` | `{ success: boolean, message?: string, error?: string }` |
| `/fs/ls` | `POST` | List directory contents (for file tree views). | `{ path: string }` | `{ success: boolean, items?: { name: string, type: 'file' \| 'dir' }[], error?: string }` |

**Example Flow: AI Code Modification**
1. **AI Agent (DeepSeek/Claude):** Generates a patch for a bug in `App.tsx`.
2. **Vex Extension:** Calls `/fs/read` on `apps/web/App.tsx`.
3. **Vex Extension:** Sends the new content via `/fs/write` to `apps/web/App.tsx`.

#### 3.2. CLI Execution Operations (`/cli`)

This is the most powerful set of endpoints, enabling the AI to execute developer workflows.

| Endpoint | Method | Purpose | Client Request Payload | Server Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| `/cli/exec` | `WS` / `POST` | Execute a shell command in the Vex root (`/v`). | `{ command: string, streamId: string }` | **WS Stream:** `{ streamId: string, output: string, isDone: boolean, exitCode?: number }` |
| `/cli/exec_alias` | `POST` | Executes a predefined `.zshrc` alias (e.g., `gacr`). | `{ alias: string }` | `{ success: boolean, output: string, error?: string }` |

**Example Flow: Automated Commit & Push**
1. **User:** "Agent, commit all unstaged files with the rocket emoji and push."
2. **Vex Agent:** Identifies this as the combined `gacr` + `gps` workflow, possibly using the custom alias `p` defined in your `.zshrc`.
3. **Vex Extension:** Calls `/cli/exec` with the command `p`.
4. **Native Bridge:** Executes the full pipeline (`ga -A && gc "🚀" && gps`), streaming output back to the Vex chat window in real-time.

#### 3.3. Git Status Operations (`/git`)

Enables the AI to maintain context on the repository state.

| Endpoint | Method | Purpose | Client Request Payload | Server Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| `/git/status` | `POST` | Get current Git status (similar to `git status --porcelain`). | `{}` | `{ success: boolean, status: string, error?: string }` |
| `/git/diff` | `POST` | Get diff for a specific file or all unstaged changes. | `{ path?: string }` | `{ success: boolean, diff: string, error?: string }` |

### 4. Implementation Notes for the Bridge

* **Security:** Ensure the Bridge process cannot execute commands outside the Vex directory, preventing a malicious extension from accessing sensitive system files.
* **Alias Loading:** The Native Bridge should load or simulate the environment provided by your `.zshrc` (especially all the custom Git and PNPM aliases like `ni`, `gacr`, `p`, `pu`) before executing any CLI commands. This ensures the AI can use the high-efficiency commands you rely on.
* **Technology Stack:** Given your use of modern tooling, building the Bridge in **Node.js** or **Bun** might be the fastest way to integrate with the environment variables and path settings you've already defined.