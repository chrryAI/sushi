// ─────────────────────────────────────────────────────────────────
// sushi/effectProvider.ts — Effect-based model routing + provider resolution
//
// Mirrors sushi/provider.ts routing logic but returns @effect/ai
// Layer<LanguageModel> instead of Vercel AI SDK LanguageModelV1.
// Uses @effect/ai-openai's OpenAI-compatible client for all providers
// (OpenRouter, DeepSeek direct, Ollama) since they all expose
// OpenAI-compatible APIs.
// ─────────────────────────────────────────────────────────────────

import { isE2E } from "@chrryai/donut/utils"
import type * as AiLanguageModel from "@effect/ai/LanguageModel"
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai"
import { FetchHttpClient } from "@effect/platform"
import { Context, Data, Effect, Layer, Redacted } from "effect"
import { decrypt, getAiAgents, isDevelopment } from "../../../index"
import {
  type ModelProviderResult,
  modelCapabilities,
  type routeTier,
} from "../vault"
import { createOllamaClient, OLLAMA_MODEL_MAP, toOllamaModel } from "./provider"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type EffectModelResult = {
  /** Effect Layer providing LanguageModel service */
  layer: Layer.Layer<AiLanguageModel.LanguageModel>
  modelId: string
  agentName: string
  lastKey: string
  isFree: boolean
  supportsTools: boolean
  canAnalyze: boolean
  isBYOK: boolean
  isBELES?: boolean
  isDegraded?: boolean
}

// ─────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────

export class NoCreditsError extends Data.TaggedError("NoCreditsError")<{
  readonly userId?: string
  readonly guestId?: string
}> {}

export class NoApiKeyError extends Data.TaggedError("NoApiKeyError")<{
  readonly source: string
}> {}

export type ProviderError = NoCreditsError | NoApiKeyError

// ─────────────────────────────────────────────────────────────────
// Internal helpers (from provider.ts)
// ─────────────────────────────────────────────────────────────────

function safeDecrypt(key: string | undefined | null): string | undefined {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    return undefined
  }
}

function byokDecrypt(key: string | undefined | null): string | undefined {
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
function isFreeTier(app: { tier?: string | null } | null | undefined): boolean {
  if (isE2E) return true
  return !plusTiers.includes(app?.tier || "")
}

// ─────────────────────────────────────────────────────────────────
// Agent defaults (from provider.ts)
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
// Model pools (from provider.ts)
// ─────────────────────────────────────────────────────────────────

const FREE_WITH_TOOLS: string[] = [
  "minimax/minimax-m2.5:free",
  "minimax/minimax-m2.7:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
]

const FREE_NO_TOOLS: string[] = ["openai/gpt-oss-120b:free", "openrouter/free"]
const CHEAP_PAID: string[] = ["deepseek/deepseek-v3.2"]
const MID_PAID: string[] = ["deepseek/deepseek-r1"]
const CHEAP_ANALYZERS: string[] = [
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.1-fast",
]

// ─────────────────────────────────────────────────────────────────
// Source & schedule tiers (from provider.ts)
// ─────────────────────────────────────────────────────────────────

const OLLAMA_SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> =
  {
    "moltbook/commentFilter": { tier: "cheap" },
    "moltbook/engagement": { tier: "cheap" },
    "ai/title": { tier: "cheap" },
    swarm: { tier: "cheap" },
    coder: { tier: "cheap" },
    "ai/content": { tier: "cheap" },
    "pear/validate": { tier: "cheap" },
    "rag/documentSummary": { tier: "cheap" },
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
  }

const SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
  ...OLLAMA_SOURCE_TIERS,
  "graph/cypher": { tier: "cheap" },
  "graph/entity": { tier: "cheap" },
  "graph/extract": { tier: "cheap" },
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
// Smart router (from provider.ts)
// ─────────────────────────────────────────────────────────────────

let _rr = 0
function roundRobin<T>(pool: T[]): T {
  return pool[_rr++ % pool.length]!
}

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

interface RouteResult {
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
): RouteResult {
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
// Layer factories
// ─────────────────────────────────────────────────────────────────

/** Create an OpenAI-compatible client layer for OpenRouter */
const makeOpenRouterLayer = (apiKey: string) =>
  OpenAiClient.layer({
    apiKey: Redacted.make(apiKey),
    apiUrl: "https://openrouter.ai/api/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

/** Create an OpenAI-compatible client layer for DeepSeek direct */
const makeDeepSeekLayer = (apiKey: string) =>
  OpenAiClient.layer({
    apiKey: Redacted.make(apiKey),
    apiUrl: "https://api.deepseek.com/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

/** Create an OpenAI-compatible client layer for Ollama */
const makeOllamaLayer = () =>
  OpenAiClient.layer({
    apiKey: Redacted.make(process.env.OLLAMA_API_KEY || "ollama"),
    apiUrl: process.env.OLLAMA_BASE_URL || "https://ollama.com/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

/** Create a LanguageModel layer for a given model + client layer */
const makeModelLayer = (
  modelId: string,
  clientLayer: Layer.Layer<OpenAiClient.OpenAiClient>,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layer({ model: modelId }).pipe(Layer.provide(clientLayer))

// ─────────────────────────────────────────────────────────────────
// DeepSeek model mapping (OpenRouter → DeepSeek API)
// ─────────────────────────────────────────────────────────────────

const DEEPSEEK_API_MODEL_MAP: Record<string, string> = {
  "deepseek/deepseek-chat": "deepseek-chat",
  "deepseek/deepseek-r1": "deepseek-reasoner",
  "deepseek/deepseek-v3.2": "deepseek-chat",
}

// ─────────────────────────────────────────────────────────────────
// getEffectModelLayer — main entry point
// ─────────────────────────────────────────────────────────────────

interface GetEffectModelLayerOptions {
  app?: any
  source?: string | null
  name?: string | null
  modelId?: string | null
  canReason?: boolean | null
  job?: any
  user?: any
  guest?: any
  swarm?: { modelId?: string; postType?: string } | null
}

export async function getEffectModelLayer(
  options: GetEffectModelLayerOptions = {},
): Promise<EffectModelResult> {
  const {
    app,
    source,
    name,
    modelId: modelIdOverride,
    job,
    user,
    guest,
    swarm,
  } = options

  const agents = (await getAiAgents({ include: app?.id })) as any[]
  const foundAgent = name
    ? agents.find((a: any) => a.name.toLowerCase() === name.toLowerCase())
    : undefined
  const agent =
    foundAgent ??
    agents.find((a: any) => a.name.toLowerCase() === "sushi") ??
    agents[0]!

  // Key resolution
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

  // Fallback — no credits, no BYOK
  const fallback = (): EffectModelResult => {
    const { primary, fallbacks } = route("free", { needsTools: false })
    return {
      layer: makeModelLayer(
        primary,
        makeOpenRouterLayer(process.env.OPENROUTER_API_KEY!),
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

  const degraded = (): EffectModelResult => {
    const { primary, fallbacks } = route("free", { needsTools: isJob })
    return {
      layer: makeModelLayer(primary, makeOpenRouterLayer(degradedKey)),
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

  // Resolve model
  const resolvedName =
    foundAgent?.name ??
    (source && SOURCE_TIERS[source] ? source : (name ?? "sushi"))

  const explicitModel =
    swarm?.modelId ??
    job?.metadata?.modelId ??
    job?.modelConfig?.model ??
    modelIdOverride

  const safeExplicitModel =
    explicitModel === "deepseek/deepseek-r1" && isJob
      ? "deepseek/deepseek-v3.2"
      : explicitModel

  let routeResult: RouteResult

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

  // Ollama proxy for dev/admin/whitelisted sources
  const ollamaModel = toOllamaModel(modelId)
  if (
    ollamaModel &&
    !isBYOK &&
    (isDevelopment ||
      user?.role === "admin" ||
      !!OLLAMA_SOURCE_TIERS[source || ""])
  ) {
    return {
      layer: makeModelLayer(ollamaModel.name, makeOllamaLayer()),
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

  // DeepSeek direct API (bypasses OpenRouter for cost savings)
  const deepseekApiKey = !isBYOK ? process.env.DEEPSEEK_API_KEY : undefined
  const deepseekApiModelId = deepseekApiKey
    ? DEEPSEEK_API_MODEL_MAP[modelId]
    : undefined

  if (deepseekApiModelId && deepseekApiKey) {
    return {
      layer: makeModelLayer(
        deepseekApiModelId,
        makeDeepSeekLayer(deepseekApiKey),
      ),
      modelId,
      agentName: agent.name,
      lastKey: "deepseek",
      supportsTools: modelCapabilities[modelId]?.tools ?? false,
      canAnalyze: modelCapabilities[modelId]?.canAnalyze ?? false,
      isBYOK: !!byokKey,
      isBELES: resolvedName === "beleş",
      isFree: modelId.endsWith(":free") || modelId === "qwen/qwen3.6-plus",
    }
  }

  // Default: OpenRouter
  return {
    layer: makeModelLayer(modelId, makeOpenRouterLayer(orKey)),
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
// Simple factory for known model + key (no routing)
// Useful for cron jobs and one-off calls
// ─────────────────────────────────────────────────────────────────

export function createModelLayer(
  modelId: string,
  apiKey: string,
  baseUrl?: string,
): Layer.Layer<AiLanguageModel.LanguageModel> {
  const clientLayer = baseUrl
    ? OpenAiClient.layer({
        apiKey: Redacted.make(apiKey),
        apiUrl: baseUrl,
      }).pipe(Layer.provide(FetchHttpClient.layer))
    : makeOpenRouterLayer(apiKey)

  return makeModelLayer(modelId, clientLayer)
}

// Convenience: create a cheap-tier model layer with system key
export function createLayer({
  tier = "mid",
}: {
  tier?: routeTier
} = {}): Layer.Layer<AiLanguageModel.LanguageModel> {
  const apiKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!
  const { primary } = route(tier, { needsTools: true })
  return makeModelLayer(primary, makeOpenRouterLayer(apiKey))
}

// Convenience: create a free-tier model layer with system key
export function createFreeModelLayer(): Layer.Layer<AiLanguageModel.LanguageModel> {
  const apiKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!
  const { primary } = route("free", { needsTools: false })
  return makeModelLayer(primary, makeOpenRouterLayer(apiKey))
}
