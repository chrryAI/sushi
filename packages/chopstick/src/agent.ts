/**
 * Agent definition parsed from Modelfile AGENT directive
 */
export interface AgentDefinition {
  name: string // @vex, @chrry, @grape
  system: string
  tools: string[] // mcp:filesystem, mcp:git, etc.
  model?: string // optional model override
}

/**
 * ParsedModelfile with AGENT support
 */
export interface ModelfileWithAgents {
  name: string
  version: string
  description: string
  model: string
  system: string
  parameters: Record<string, string | number | boolean>
  tools: string[] // global tools (all agents inherit)
  agents: AgentDefinition[] // named agents with own system + tools
  memory?: string
  dna?: string
  autonomy: "manual" | "semi" | "full"
}
