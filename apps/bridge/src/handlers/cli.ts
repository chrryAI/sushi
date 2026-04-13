/**
 * CLI Execution Handlers
 * Executes shell commands with streaming output
 */

import { spawn } from "node:child_process"

export interface CommandResult {
  success: boolean
  output?: string
  exitCode?: number
  error?: string
}

export class CLIHandler {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  /**
   * Execute a shell command
   */
  async exec(command: string, streamId?: string): Promise<CommandResult> {
    return new Promise((resolve) => {
      console.error(`[CLI] Executing: ${command}`)

      const proc = spawn("zsh", ["-c", command], {
        cwd: this.projectRoot,
        env: process.env,
        shell: true,
      })

      let output = ""
      let errorOutput = ""

      proc.stdout.on("data", (data) => {
        const chunk = data.toString()
        output += chunk
        console.error(`[CLI] stdout: ${chunk}`)
      })

      proc.stderr.on("data", (data) => {
        const chunk = data.toString()
        errorOutput += chunk
        console.error(`[CLI] stderr: ${chunk}`)
      })

      proc.on("close", (code) => {
        console.error(`[CLI] Exited with code: ${code}`)

        if (code === 0) {
          resolve({
            success: true,
            output: output || errorOutput,
            exitCode: code,
          })
        } else {
          resolve({
            success: false,
            output: output || errorOutput,
            exitCode: code,
            error: `Command failed with exit code ${code}`,
          })
        }
      })

      proc.on("error", (error) => {
        console.error(`[CLI] Error: ${error}`)
        resolve({
          success: false,
          error: String(error),
        })
      })
    })
  }

  /**
   * Execute a .zshrc alias
   */
  async execAlias(alias: string): Promise<CommandResult> {
    // Source .zshrc and execute alias
    const command = `source ~/.zshrc && ${alias}`
    return this.exec(command)
  }
}
