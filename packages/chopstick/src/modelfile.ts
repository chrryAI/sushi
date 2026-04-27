/**
 * Modelfile Parser — Ollama-compatible app definition format
 * Supports: FROM, SYSTEM, PARAMETER, TOOLS, TEMPLATE, MEMORY, DNA, AGENT
 *
 * Example Modelfile (single-app with @mention agents):
 * --------------------
 * NAME chrry/sushi
 * VERSION 1.0.0
 * DESCRIPTION AI assistant with @mention routing
 *
 * FROM anthropic/claude-sonnet-4-20250514
 *
 * SYSTEM """
 * You are Sushi — an AI assistant with @mention routing.
 * Mention agents: @vex (code), @chrry (docs), @grape (data).
 * Focus on YOUR role when mentioned.
 * """
 *
 * AGENT @vex
 * SYSTEM """
 * You are @vex, the code expert.
 * You analyze code, find bugs, suggest improvements.
 * Always check for security issues.
 * """
 * TOOLS mcp:filesystem
 * TOOLS mcp:git
 *
 * AGENT @chrry
 * SYSTEM """
 * You are @chrry, the documentation expert.
 * You generate docs, invoices, and written content.
 * Be clear and professional.
 * """
 * TOOLS mcp:docs
 * TOOLS mcp:pdf
 *
 * AGENT @grape
 * SYSTEM """
 * You are @grape, the data analyst.
 * You analyze data, generate reports, create charts.
 * Be precise with numbers.
 * """
 * TOOLS mcp:analysis
 *
 * PARAMETER temperature 0.7
 * PARAMETER max_tokens 2048
 *
 * AUTONOMY semi
 * --------------------
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { AgentDefinition } from "./agent.js"

export interface ParsedModelfile {
  name: string
  version: string
  description: string
  model: string
  system: string
  template?: string
  parameters: Record<string, string | number | boolean>
  tools: string[]
  agents: AgentDefinition[]
  memory?: string
  dna?: string
  autonomy: "manual" | "semi" | "full"
}

export interface ModelfileOptions {
  cwd?: string
  modelId?: string
}

/**
 * Parse a Modelfile string into a structured object.
 *
 * AGENT block support:
 *   AGENT @vex
 *   SYSTEM """       ← opens a block (blockDirective = "SYSTEM")
 *   ...             ← block content lines
 *   """              ← closes block, flush() is called
 *   TOOLS mcp:fs     ← still inside @vex agent (agentTarget = vex)
 *   TOOLS mcp:git    ← still inside @vex agent
 *
 * Key insight: We track which agent we're "targeting" so that
 * directives inside an AGENT block route to the agent, not global result.
 */
export function parseModelfile(content: string): ParsedModelfile {
  const lines = content.split("\n")
  const result: ParsedModelfile = {
    name: "",
    version: "1.0.0",
    description: "",
    model: "",
    system: "",
    parameters: {},
    tools: [],
    agents: [],
    autonomy: "semi",
  }

  // The active agent we're building (null = global level)
  let agentTarget: AgentDefinition | null = null

  // The currently active directive at file level (e.g. "NAME", "FROM")
  // Reset to null when we're inside an AGENT block
  let currentDirective: string | null = null

  // The directive whose content we're currently building ("SYSTEM", "TEMPLATE")
  // Non-null means we're inside a triple-quote block at the file level
  let blockDirective: string | null = null

  // Accumulated raw content for the current directive
  let currentValue: string[] = []

  const flush = () => {
    if (!currentDirective) return
    const raw = currentValue.join("\n")
    const value = raw
      .replace(/^"""(?:\n)?/, "")
      .replace(/(?:^|\n)"""$/, "")
      .trim()

    switch (currentDirective.toUpperCase()) {
      case "NAME":
        result.name = value
        break
      case "VERSION":
        result.version = value
        break
      case "DESCRIPTION":
        result.description = value
        break
      case "FROM":
        result.model = value
        break
      case "SYSTEM":
        if (agentTarget) {
          agentTarget.system = value
        } else {
          result.system = value
        }
        break
      case "TEMPLATE":
        result.template = value
        break
      case "PARAMETER": {
        const paramLines = value.split("\n").filter(Boolean)
        for (const line of paramLines) {
          const match = line.match(/^(\w+)\s+(.+)$/)
          if (match) {
            const [, key, val] = match
            if (val === "true") result.parameters[key] = true
            else if (val === "false") result.parameters[key] = false
            else if (!Number.isNaN(Number(val)))
              result.parameters[key] = Number(val)
            else result.parameters[key] = val
          }
        }
        break
      }
      case "TOOLS": {
        const toolLines = value
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
        if (agentTarget) {
          agentTarget.tools.push(...toolLines)
        } else {
          result.tools.push(...toolLines)
        }
        break
      }
      case "MEMORY":
        if (agentTarget) {
          // Agent-level memory not yet supported
        } else {
          result.memory = value
        }
        break
      case "DNA":
        if (!agentTarget) result.dna = value
        break
      case "AUTONOMY":
        if (["manual", "semi", "full"].includes(value)) {
          result.autonomy = value as "manual" | "semi" | "full"
        }
        break
    }

    currentDirective = null
    blockDirective = null
    currentValue = []
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines and full-line comments
    if (!trimmed || trimmed.startsWith("#")) {
      i++
      continue
    }

    // Standalone """ = file-level block closer
    if (trimmed === '"""') {
      flush()
      i++
      continue
    }

    // Triple-quote opener: e.g. SYSTEM """ — opens a content block
    const openerMatch = trimmed.match(/^(\w+)\s+"""$/)
    if (openerMatch) {
      // Flush any pending non-block directive before opening a new block
      if (currentDirective && !blockDirective) flush()
      currentDirective = openerMatch[1]
      blockDirective = openerMatch[1]
      currentValue = []
      i++
      continue
    }

    // AGENT @name — start a new agent block
    const agentMatch = trimmed.match(/^AGENT\s+@(.+)$/i)
    if (agentMatch) {
      // Flush any pending directive (at file level or agent level)
      if (currentDirective) flush()
      // Push previous agent to result
      if (agentTarget) {
        result.agents.push(agentTarget)
      }
      // Start new agent
      agentTarget = {
        name: agentMatch[1],
        system: "",
        tools: [],
      }
      // At agent level — reset so next line is treated as fresh directive
      currentDirective = null
      blockDirective = null
      currentValue = []
      i++
      continue
    }

    // Normal directive line: "DIRECTIVE value"
    const dm = trimmed.match(/^(\w+)\s+(.+)$/)
    if (dm) {
      const directiveName = dm[1]
      const directiveValue = dm[2]

      if (blockDirective) {
        // We're inside a triple-quote block — content line, not a directive
        currentValue.push(trimmed)
      } else if (currentDirective === directiveName) {
        // Same directive again — accumulate or extend
        if (agentTarget && directiveName === "TOOLS") {
          // Agent-level TOOLS: add each tool directly to agent
          agentTarget.tools.push(directiveValue)
        } else if (!agentTarget) {
          // File-level same directive: accumulate
          currentValue.push(directiveValue)
        }
      } else {
        // New or different directive
        if (currentDirective) {
          if (currentValue.length > 0) flush()
        }
        currentDirective = directiveName
        if (currentValue.length === 0) currentValue = [directiveValue]
        // Self-contained triple-quote on one line
        if (
          directiveValue.endsWith('"""') &&
          directiveValue.startsWith('"""')
        ) {
          flush()
        }
      }
      i++
      continue
    }

    // Continuation line — accumulated into current directive's value
    if (currentDirective) {
      currentValue.push(trimmed)
    }
    i++
  }

  // Final flush + push last agent
  if (agentTarget) {
    result.agents.push(agentTarget)
  }
  flush()

  return result
}

/**
 * Load and parse a Modelfile from disk
 */
export function loadModelfile(path: string, cwd?: string): ParsedModelfile {
  const fullPath = cwd ? resolve(cwd, path) : path
  const content = readFileSync(fullPath, "utf-8")
  return parseModelfile(content)
}

/**
 * Resolve template variables
 */
export function resolveTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const k = key.trim().startsWith(".") ? key.trim().slice(1) : key.trim()
    if (k.startsWith("Param.")) {
      return vars[k.slice(6)] ?? ""
    }
    return vars[k] ?? match
  })
}

/**
 * Build messages for the main sushi agent (no @mention routing)
 */
export function buildMessages(
  modelfile: ParsedModelfile,
  conversation: Array<{ role: string; content: string }>,
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []

  if (!modelfile.template && modelfile.system) {
    messages.push({ role: "system", content: modelfile.system })
  }

  if (modelfile.template && conversation.length > 0) {
    for (let i = 0; i < conversation.length; i++) {
      if (i === 0) {
        messages.push({
          role: "user",
          content: resolveTemplate(modelfile.template, {
            System: modelfile.system,
            Prompt: conversation[i].content,
            Input: conversation[i].content,
          }),
        })
      } else {
        messages.push(conversation[i])
      }
    }
  } else {
    messages.push(...conversation)
  }

  return messages
}

/**
 * Build messages for a specific agent
 */
export function buildAgentMessages(
  agent: AgentDefinition,
  baseSystem: string,
  allAgents: AgentDefinition[],
  userMessage: string,
  conversation: Array<{ role: string; content: string }> = [],
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []
  const agentNames = allAgents.map((a) => `@${a.name}`).join(", ")

  const systemContent = `You are @${agent.name}.

${agent.system}

Available agents: ${agentNames}
- Only respond to requests within your expertise.
- If another agent is mentioned, acknowledge it briefly but stay focused on your role.

Context from conversation:
${userMessage}
`.trim()

  messages.push({ role: "system", content: systemContent })

  if (conversation.length > 0) {
    messages.push(...conversation)
  }

  return messages
}

/**
 * Extract tool reference parts
 */
export function parseToolReference(tool: string): {
  type: "mcp" | "function"
  server?: string
  tool?: string
} {
  if (tool.startsWith("mcp:")) {
    const parts = tool.slice(4).split("/")
    return { type: "mcp", server: parts[0], tool: parts[1] }
  }
  return { type: "function", tool }
}

/**
 * Validate modelfile
 */
export function validateModelfile(modelfile: ParsedModelfile): string[] {
  const errors: string[] = []
  if (!modelfile.name) errors.push("Missing NAME directive")
  if (!modelfile.model) errors.push("Missing FROM directive")
  return errors
}

/**
 * Format modelfile back to string
 */
export function stringifyModelfile(modelfile: ParsedModelfile): string {
  const lines: string[] = []

  if (modelfile.name) lines.push(`NAME ${modelfile.name}`)
  if (modelfile.version) lines.push(`VERSION ${modelfile.version}`)
  if (modelfile.description) lines.push(`DESCRIPTION ${modelfile.description}`)
  if (modelfile.model) lines.push(`FROM ${modelfile.model}`)

  if (modelfile.system) {
    lines.push(`SYSTEM """`)
    lines.push(modelfile.system)
    lines.push(`"""`)
  }

  if (modelfile.template) {
    lines.push(`TEMPLATE """`)
    lines.push(modelfile.template)
    lines.push(`"""`)
  }

  if (modelfile.agents.length > 0) {
    for (const agent of modelfile.agents) {
      lines.push("")
      lines.push(`AGENT @${agent.name}`)
      lines.push(`SYSTEM """`)
      lines.push(agent.system)
      lines.push(`"""`)
      for (const tool of agent.tools) {
        lines.push(`TOOLS ${tool}`)
      }
    }
  }

  if (modelfile.dna) lines.push(`DNA ${modelfile.dna}`)
  if (modelfile.memory) lines.push(`MEMORY ${modelfile.memory}`)

  for (const [key, value] of Object.entries(modelfile.parameters)) {
    lines.push(`PARAMETER ${key} ${value}`)
  }

  for (const tool of modelfile.tools) {
    lines.push(`TOOLS ${tool}`)
  }

  lines.push(`AUTONOMY ${modelfile.autonomy}`)

  return `${lines.join("\n")}\n`
}
