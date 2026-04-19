export const modelCapabilities: Record<
  string,
  { tools: boolean; canAnalyze?: boolean }
> = {
  "gpt-4o": { tools: true, canAnalyze: true },
  "gpt-4o-mini": { tools: true, canAnalyze: true },
  "openai/gpt-5.4": { tools: true, canAnalyze: true },
  "anthropic/claude-sonnet-4-6": { tools: true, canAnalyze: true },
  "anthropic/claude-sonnet-4-5": { tools: true, canAnalyze: true },
  "google/gemini-3.1-pro-preview": { tools: true, canAnalyze: true },
  "deepseek/deepseek-chat": { tools: true },
  "deepseek/deepseek-r1": { tools: false },
  "deepseek/deepseek-v3.2": { tools: true },
  "deepseek/deepseek-v3.2-thinking": { tools: true },
  "minimax/minimax-m2.5": { tools: true },
  "minimax/minimax-m2.7": { tools: true },
  "x-ai/grok-4-1-fast-reasoning": { tools: true, canAnalyze: true },
  "grok-4-1-fast-reasoning": { tools: true, canAnalyze: true },
  "perplexity/sonar-pro": { tools: false },
  "openai/gpt-oss-120b:free": { tools: false, canAnalyze: true },
} as const

export const AGENT_DEFAULTS: Record<string, string> = {
  beles: "deepseek/deepseek-v3.2",
  sushi: "deepseek/deepseek-chat",
  deepSeek: "deepseek/deepseek-chat",
  peach: "deepseek/deepseek-chat",
  claude: "anthropic/claude-sonnet-4-6",
  chatGPT: "openai/gpt-5.4",
  gemini: "google/gemini-3.1-pro-preview",
  grok: "x-ai/grok-4-1-fast-reasoning",
  perplexity: "perplexity/sonar-pro",
} as const

export const SOURCES: Record<string, string> = {
  m2m: "minimax/minimax-m2.7",
  coder: "deepseek/deepseek-v3.2",
  "ai/content": "deepseek/deepseek-v3.2",
  "pear/validate": "deepseek/deepseek-v3.2",
  "rag/documentSummary": "deepseek/deepseek-v3.2",
  "autonomous/bidding": "minimax/minimax-m2.7",
  "graph/cypher": "deepseek/deepseek-v3.2",
  "graph/entity": "deepseek/deepseek-v3.2",
  "graph/extract": "deepseek/deepseek-v3.2",
  "ai/tribe/comment": "deepseek/deepseek-v3.2",
  "ai/title": "deepseek/deepseek-v3.2",
  "ai/sushi/file": "anthropic/claude-sonnet-4-6",
  "ai/sushi/webSearch": "perplexity/sonar-pro",
  swarm: "minimax/minimax-m2.7",
  post: "minimax/minimax-m2.7",
  engagement: "deepseek/deepseek-v3.2",
  comment: "deepseek/deepseek-v3.2",
  autonomous: "minimax/minimax-m2.7",
} as const

export type JobWithModelConfig = {
  metadata?: { modelId?: string } | null
  modelConfig?: { model?: string } | null
}
