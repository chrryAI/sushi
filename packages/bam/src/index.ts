/**
 * @chrryai/bam - Bug Analysis & Memory
 * Standalone package for bug detection and analysis
 */

import { FalkorDB } from "falkordb"

export interface BAMConfig {
  host?: string
  port?: number
  graphName?: string
}

export interface Bug {
  type:
    | "TYPE_MISMATCH"
    | "HARDCODED_PATH"
    | "UNUSED_IMPORT"
    | "MISSING_ERROR_HANDLING"
    | "LOGIC_ERROR"
  severity: "LOW" | "MEDIUM" | "HIGH"
  file: string
  line: number
  message: string
  suggestion?: string
}

export class BAM {
  private db: any = null
  private graph: any = null
  private config: Required<BAMConfig>

  constructor(config: BAMConfig = {}) {
    this.config = {
      host: config.host || "localhost",
      port: config.port || 6380,
      graphName: config.graphName || "bugs",
    }
  }

  async connect(): Promise<void> {
    if (this.graph) return

    this.db = await FalkorDB.connect({
      socket: { host: this.config.host, port: this.config.port },
    })
    this.graph = this.db.selectGraph(this.config.graphName)
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.graph = null
    }
  }

  async logBug(bug: Bug): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      CREATE (b:Bug {
        type: $type,
        severity: $severity,
        file: $file,
        line: $line,
        message: $message,
        suggestion: $suggestion,
        timestamp: $timestamp
      })
    `,
      {
        params: {
          type: bug.type,
          severity: bug.severity,
          file: bug.file,
          line: bug.line,
          message: bug.message,
          suggestion: bug.suggestion || "",
          timestamp: Date.now(),
        },
      },
    )
  }

  async analyzeBugPatterns(): Promise<
    Array<{ type: string; count: number; avgLine: number }>
  > {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(`
      MATCH (b:Bug)
      RETURN b.type as type, COUNT(b) as count, AVG(b.line) as avgLine
      ORDER BY count DESC
    `)

    if (!result || !result.data) return []

    return result.data.map((row: any) => ({
      type: row.type || "UNKNOWN",
      count: row.count || 0,
      avgLine: Math.round(row.avgLine || 0),
    }))
  }

  async scanFile(filePath: string, content: string): Promise<Bug[]> {
    const bugs: Bug[] = []
    const lines = content.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Check for unused imports
      if (line.includes("import") && line.includes("from")) {
        // Use non-greedy match with length limit to prevent ReDoS
        const importMatch = line.match(/import\s+\{([^}]{1,500}?)\}\s+from/)
        if (importMatch) {
          const imports = importMatch[1].split(",").map((s) => s.trim())
          for (const imp of imports) {
            // Use word boundaries to avoid matching substrings
            const regex = new RegExp(
              `\\b${imp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
              "g",
            )
            const matches = content.match(regex)
            const usageCount = matches ? matches.length : 0
            if (usageCount === 1) {
              bugs.push({
                type: "UNUSED_IMPORT",
                severity: "LOW",
                file: filePath,
                line: lineNum,
                message: `Unused import: ${imp}`,
                suggestion: `Remove unused import: ${imp}`,
              })
            }
          }
        }
      }

      // Check for missing error handling in async functions
      if (line.includes("async function") || line.includes("async (")) {
        let hasErrorHandling = false
        for (let j = i; j < Math.min(i + 50, lines.length); j++) {
          if (lines[j].includes("try") || lines[j].includes("catch")) {
            hasErrorHandling = true
            break
          }
        }
        if (!hasErrorHandling) {
          bugs.push({
            type: "MISSING_ERROR_HANDLING",
            severity: "MEDIUM",
            file: filePath,
            line: lineNum,
            message: "Async function without error handling",
            suggestion: "Add try-catch block",
          })
        }
      }

      // Check for hardcoded paths
      if (line.includes("/Users/") || line.includes("C:\\")) {
        bugs.push({
          type: "HARDCODED_PATH",
          severity: "MEDIUM",
          file: filePath,
          line: lineNum,
          message: "Hardcoded absolute path detected",
          suggestion: "Use relative paths or environment variables",
        })
      }
    }

    return bugs
  }

  async scanDirectory(dirPath: string): Promise<Bug[]> {
    const fs = await import("node:fs")
    const path = await import("node:path")
    const bugs: Bug[] = []

    const scanDir = async (dir: string): Promise<void> => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            await scanDir(fullPath)
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".js") || entry.name.endsWith(".ts"))
        ) {
          const content = fs.readFileSync(fullPath, "utf-8")
          const fileBugs = await this.scanFile(fullPath, content)
          bugs.push(...fileBugs)

          // Log to FalkorDB
          for (const bug of fileBugs) {
            await this.logBug(bug)
          }
        }
      }
    }

    await scanDir(dirPath)
    return bugs
  }

  async getBugStats(): Promise<{
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  }> {
    if (!this.graph) await this.connect()

    // Get total count
    const totalResult = await this.graph.query(`
      MATCH (b:Bug)
      RETURN COUNT(b) as total
    `)

    // Get counts by type
    const typeResult = await this.graph.query(`
      MATCH (b:Bug)
      RETURN b.type as type, COUNT(b) as count
    `)

    // Get counts by severity
    const severityResult = await this.graph.query(`
      MATCH (b:Bug)
      RETURN b.severity as severity, COUNT(b) as count
    `)

    const stats = {
      total: totalResult?.data?.[0]?.total || 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    }

    if (typeResult?.data) {
      for (const row of typeResult.data) {
        stats.byType[row.type] = row.count
      }
    }

    if (severityResult?.data) {
      for (const row of severityResult.data) {
        stats.bySeverity[row.severity] = row.count
      }
    }

    return stats
  }
}

export default BAM
