/**
 * @mention Parser — Extract agent mentions from user messages
 *
 * Handles: @vex @chrry @grape @agent-name
 * Strips punctuation: "@vex,", "@chrry!", "@grape."
 */

import type { AgentDefinition } from "./agent.js"

export interface ParsedMentions {
  /** Agent names mentioned (without @) */
  agents: string[]
  /** The message with @mentions removed */
  cleanMessage: string
}

/**
 * Parse @mentions from a message string.
 *
 * @example
 * parseMentions("@vex帮我查账 @chrry生成发票")
 * // → { agents: ["vex", "chrry"], cleanMessage: "帮我查账 生成发票" }
 */
export function parseMentions(message: string): ParsedMentions {
  // Match @word boundaries (allow dots for @agent.subagent style)
  const mentionRegex = /@([a-zA-Z_][a-zA-Z0-9_.]*)/g
  const agents: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(message)) !== null) {
    const name = match[1]
    if (!agents.includes(name)) {
      agents.push(name)
    }
  }

  // Remove mentions from message
  const cleanMessage = message
    .replace(mentionRegex, "")
    .replace(/\s+/g, " ")
    .trim()

  return { agents, cleanMessage }
}

/**
 * Resolve agent names to their full definitions from the Modelfile agents list.
 */
export function resolveAgents(
  mentioned: string[],
  agents: AgentDefinition[],
): AgentDefinition[] {
  return agents.filter((a) => mentioned.includes(a.name))
}

/**
 * Split a message into segments per agent.
 * Each segment contains only the mentions relevant to that agent.
 *
 * @example
 * splitByAgent("@vex帮我查账 @chrry生成发票", ["vex", "chrry"])
 * // → { vex: "帮我查账", chrry: "生成发票" }
 */
export function splitByAgent(
  message: string,
  mentioned: string[],
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const agent of mentioned) {
    // Find all @agent mentions and their positions
    const regex = new RegExp(`@${agent}\\b[^@]*`, "g")
    const matches = message.match(regex)
    if (matches) {
      // Strip the @agent prefix from each match and join
      const parts = matches.map((m) =>
        m.replace(new RegExp(`@${agent}\\b`), "").trim(),
      )
      result[agent] = parts.join(" ").trim()
    }
  }

  return result
}

/**
 * Build system prompt for a specific agent.
 * Includes:
 * - Agent's own system prompt
 * - Global system (base system)
 * - Instructions about @mention routing
 */
export function buildAgentSystemPrompt(
  agent: AgentDefinition,
  baseSystem: string,
  allAgents: AgentDefinition[],
  userMessage: string,
): string {
  const agentNames = allAgents.map((a) => `@${a.name}`).join(", ")

  return `You are @${agent.name}.

Your role: ${agent.system}

Other available agents: ${agentNames}
- If the user mentions another agent, acknowledge you see their request but focus on YOUR role.
- Only respond to requests within your expertise.

Base context from the user:
${userMessage}
`.trim()
}

/**
 * Main entry point: route a user message to the right agents.
 *
 * 1. Parse @mentions
 * 2. Filter agent definitions
 * 3. Return routing plan for parallel execution
 */
export interface RoutingPlan {
  /** All agents mentioned */
  agents: AgentDefinition[]
  /** Message with mentions stripped */
  cleanMessage: string
  /** Message split per agent */
  segments: Record<string, string>
  /** Model to use */
  model: string
  /** Global tools (for all agents) */
  globalTools: string[]
}

export function routeMessage(
  message: string,
  modelfile: {
    model: string
    system: string
    agents: AgentDefinition[]
    tools: string[]
  },
): RoutingPlan | { error: string } {
  const { agents: mentioned, cleanMessage } = parseMentions(message)

  if (mentioned.length === 0) {
    return {
      error:
        "No @mentions found in message. Mention an agent: @vex, @chrry, etc.",
    }
  }

  const resolved = resolveAgents(mentioned, modelfile.agents)
  const unresolved = mentioned.filter(
    (m) => !resolved.some((r) => r.name === m),
  )

  if (unresolved.length > 0) {
    return {
      error: `Unknown agent(s): ${unresolved.map((u) => `@${u}`).join(", ")}`,
    }
  }

  return {
    agents: resolved,
    cleanMessage,
    segments: splitByAgent(message, mentioned),
    model: modelfile.model,
    globalTools: modelfile.tools,
  }
}
