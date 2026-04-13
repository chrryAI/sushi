/**
 * Sushi Bridge - Main Entry Point
 * Connects browser extensions to local file system and CLI
 */

import { CLIHandler } from "./handlers/cli"
import { FileSystemHandler } from "./handlers/fs"
import { GitHandler } from "./handlers/git"
import type { Message } from "./transports/native"
import { ChromeNativeTransport } from "./transports/native"
import { WebSocketTransport } from "./transports/websocket"

class SushiBridge {
  private fs: FileSystemHandler
  private cli: CLIHandler
  private git: GitHandler

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.fs = new FileSystemHandler(projectRoot)
    this.cli = new CLIHandler(projectRoot)
    this.git = new GitHandler(projectRoot)

    console.error("🍣 Sushi Bridge starting...")
    console.error(`📁 Project root: ${projectRoot}`)
  }

  /**
   * Handle incoming messages from extension
   */
  async handleMessage(message: Message): Promise<any> {
    const { type, ...params } = message

    switch (type) {
      // File system operations
      case "fs:read":
        return this.fs.read(params.path)

      case "fs:write":
        return this.fs.write(params.path, params.content)

      case "fs:ls":
        return this.fs.ls(params.path || ".")

      // CLI operations
      case "cli:exec":
        return this.cli.exec(params.command, params.streamId)

      case "cli:exec_alias":
        return this.cli.execAlias(params.alias)

      // Git operations
      case "git:status":
        return this.git.status()

      case "git:diff":
        return this.git.diff(params.path)

      // Ping/health check
      case "ping":
        return { success: true, message: "pong", version: "1.0.0" }

      default:
        return { success: false, error: `Unknown message type: ${type}` }
    }
  }

  /**
   * Start both transports
   */
  start() {
    const mode = process.env.SUSHI_MODE || "dual"

    // Chrome Native Messaging (for extensions)
    if (mode === "native" || mode === "dual") {
      const nativeTransport = new ChromeNativeTransport()
      nativeTransport.start((msg) => this.handleMessage(msg))
      console.error("✅ Chrome Native Messaging transport started")
    }

    // WebSocket (for fallback + other clients)
    if (mode === "websocket" || mode === "dual") {
      const wsTransport = new WebSocketTransport()
      wsTransport.start((msg) => this.handleMessage(msg))
      console.error("✅ WebSocket transport started on port 3456")
    }

    console.error("🍣 Sushi Bridge ready!")
  }
}

// Get project root from args or default to current directory
const projectRoot = process.argv[2] || process.cwd()

// Start the bridge
const bridge = new SushiBridge(projectRoot)
bridge.start()
