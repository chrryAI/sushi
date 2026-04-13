/**
 * Git Operation Handlers
 * Provides Git status and diff operations
 */

import { CLIHandler } from "./cli"

export class GitHandler {
  private cli: CLIHandler

  constructor(projectRoot: string) {
    this.cli = new CLIHandler(projectRoot)
  }

  /**
   * Get Git status
   */
  async status(): Promise<{
    success: boolean
    status?: string
    error?: string
  }> {
    const result = await this.cli.exec("git status --porcelain")

    if (result.success) {
      return { success: true, status: result.output }
    } else {
      return { success: false, error: result.error }
    }
  }

  /**
   * Get diff for a file or all changes
   */
  async diff(
    path?: string,
  ): Promise<{ success: boolean; diff?: string; error?: string }> {
    const command = path ? `git diff ${path}` : "git diff"
    const result = await this.cli.exec(command)

    if (result.success) {
      return { success: true, diff: result.output }
    } else {
      return { success: false, error: result.error }
    }
  }
}
