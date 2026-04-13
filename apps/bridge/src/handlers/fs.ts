/**
 * File System Handlers
 * Provides secure file system access scoped to project directory
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises"
import { join, relative, resolve } from "node:path"

export class FileSystemHandler {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot)
    console.error(`[FS] Project root: ${this.projectRoot}`)
  }

  /**
   * Validate that path is within project root (security)
   */
  private validatePath(path: string): string {
    const absolutePath = resolve(this.projectRoot, path)
    const relativePath = relative(this.projectRoot, absolutePath)

    if (
      relativePath.startsWith("..") ||
      resolve(absolutePath) !== absolutePath
    ) {
      throw new Error(`Access denied: ${path} is outside project root`)
    }

    return absolutePath
  }

  /**
   * Read file content
   */
  async read(
    path: string,
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const absolutePath = this.validatePath(path)
      const content = await readFile(absolutePath, "utf-8")

      return { success: true, content }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Write file content
   */
  async write(
    path: string,
    content: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const absolutePath = this.validatePath(path)
      await writeFile(absolutePath, content, "utf-8")

      return { success: true, message: "File written successfully" }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * List directory contents
   */
  async ls(path: string): Promise<{
    success: boolean
    items?: Array<{ name: string; type: "file" | "dir" }>
    error?: string
  }> {
    try {
      const absolutePath = this.validatePath(path)
      const entries = await readdir(absolutePath)

      const items = await Promise.all(
        entries.map(async (name) => {
          const itemPath = join(absolutePath, name)
          const stats = await stat(itemPath)

          return {
            name,
            type: stats.isDirectory() ? ("dir" as const) : ("file" as const),
          }
        }),
      )

      return { success: true, items }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
