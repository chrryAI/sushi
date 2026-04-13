import type { aiAgent, guest, nil, sushi, user } from "@chrryai/chrry/types"

// Return type for getModelProvider - provider is intentionally typed as unknown
// to avoid exposing internal SDK types that have private/protected members
export type ModelProviderResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any
  embedding?: any
  modelId: string
  agentName: string
  lastKey: string
  supportsTools: boolean
  canAnalyze: boolean
  isBYOK: boolean
  isBELES?: boolean
  isFree?: boolean
}

import { isE2E } from "@chrryai/chrry/utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

// import type { LanguageModel } from "ai"

const plusTiers = ["plus", "pro"]

function isFreeTier(app: { tier: string | nil } | nil) {
  if (isE2E) return true
  return !plusTiers.includes(app?.tier || "")
}

function safeDecrypt(decrypt: (val: string) => string, key: string | nil) {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    return undefined
  }
}

function byokDecrypt(decrypt: (val: string) => string, key: string | nil) {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    if (isE2E) return undefined
    throw new Error(
      "Your API key could not be decrypted. Please re-enter it in Settings.",
    )
  }
}

export const modelCapabilities: Record<
  string,
  { tools: boolean; canAnalyze?: boolean }
> = {
  "gpt-4o": { tools: true, canAnalyze: true },
  "gpt-4o-mini": { tools: true, canAnalyze: true },
  "anthropic/claude-sonnet-4-6": { tools: true, canAnalyze: true },
  "google/gemini-3.1-pro-preview": { tools: true, canAnalyze: true },
  "deepseek/deepseek-chat": { tools: true },
  "deepseek/deepseek-v3.2-thinking": { tools: true },
  "deepseek/deepseek-v3.2-speciale": { tools: false },
  "minimax/minimax-m2.5": { tools: true },
  "minimax/minimax-m2.7": { tools: true },
  "deepseek/deepseek-v3.2": { tools: true },
  "x-ai/grok-4.1-fast": { tools: true, canAnalyze: true },
  "perplexity/sonar-pro": { tools: false },
  "openrouter/free": { tools: false, canAnalyze: false },
  "openai/gpt-oss-120b:free": { tools: false, canAnalyze: true },
}

const AGENT_DEFAULTS: Record<string, string> = {
  beles: "deepseek/deepseek-v3.2",
  sushi: "deepseek/deepseek-chat",
  deepSeek: "deepseek/deepseek-chat",
  peach: "deepseek/deepseek-chat",
  claude: "anthropic/claude-sonnet-4-6",
  chatGPT: "openai/gpt-5.4",
  free: "openrouter/free",
  gemini: "google/gemini-3.1-pro-preview",
  grok: "x-ai/grok-4.1-fast",
  perplexity: "perplexity/sonar-pro",
}
const SOURCES: Record<string, string> = {
  // Free tier models (beles pool)
  m2m: "minimax/minimax-m2.7",
  // coder: "qwen/qwen3-coder-plus",
  // coder: "deepseek/deepseek-v3.2",
  coder: "deepseek/deepseek-v3.2",
  "ai/content": "deepseek/deepseek-v3.2",
  "pear/validate": "deepseek/deepseek-v3.2",
  "rag/documentSummary": "deepseek/deepseek-v3.2",
  "autonomous/bidding": "minimax/minimax-m2.7",
  "graph/cypher": "deepseek/deepseek-v3.2",
  "graph/entity": "deepseek/deepseek-v3.2",
  "graph/extract": "deepseek/deepseek-v3.2",
  "moltbook/engagement": "deepseek/deepseek-v3.2",
  "moltbook/commentFilter": "deepseek/deepseek-v3.2",
  "moltbook/comment": "deepseek/deepseek-v3.2",
  "ai/tribe/comment": "deepseek/deepseek-v3.2",
  "ai/title": "deepseek/deepseek-v3.2",
  "ai/thread/instructions": "deepseek/deepseek-v3.2",
  swarm: "minimax/minimax-m2.7",
  // Premium sources
  "ai/sushi/file": "x-ai/grok-4.1-fast",
  "ai/sushi/webSearch": "perplexity/sonar-pro",
  post: "minimax/minimax-m2.7",
  engagement: "deepseek/deepseek-v3.2",
  comment: "deepseek/deepseek-v3.2",
  tribe_comment: "deepseek/deepseek-v3.2", // Tribe comment checking
  tribe_engage: "deepseek/deepseek-v3.2", // Tribe engagement
  autonomous: "minimax/minimax-m2.7",
}

const JOB = {
  post: "minimax/minimax-m2.7",
  tribe_comment: "deepseek/deepseek-v3.2", // Tribe comment checking
  tribe_engage: "deepseek/deepseek-v3.2", // Tribe engagement
  autonomous: "minimax/minimax-m2.7",
}

const SCHEDULE: Record<string, string> = {
  // Free tier models (beles pool)
  swarm: "minimax/minimax-m2.7",
  // Premium sources
  "ai/sushi/file": "anthropic/claude-sonnet-4-6",
  "ai/sushi/webSearch": "perplexity/sonar-pro",
  post: "minimax/minimax-m2.7",
  engagement: "deepseek/deepseek-v3.2",
  comment: "deepseek/deepseek-v3.2",
  tribe_comment: "deepseek/deepseek-v3.2", // Tribe comment checking
  tribe_engage: "deepseek/deepseek-v3.2", // Tribe engagement
  autonomous: "minimax/minimax-m2.7",
}

// Type for job parameter - accepts any object with metadata.modelId or modelConfig.model
export type JobWithModelConfig = {
  metadata?: { modelId?: string } | null
  modelConfig?: { model?: string } | null
}

// TODO: Fix VercelAIAdapter implementation
// import { generateText, streamText } from 'ai'
// import type { AIAdapter } from '../types'

// export class VercelAIAdapter implements AIAdapter {
//   async chat(options: ChatOptions) {
//     const result = await generateText({
//       model: options.model,
//       messages: options.messages,
//       tools: options.tools,
//     })
//     return { text: result.text, usage: result.usage }
//   }
//
//   async* stream(options: StreamOptions) {
//     const result = streamText({...})
//     for await (const chunk of result.fullStream) {
//       yield chunk
//     }
//   }
// }

export const getMediaAPIKeys = ({
  app,
  user,
  guest,
  byokDecrypt,
  safeDecrypt,
}: {
  app?: sushi | null
  user?: user | null
  guest?: guest | null
  safeDecrypt: (val?: string) => string
  byokDecrypt: (val: string) => string
}) => {
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const isBYOK = !!accountKey
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const appKey = safeDecrypt(app?.apiKeys?.openrouter)
  const or = byokKey ?? appKey ?? systemKey
  // const isBYOK = !!options.user?.apiKeys?.openrouter

  const systemReplicateKey = isFreeTier(app)
    ? process.env.REPLICATE_API_KEY
    : undefined
  const appReplicateKey = safeDecrypt(app?.apiKeys?.replicate)
  const replicate = byokKey ?? appReplicateKey ?? systemReplicateKey

  const systemFalKey = isFreeTier(app) ? process.env.FAL_API_KEY : undefined
  const appFalKey = safeDecrypt(app?.apiKeys?.fal)
  const fal = byokKey ?? appFalKey ?? systemFalKey

  return { fal, or: "", replicate }
}

export async function getModelProvider({
  app,
  swarm,
  user,
  guest,
  agent,
  job,
  source,
  decrypt,
  ...rest
}: {
  app?: sushi | nil
  source?: string | nil
  name?: string | nil
  modelId?: string | nil
  canReason?: boolean | nil
  job?: JobWithModelConfig | nil
  user?: user | nil
  guest?: guest | nil
  agent: aiAgent
  decrypt: (val: string) => string
  swarm?: { modelId?: string; postType?: string } | nil
}): Promise<ModelProviderResult> {
  const name =
    agent?.name ??
    (source
      ? SOURCES[source]
        ? source
        : (rest.name ?? "sushi")
      : (rest.name ?? "free"))
  const resolvedName = name

  const modelId =
    swarm?.modelId ??
    job?.metadata?.modelId ??
    job?.modelConfig?.model ??
    SOURCES[swarm?.postType || ""] ??
    rest.modelId ??
    SOURCES[source || ""] ??
    (resolvedName === "sushi"
      ? !job
        ? "deepseek/deepseek-r1"
        : "deepseek/deepseek-v3.2"
      : (AGENT_DEFAULTS[resolvedName || ""] ?? "deepseek/deepseek-v3.2"))

  // Resolve OR key: BYOK > app key > system env (free tier only)
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const isBYOK = !!accountKey
  const byokKey = accountKey ? byokDecrypt(decrypt, accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const appKey = safeDecrypt(decrypt, app?.apiKeys?.openrouter)
  const orKey = byokKey ?? appKey ?? systemKey

  // Check credits
  const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1

  // const failedKeys = (isBYOK ? [] : agent?.metadata?.failed) as
  //   | string[]
  //   | undefined

  const fallback = () => ({
    provider: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! })(
      "openrouter/free",
    ),
    modelId: "openrouter/free",
    agentName: agent.name,
    lastKey: "openrouter",
    isFree: true,
    supportsTools: false,
    canAnalyze: false,
    isBYOK: !!byokKey,
  })

  if ((isBYOK && !byokKey) || creditsLeft === 0 || !orKey) {
    return fallback()
  }

  const models = [modelId, ...["minimax/minimax-m2.5"]]

  const embeddingModel = "openai/text-embedding-3-small"

  return {
    provider: createOpenRouter({ apiKey: orKey })(modelId, {
      models,
    }),
    embedding: {
      provider: createOpenRouter({ apiKey: orKey }),
      modelId: embeddingModel,
      supportsTools: modelCapabilities[embeddingModel]?.tools ?? false,
      canAnalyze: modelCapabilities[embeddingModel]?.canAnalyze ?? false,
      isBYOK: !!byokKey,
      isBELES: resolvedName === "beles",
    },
    modelId,
    agentName: agent.name,
    lastKey: "openrouter",
    supportsTools: modelCapabilities[modelId]?.tools ?? false,
    canAnalyze: modelCapabilities[modelId]?.canAnalyze ?? false,
    isBYOK: !!byokKey,
    isBELES: resolvedName === "beles",
  }
}
