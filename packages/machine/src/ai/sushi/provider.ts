// ─────────────────────────────────────────────────────────────────
// sushi/provider.ts — Model routing + provider resolution
//
// All model-selection logic lives here. vault/index.ts is now just
// a data/types layer (prizes, limits, capabilities, API key helpers).
// ─────────────────────────────────────────────────────────────────

import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"
import type {
  aiAgent,
  guest,
  nil,
  sushi as sushiType,
  user,
} from "@chrryai/donut/types"
import { isE2E } from "@chrryai/donut/utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { decrypt, getAiAgents, isDevelopment } from "../../../index"
import {
  type JobWithModelConfig,
  type ModelProviderResult,
  modelCapabilities,
  type routeTier,
} from "../vault"

export const OLLAMA_MODEL_MAP: Record<string, string> = {
  "deepseek/deepseek-v3.2": "deepseek-v3.2:cloud",
  "deepseek/deepseek-r1": "kimi-k2.5:cloud",
  "deepseek/deepseek-chat": "deepseek-v3.2:cloud",
  "deepseek-chat": "deepseek-v3.2:cloud",
  "minimax/minimax-m2.7": "kimi-k2.5:cloud",
  "minimax/minimax-m2.5": "kimi-k2.5:cloud",
  "nvidia/nemotron-3-super-120b-a12b": "nemotron-3-super:cloud",
  "google/gemini-3.1-pro-preview": "gemini-3-flash-preview:cloud",
  "x-ai/grok-4.1-fast": "kimi-k2.5:cloud",
}

export function toOllamaModel(orModelId: string): string | undefined {
  return OLLAMA_MODEL_MAP[orModelId.replace(":free", "")]
}

export function createOllamaClient() {
  return createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || "https://ollama.com/v1",
    apiKey: process.env.OLLAMA_API_KEY || "ollama",
  }) as any
}

// ─────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────

function safeDecrypt(key: string | nil) {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    return undefined
  }
}

function byokDecrypt(key: string | nil) {
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

const plusTiers = ["plus", "pro"]
function isFreeTier(app: { tier: string | nil } | nil) {
  if (isE2E) return true
  return !plusTiers.includes(app?.tier || "")
}

// ─────────────────────────────────────────────────────────────────
// Agent defaults
// ─────────────────────────────────────────────────────────────────

const AGENT_DEFAULTS: Record<string, string> = {
  beles: "deepseek/deepseek-v3.2",
  sushi: "deepseek/deepseek-r1",
  deepSeek: "deepseek/deepseek-v3.2",
  peach: "deepseek/deepseek-v3.2",
  claude: "anthropic/claude-sonnet-4-6",
  chatGPT: "openai/gpt-5.4",
  free: "openrouter/free",
  gemini: "google/gemini-3.1-pro-preview",
  grok: "x-ai/grok-4.1-fast",
  perplexity: "perplexity/sonar-pro",
}

// ─────────────────────────────────────────────────────────────────
// Smart router — rate-limit-proof, cost-optimized
// ─────────────────────────────────────────────────────────────────

/** Atomik counter — process-level round-robin */
let _rr = 0
function roundRobin<T>(pool: T[]): T {
  return pool[_rr++ % pool.length]!
}

/** Deduplicated fallback chain (OpenRouter max 3 models) */
function buildChain(...pools: string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const pool of pools) {
    for (const m of pool) {
      if (!seen.has(m)) {
        seen.add(m)
        out.push(m)
        if (out.length >= 3) return out
      }
    }
  }
  return out
}

// ─── Model pools ─────────────────────────────────────────────────

const FREE_WITH_TOOLS: string[] = [
  "minimax/minimax-m2.5:free",
  "minimax/minimax-m2.7:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
]

const FREE_NO_TOOLS: string[] = ["openai/gpt-oss-120b:free", "openrouter/free"]

const CHEAP_PAID: string[] = ["deepseek/deepseek-v3.2"]

const MID_PAID: string[] = ["minimax/minimax-m2.7", "minimax/minimax-m2.5"]

const CHEAP_ANALYZERS: string[] = [
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.1-fast",
]

// ─── Source → Tier mapping ────────────────────────────────────────

const SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
  "moltbook/commentFilter": { tier: "cheap" },
  "moltbook/engagement": { tier: "cheap" },
  "ai/title": { tier: "cheap" },
  swarm: { tier: "cheap" },
  coder: { tier: "cheap" },
  "ai/content": { tier: "cheap" },
  "pear/validate": { tier: "cheap" },
  "rag/documentSummary": { tier: "cheap" },
  "graph/cypher": { tier: "cheap" },
  "graph/entity": { tier: "cheap" },
  "graph/extract": { tier: "cheap" },
  "moltbook/comment": { tier: "cheap" },
  "ai/tribe/comment": { tier: "cheap" },
  "ai/thread/instructions": { tier: "cheap" },
  comment: { tier: "cheap" },
  engagement: { tier: "cheap" },
  tribe_comment: { tier: "cheap" },
  tribe_engage: { tier: "cheap" },
  m2m: { tier: "mid" },
  post: { tier: "mid" },
  codebase: { tier: "mid" },
  autonomous: { tier: "mid" },
  "autonomous/bidding": { tier: "mid" },
  "ai/sushi/file": { tier: "quality", model: "google/gemini-3.1-pro-preview" },
  "ai/sushi/webSearch": { tier: "premium", model: "perplexity/sonar-pro" },
}

const SCHEDULE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
  swarm: { tier: "mid" },
  post: { tier: "mid" },
  engagement: { tier: "free" },
  comment: { tier: "free" },
  autonomous: { tier: "mid" },
}

// ─────────────────────────────────────────────────────────────────
// Route function
// ─────────────────────────────────────────────────────────────────

interface routeResult {
  primary: string
  fallbacks: string[]
}

function route(
  tier: routeTier,
  opts: {
    needsTools?: boolean
    needsAnalyze?: boolean
    preferModel?: string
  } = {},
): routeResult {
  if (opts.preferModel && !opts.preferModel.endsWith(":free")) {
    return {
      primary: opts.preferModel,
      fallbacks: buildChain(CHEAP_PAID, FREE_WITH_TOOLS),
    }
  }

  switch (tier) {
    case "free": {
      const pool = opts.needsTools
        ? FREE_WITH_TOOLS
        : [...FREE_WITH_TOOLS, ...FREE_NO_TOOLS]
      const primary = roundRobin(pool)
      return {
        primary,
        fallbacks: buildChain(
          pool.filter((m) => m !== primary),
          CHEAP_PAID,
        ),
      }
    }
    case "cheap": {
      const primary = roundRobin(CHEAP_PAID)
      return {
        primary,
        fallbacks: buildChain(
          CHEAP_PAID.filter((m) => m !== primary),
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "mid": {
      const pool = opts.needsAnalyze ? CHEAP_ANALYZERS : [...MID_PAID]
      const primary = roundRobin(pool)
      return {
        primary,
        fallbacks: buildChain(
          pool.filter((m) => m !== primary),
          CHEAP_PAID,
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "quality": {
      const primary = roundRobin(CHEAP_ANALYZERS)
      return {
        primary,
        fallbacks: buildChain(
          CHEAP_ANALYZERS.filter((m) => m !== primary),
          CHEAP_PAID,
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "premium":
      return {
        primary: opts.preferModel ?? "anthropic/claude-sonnet-4-6",
        fallbacks: buildChain(MID_PAID, CHEAP_PAID, FREE_WITH_TOOLS),
      }
  }
}

// ─────────────────────────────────────────────────────────────────
// getModelProvider
// ─────────────────────────────────────────────────────────────────

export async function getModelProvider({
  app,
  swarm,
  user,
  guest,
  job,
  source,
  ...rest
}: {
  app?: sushiType | nil
  source?: string | nil
  name?: string | nil
  modelId?: string | nil
  canReason?: boolean | nil
  job?: JobWithModelConfig | nil
  user?: user | nil
  guest?: guest | nil
  swarm?: { modelId?: string; postType?: string } | nil
}): Promise<ModelProviderResult> {
  const agents = (await getAiAgents({ include: app?.id })) as aiAgent[]
  const foundAgent = rest.name
    ? agents.find((a) => a.name.toLowerCase() === rest.name?.toLowerCase())
    : undefined
  const agent =
    foundAgent ??
    agents.find((a) => a.name.toLowerCase() === "sushi") ??
    agents[0]!

  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const isBYOK = !!accountKey
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const appKey = safeDecrypt(app?.apiKeys?.openrouter)
  const systemKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!

  const orKey = byokKey ?? appKey ?? systemKey

  const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1
  const hasCredits = creditsLeft > 0
  const effectivelyHasCredits = hasCredits || !!byokKey
  const isJob = !!(swarm?.postType || job)

  const degradedKey = orKey

  const fallback = (): ModelProviderResult => {
    const { primary, fallbacks } = route("free", { needsTools: false })
    return {
      provider: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! })(
        primary,
        {
          models: buildChain(fallbacks),
        },
      ),
      modelId: primary,
      agentName: agent.name,
      lastKey: "openrouter",
      isFree: true,
      supportsTools: false,
      canAnalyze: false,
      isBYOK: false,
    }
  }

  const degraded = (): ModelProviderResult => {
    const { primary, fallbacks } = route("free", { needsTools: isJob })
    return {
      provider: createOpenRouter({ apiKey: degradedKey })(primary, {
        models: buildChain(fallbacks),
      }),
      modelId: primary,
      agentName: agent.name,
      lastKey: isBYOK ? "byok" : "system",
      isFree: true,
      isDegraded: true,
      supportsTools: modelCapabilities[primary]?.tools ?? false,
      canAnalyze: false,
      isBYOK: !!byokKey,
    }
  }

  if (isBYOK && !byokKey) return fallback()
  if (!effectivelyHasCredits) return degraded()

  const resolvedName =
    foundAgent?.name ??
    (source && SOURCE_TIERS[source] ? source : (rest.name ?? "sushi"))

  const explicitModel =
    swarm?.modelId ??
    job?.metadata?.modelId ??
    job?.modelConfig?.model ??
    rest.modelId

  const safeExplicitModel =
    explicitModel === "deepseek/deepseek-r1" && isJob
      ? "deepseek/deepseek-v3.2"
      : explicitModel

  let routeResult: routeResult

  if (safeExplicitModel && !safeExplicitModel.endsWith(":free")) {
    routeResult = route("cheap", { preferModel: safeExplicitModel })
  } else if (swarm?.postType && SCHEDULE_TIERS[swarm.postType]) {
    const cfg = SCHEDULE_TIERS[swarm.postType]!
    routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
  } else if (source && SOURCE_TIERS[source]) {
    const cfg = SOURCE_TIERS[source]!
    routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
  } else if (resolvedName && AGENT_DEFAULTS[resolvedName]) {
    const agentModel = AGENT_DEFAULTS[resolvedName]!
    const isPremiumAgent = [
      "claude",
      "chatGPT",
      "gemini",
      "grok",
      "perplexity",
    ].includes(resolvedName)
    routeResult = route(isPremiumAgent ? "premium" : "cheap", {
      preferModel: agentModel,
      needsTools: true,
    })
  } else if (isJob) {
    routeResult = route("cheap", { needsTools: true })
  } else {
    routeResult = route("mid", { needsTools: true })
  }

  const modelId = routeResult.primary
  const fallbackModels = buildChain(routeResult.fallbacks)

  const ollamaModel = toOllamaModel(modelId)
  const ollamaWithThinking = createOllamaClient()

  const orProvider = createOpenRouter({ apiKey: orKey })(modelId, {
    models: fallbackModels,
  })

  if (ollamaModel && !isBYOK && user?.role === "admin") {
    return {
      provider: ollamaWithThinking(ollamaModel, {
        reasoning_effort: "high",
      }) as unknown as typeof orProvider,
      modelId,
      agentName: agent.name,
      lastKey: "ollama",
      supportsTools: true,
      canAnalyze: false,
      isBYOK: false,
      isBELES: resolvedName === "beleş",
      isFree: false,
    }
  }

  // DeepSeek API uses different model IDs than OpenRouter
  const DEEPSEEK_API_MODEL_MAP: Record<string, string> = {
    "deepseek/deepseek-chat": "deepseek-chat",
    "deepseek/deepseek-r1": "deepseek-reasoner",
    "deepseek/deepseek-v3.2": "deepseek-chat",
  }

  const deepseekApiModelId = DEEPSEEK_API_MODEL_MAP[modelId] ?? modelId

  return {
    provider: modelId.startsWith("deepseek")
      ? createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY! })(
          deepseekApiModelId,
        )
      : orProvider,
    modelId,
    agentName: agent.name,
    lastKey: "openrouter",
    supportsTools: modelCapabilities[modelId]?.tools ?? false,
    canAnalyze: modelCapabilities[modelId]?.canAnalyze ?? false,
    isBYOK: !!byokKey,
    isBELES: resolvedName === "beleş",
    isFree: modelId.endsWith(":free") || modelId === "qwen/qwen3.6-plus",
  }
}

// ─────────────────────────────────────────────────────────────────
// getEmbeddingProvider
// ─────────────────────────────────────────────────────────────────

const EMBEDDING_SOURCES: Record<string, string> = {
  codebase: "qwen/qwen3-embedding-8b",
  coder: "qwen/qwen3-embedding-8b",
  "rag/documentSummary": "qwen/qwen3-embedding-8b",
  "graph/cypher": "qwen/qwen3-embedding-8b",
  "graph/entity": "qwen/qwen3-embedding-8b",
  "graph/extract": "qwen/qwen3-embedding-8b",
  comment: "qwen/qwen3-embedding-8b",
  engagement: "qwen/qwen3-embedding-8b",
  tribe_comment: "qwen/qwen3-embedding-8b",
  tribe_engage: "qwen/qwen3-embedding-8b",
  "ai/tribe/comment": "qwen/qwen3-embedding-8b",
  "moltbook/comment": "qwen/qwen3-embedding-8b",
  "moltbook/engagement": "qwen/qwen3-embedding-8b",
  news: "qwen/qwen3-embedding-8b",
  default: "qwen/qwen3-embedding-8b",
}

export async function getEmbeddingProvider({
  app,
  user,
  guest,
  source,
}: {
  app?: sushiType | null
  user?: user | null
  guest?: guest | null
  source?: string
}): Promise<{
  provider?: ReturnType<typeof createOpenRouter>
  modelId?: string
  textEmbeddingModel?: any
}> {
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const orKey = byokKey ?? safeDecrypt(app?.apiKeys?.openrouter) ?? systemKey

  const modelId =
    EMBEDDING_SOURCES[source || "default"] ?? EMBEDDING_SOURCES.default

  const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1

  const provider =
    creditsLeft === 0 || !orKey
      ? undefined
      : createOpenRouter({ apiKey: orKey })

  return {
    provider,
    modelId,
    textEmbeddingModel: modelId
      ? provider?.textEmbeddingModel(modelId)
      : undefined,
  }
}

// ─────────────────────────────────────────────────────────────────
// getMediaAPIKeys — image/replicate/fal key resolver
// ─────────────────────────────────────────────────────────────────

export const getMediaAPIKeys = ({
  app,
  user,
  guest,
}: {
  app?: sushiType | null
  user?: user | null
  guest?: guest | null
}) => {
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const appKey = safeDecrypt(app?.apiKeys?.openrouter)
  const or = byokKey ?? appKey ?? systemKey

  const systemReplicateKey = isFreeTier(app)
    ? process.env.REPLICATE_API_KEY
    : undefined
  const appReplicateKey = safeDecrypt(app?.apiKeys?.replicate)
  const replicate = byokKey ?? appReplicateKey ?? systemReplicateKey

  const systemFalKey = isFreeTier(app) ? process.env.FAL_API_KEY : undefined
  const appFalKey = safeDecrypt(app?.apiKeys?.fal)
  const fal = byokKey ?? appFalKey ?? systemFalKey

  return { fal, or, replicate }
}
