// // ─────────────────────────────────────────────────────────────────
// // sushi/provider.ts — Model routing + provider resolution
// //
// // All model-selection logic lives here. vault/index.ts is now just
// // a data/types layer (prizes, limits, capabilities, API key helpers).
// // ─────────────────────────────────────────────────────────────────

// import { createDeepSeek } from "@ai-sdk/deepseek"
// import { createOpenAI } from "@ai-sdk/openai"
// import { type locale, locales } from "@chrryai/donut/locales"
// import type {
//   aiAgent,
//   sushi as app,
//   cherry,
//   store as chrryStore,
//   guest,
//   guest,
//   instructionBase,
//   message,
//   modelName,
//   nil,
//   sushi,
//   user,
//   userWithRelations,
// } from "@chrryai/donut/types"
// import { isE2E } from "@chrryai/donut/utils"
// import { createOpenRouter } from "@openrouter/ai-sdk-provider"
// import * as bcrypt from "bcrypt"
// import * as dotenv from "dotenv"
// import {
//   and,
//   asc,
//   cosineDistance,
//   count,
//   desc,
//   eq,
//   exists,
//   gt,
//   gte,
//   ilike,
//   inArray,
//   isNotNull,
//   isNull,
//   lt,
//   lte,
//   max,
//   ne,
//   not,
//   notInArray,
//   or,
//   type SQL,
//   sql,
//   sum,
// } from "drizzle-orm"
// import {
//   type PostgresJsDatabase,
//   drizzle as postgresDrizzle,
// } from "drizzle-orm/postgres-js"
// import langdetect from "langdetect"
// import pLimit from "p-limit"
// import postgres from "postgres"
// import { v4 as uuidv4 } from "uuid"
// import { decrypt, getAiAgents, isDevelopment } from "../../../index"
// // import { createStores } from "./src/dna/createStores"
// // Better Auth tables
// import {
//   getCache,
//   invalidateApp,
//   invalidateGuest,
//   invalidateStore,
//   invalidateUser,
//   setCache,
// } from "../../../src/cache"
// import { redis } from "../../../src/redis"
// import {
//   accounts,
//   affiliateClicks,
//   affiliateLinks,
//   affiliatePayouts,
//   affiliateReferrals,
//   agentApiUsage,
//   aiAgents,
//   analyticsSites,
//   type apiKeys,
//   appCampaigns,
//   appExtends,
//   appOrders,
//   apps,
//   authExchangeCodes,
//   autonomousBids,
//   budgets,
//   calendarEvents,
//   cfApiRequests,
//   cfRateLimitEvents,
//   cfSdkSessions,
//   cfZones,
//   characterProfiles,
//   cities,
//   codebaseIssues,
//   codebaseQueries,
//   codeEmbeddings,
//   collaborations,
//   creditTransactions,
//   creditUsages,
//   devices,
//   documentChunks,
//   expenses,
//   feedbackTransactions,
//   GUEST_CREDITS_PER_MONTH,
//   guests,
//   hippos,
//   installs,
//   instructions,
//   invitations,
//   kanbanBoards,
//   kanbanCards,
//   kanbanColumns,
//   memories,
//   messageEmbeddings,
//   messages,
//   moods,
//   pearFeedback,
//   placeHolders,
//   premiumSubscriptions,
//   pushSubscriptions,
//   type ramen,
//   realtimeAnalytics,
//   recruitmentFlows,
//   retroResponses,
//   retroSessions,
//   scheduledJobs,
//   sharedExpenses,
//   slotAuctions,
//   slotRentals,
//   sonarIssues,
//   sonarMetrics,
//   storeInstalls,
//   stores,
//   storeTimeSlots,
//   streamLogs,
//   subscriptions,
//   type swarm,
//   systemLogs,
//   talentEarnings,
//   talentInvitations,
//   talentProfiles,
//   talentThreads,
//   taskLogs,
//   taskStates,
//   tasks,
//   teams,
//   threadSummaries,
//   threads,
//   timers,
//   tribeComments,
//   tribeFollows,
//   tribeLikes,
//   tribeMemberships,
//   tribeNews,
//   tribePosts,
//   tribePostTranslations,
//   tribeReactions,
//   tribes,
//   users,
//   verificationTokens,
// } from "../../../src/schema"
// import {
//   type JobWithModelConfig,
//   type ModelProviderResult,
//   modelCapabilities,
//   type routeTier,
// } from "../vault"
// import {
//   buildPromptSections,
//   resolveJoinWeights,
//   resolveMemoryPageSize,
// } from "./src/ai/sushi/promptBuilder"
// import {
//   getEmbeddingProvider,
//   getMediaAPIKeys,
//   getModelProvider,
// } from "./src/ai/sushi/provider"

// export const OLLAMA_MODEL_MAP: Record<
//   string,
//   { name: string; reasoning_effort?: string }
// > = {
//   //glm-5.1:cloud
//   "deepseek/deepseek-v3.2": {
//     name: "deepseek-v3.2:cloud",
//     reasoning_effort: "none",
//   },
//   "deepseek/deepseek-r1": {
//     name: "deepseek-v3.2:cloud",
//     reasoning_effort: "medium",
//   },
//   "deepseek/deepseek-chat": {
//     name: "deepseek-v3.2:cloud",
//     reasoning_effort: "none",
//   },
//   "deepseek-chat": { name: "deepseek-v3.2:cloud", reasoning_effort: "none" },
//   "minimax/minimax-m2.7": {
//     name: "minimax-m2.7:cloud",
//     reasoning_effort: "high",
//   },
//   "minimax/minimax-m2.5": {
//     name: "minimax-m2.5:cloud",
//     reasoning_effort: "none",
//   },
//   "nvidia/nemotron-3-super-120b-a12b": {
//     name: "deepseek-v3.2:cloud",
//     reasoning_effort: "none",
//   },
//   "google/gemini-3.1-pro-preview": {
//     name: "kimi-k2.5:cloud",
//     reasoning_effort: "none",
//   },
//   "x-ai/grok-4.1-fast": { name: "kimi-k2.5:cloud", reasoning_effort: "none" },
// }

// export function toOllamaModel(orModelId: string) {
//   return OLLAMA_MODEL_MAP[orModelId.replace(":free", "")]
// }

// export function createOllamaClient() {
//   return createOpenAI({
//     baseURL: process.env.OLLAMA_BASE_URL || "https://ollama.com/v1",
//     apiKey: process.env.OLLAMA_API_KEY || "ollama",
//   }) as any
// }

// // ─────────────────────────────────────────────────────────────────
// // Internal helpers
// // ─────────────────────────────────────────────────────────────────

// function safeDecrypt(key: string | nil) {
//   if (!key || key.includes("...")) return undefined
//   try {
//     return decrypt(key)
//   } catch {
//     return undefined
//   }
// }

// function byokDecrypt(key: string | nil) {
//   if (!key || key.includes("...")) return undefined
//   try {
//     return decrypt(key)
//   } catch {
//     if (isE2E) return undefined
//     throw new Error(
//       "Your API key could not be decrypted. Please re-enter it in Settings.",
//     )
//   }
// }

// const plusTiers = ["plus", "pro"]
// function isFreeTier(app: { tier: string | nil } | nil) {
//   if (isE2E) return true
//   return !plusTiers.includes(app?.tier || "")
// }

// // ─────────────────────────────────────────────────────────────────
// // Agent defaults
// // ─────────────────────────────────────────────────────────────────

// const AGENT_DEFAULTS: Record<string, string> = {
//   beles: "deepseek/deepseek-v3.2",
//   sushi: "deepseek/deepseek-r1",
//   deepSeek: "deepseek/deepseek-v3.2",
//   peach: "deepseek/deepseek-r1",
//   claude: "anthropic/claude-sonnet-4-6",
//   chatGPT: "openai/gpt-5.4",
//   free: "openrouter/free",
//   gemini: "google/gemini-3.1-pro-preview",
//   grok: "x-ai/grok-4.1-fast",
//   perplexity: "perplexity/sonar-pro",
// }

// // ─────────────────────────────────────────────────────────────────
// // Smart router — rate-limit-proof, cost-optimized
// // ─────────────────────────────────────────────────────────────────

// /** Atomik counter — process-level round-robin */
// let _rr = 0
// function roundRobin<T>(pool: T[]): T {
//   return pool[_rr++ % pool.length]!
// }

// /** Deduplicated fallback chain (OpenRouter max 3 models) */
// function buildChain(...pools: string[][]): string[] {
//   const seen = new Set<string>()
//   const out: string[] = []
//   for (const pool of pools) {
//     for (const m of pool) {
//       if (!seen.has(m)) {
//         seen.add(m)
//         out.push(m)
//         if (out.length >= 3) return out
//       }
//     }
//   }
//   return out
// }

// // ─── Model pools ─────────────────────────────────────────────────

// const FREE_WITH_TOOLS: string[] = [
//   "minimax/minimax-m2.5:free",
//   "minimax/minimax-m2.7:free",
//   "nvidia/nemotron-3-super-120b-a12b:free",
// ]

// const FREE_NO_TOOLS: string[] = ["openai/gpt-oss-120b:free", "openrouter/free"]

// const CHEAP_PAID: string[] = ["deepseek/deepseek-v3.2"]

// const MID_PAID: string[] = ["deepseek/deepseek-r1"]
// // ["minimax/minimax-m2.7", "minimax/minimax-m2.5"]

// const CHEAP_ANALYZERS: string[] = [
//   "google/gemini-3.1-pro-preview",
//   "x-ai/grok-4.1-fast",
// ]

// // ─── Source → Tier mapping ────────────────────────────────────────

// const OLLAMA_SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> =
//   {
//     "moltbook/commentFilter": { tier: "cheap" },
//     "moltbook/engagement": { tier: "cheap" },
//     "ai/title": { tier: "cheap" },
//     swarm: { tier: "cheap" },
//     coder: { tier: "cheap" },
//     "ai/content": { tier: "cheap" },
//     "pear/validate": { tier: "cheap" },
//     "rag/documentSummary": { tier: "cheap" },

//     "moltbook/comment": { tier: "cheap" },
//     "ai/tribe/comment": { tier: "cheap" },
//     "ai/thread/instructions": { tier: "cheap" },
//     comment: { tier: "cheap" },
//     engagement: { tier: "cheap" },
//     tribe_comment: { tier: "cheap" },
//     tribe_engage: { tier: "cheap" },
//     m2m: { tier: "mid" },
//     post: { tier: "mid" },
//     codebase: { tier: "mid" },
//     autonomous: { tier: "mid" },
//     "autonomous/bidding": { tier: "mid" },
//   }
// const SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
//   ...OLLAMA_SOURCE_TIERS,
//   "graph/cypher": { tier: "cheap" },
//   "graph/entity": { tier: "cheap" },
//   "graph/extract": { tier: "cheap" },
//   "ai/sushi/file": { tier: "quality", model: "google/gemini-3.1-pro-preview" },
//   "ai/sushi/webSearch": { tier: "premium", model: "perplexity/sonar-pro" },
// }

// const SCHEDULE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
//   swarm: { tier: "mid" },
//   post: { tier: "mid" },
//   engagement: { tier: "free" },
//   comment: { tier: "free" },
//   autonomous: { tier: "mid" },
// }

// // ─────────────────────────────────────────────────────────────────
// // Route function
// // ─────────────────────────────────────────────────────────────────

// export interface routeResult {
//   primary: string
//   fallbacks: string[]
// }

// export function route(
//   tier: routeTier,
//   opts: {
//     needsTools?: boolean
//     needsAnalyze?: boolean
//     preferModel?: string
//   } = {},
// ): routeResult {
//   if (opts.preferModel && !opts.preferModel.endsWith(":free")) {
//     return {
//       primary: opts.preferModel,
//       fallbacks: buildChain(CHEAP_PAID, FREE_WITH_TOOLS),
//     }
//   }

//   switch (tier) {
//     case "free": {
//       const pool = opts.needsTools
//         ? FREE_WITH_TOOLS
//         : [...FREE_WITH_TOOLS, ...FREE_NO_TOOLS]
//       const primary = roundRobin(pool)
//       return {
//         primary,
//         fallbacks: buildChain(
//           pool.filter((m) => m !== primary),
//           CHEAP_PAID,
//         ),
//       }
//     }
//     case "cheap": {
//       const primary = roundRobin(CHEAP_PAID)
//       return {
//         primary,
//         fallbacks: buildChain(
//           CHEAP_PAID.filter((m) => m !== primary),
//           FREE_WITH_TOOLS,
//         ),
//       }
//     }
//     case "mid": {
//       const pool = opts.needsAnalyze ? CHEAP_ANALYZERS : [...MID_PAID]
//       const primary = roundRobin(pool)
//       return {
//         primary,
//         fallbacks: buildChain(
//           pool.filter((m) => m !== primary),
//           CHEAP_PAID,
//           FREE_WITH_TOOLS,
//         ),
//       }
//     }
//     case "quality": {
//       const primary = roundRobin(CHEAP_ANALYZERS)
//       return {
//         primary,
//         fallbacks: buildChain(
//           CHEAP_ANALYZERS.filter((m) => m !== primary),
//           CHEAP_PAID,
//           FREE_WITH_TOOLS,
//         ),
//       }
//     }
//     case "premium":
//       return {
//         primary: opts.preferModel ?? "anthropic/claude-sonnet-4-6",
//         fallbacks: buildChain(MID_PAID, CHEAP_PAID, FREE_WITH_TOOLS),
//       }
//   }
// }

// // ─────────────────────────────────────────────────────────────────
// // getModelProvider
// // ──────────
// // ───────────────────────────────────────────────────────

// export type modelProviderOptions = {
//   app?: app | nil
//   source?: string | nil
//   name?: string | nil
//   modelId?: string | nil
//   canReason?: boolean | nil
//   job?: JobWithModelConfig | nil
//   user?: user | nil
//   guest?: guest | nil
//   isEffect?: boolean | nil
//   swarm?: { modelId?: string; postType?: string } | nil
// }
// export async function getModelProvider({
//   app,
//   swarm,
//   user,
//   guest,
//   job,
//   source,
//   isEffect,
//   ...rest
// }: modelProviderOptions): Promise<ModelProviderResult> {
//   const agents = (await getAiAgents({ include: app?.id })) as aiAgent[]
//   const foundAgent = rest.name
//     ? agents.find((a) => a.name.toLowerCase() === rest.name?.toLowerCase())
//     : undefined
//   const agent =
//     foundAgent ??
//     agents.find((a) => a.name.toLowerCase() === "sushi") ??
//     agents[0]!

//   const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
//   const isBYOK = !!accountKey
//   const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

//   const appKey = safeDecrypt(app?.apiKeys?.openrouter)
//   const systemKey = isDevelopment
//     ? process.env.OPENROUTER_SUSHI!
//     : process.env.OPENROUTER_API_KEY!

//   const orKey = byokKey ?? appKey ?? systemKey

//   const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1
//   const hasCredits = creditsLeft > 0
//   const effectivelyHasCredits = hasCredits || !!byokKey
//   const isJob = !!(swarm?.postType || job)

//   const degradedKey = orKey

//   const fallback = (): ModelProviderResult => {
//     const { primary, fallbacks } = route("free", { needsTools: false })
//     return {
//       provider: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! })(
//         primary,
//         {
//           models: buildChain(fallbacks),
//         },
//       ),
//       modelId: primary,
//       agentName: agent.name,
//       lastKey: "openrouter",
//       isFree: true,
//       supportsTools: false,
//       canAnalyze: false,
//       isBYOK: false,
//     }
//   }

//   const degraded = (): ModelProviderResult => {
//     const { primary, fallbacks } = route("free", { needsTools: isJob })
//     return {
//       provider: createOpenRouter({ apiKey: degradedKey })(primary, {
//         models: buildChain(fallbacks),
//       }),
//       modelId: primary,
//       agentName: agent.name,
//       lastKey: isBYOK ? "byok" : "system",
//       isFree: true,
//       isDegraded: true,
//       supportsTools: modelCapabilities[primary]?.tools ?? false,
//       canAnalyze: false,
//       isBYOK: !!byokKey,
//     }
//   }

//   if (isBYOK && !byokKey) return fallback()
//   if (!effectivelyHasCredits) return degraded()

//   const resolvedName =
//     foundAgent?.name ??
//     (source && SOURCE_TIERS[source] ? source : (rest.name ?? "sushi"))

//   const explicitModel =
//     swarm?.modelId ??
//     job?.metadata?.modelId ??
//     job?.modelConfig?.model ??
//     rest.modelId

//   const safeExplicitModel =
//     explicitModel === "deepseek/deepseek-r1" && isJob
//       ? "deepseek/deepseek-v3.2"
//       : explicitModel

//   let routeResult: routeResult

//   if (safeExplicitModel && !safeExplicitModel.endsWith(":free")) {
//     routeResult = route("cheap", { preferModel: safeExplicitModel })
//   } else if (swarm?.postType && SCHEDULE_TIERS[swarm.postType]) {
//     const cfg = SCHEDULE_TIERS[swarm.postType]!
//     routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
//   } else if (source && SOURCE_TIERS[source]) {
//     const cfg = SOURCE_TIERS[source]!
//     routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
//   } else if (resolvedName && AGENT_DEFAULTS[resolvedName]) {
//     const agentModel = AGENT_DEFAULTS[resolvedName]!
//     const isPremiumAgent = [
//       "claude",
//       "chatGPT",
//       "gemini",
//       "grok",
//       "perplexity",
//     ].includes(resolvedName)
//     routeResult = route(isPremiumAgent ? "premium" : "cheap", {
//       preferModel: agentModel,
//       needsTools: true,
//     })
//   } else if (isJob) {
//     routeResult = route("cheap", { needsTools: true })
//   } else {
//     routeResult = route("mid", { needsTools: true })
//   }

//   const modelId = routeResult.primary
//   const fallbackModels = buildChain(routeResult.fallbacks)

//   const ollamaModel = toOllamaModel(modelId)
//   const ollamaWithThinking = createOllamaClient()

//   const orProvider = createOpenRouter({ apiKey: orKey })(modelId, {
//     models: fallbackModels,
//   })

//   if (ollamaModel && !isBYOK && !!OLLAMA_SOURCE_TIERS[source || ""]) {
//     return {
//       provider: ollamaWithThinking(ollamaModel.name, {
//         reasoning_effort: ollamaModel.reasoning_effort,
//       }) as unknown as typeof orProvider,
//       modelId,
//       agentName: agent.name,
//       lastKey: "ollama",
//       supportsTools: true,
//       canAnalyze: false,
//       isBYOK: false,
//       isBELEŞ: resolvedName === "beleş",
//       isFree: false,
//     }
//   }

//   const DEEPSEEK_API_MODEL_MAP: Record<string, string> = {
//     "deepseek/deepseek-chat": "deepseek-chat",
//     "deepseek/deepseek-r1": "deepseek-reasoner",
//     "deepseek/deepseek-v3.2": "deepseek-chat",
//   }

//   const deepseekApiKey = !isBYOK ? process.env.DEEPSEEK_API_KEY : undefined
//   const deepseekApiModelId = deepseekApiKey
//     ? DEEPSEEK_API_MODEL_MAP[modelId]
//     : undefined

//   return {
//     provider: isEffect
//       ? null
//       : deepseekApiModelId && deepseekApiKey
//         ? createDeepSeek({ apiKey: deepseekApiKey })(deepseekApiModelId)
//         : orProvider,
//     modelId,
//     agentName: agent.name,
//     lastKey: deepseekApiModelId ? "deepseek" : "openrouter",
//     supportsTools: modelCapabilities[modelId]?.tools ?? false,
//     canAnalyze: modelCapabilities[modelId]?.canAnalyze ?? false,
//     isBYOK: !!byokKey,
//     isBELEŞ: resolvedName === "beleş",
//     isFree: modelId.endsWith(":free") || modelId === "qwen/qwen3.6-plus",
//   }
// }

// // ─────────────────────────────────────────────────────────────────
// // getEmbeddingProvider
// // ─────────────────────────────────────────────────────────────────

// export const EMBEDDING_SOURCES: Record<string, string> = {
//   codebase: "qwen/qwen3-embedding-8b",
//   coder: "qwen/qwen3-embedding-8b",
//   "rag/documentSummary": "qwen/qwen3-embedding-8b",
//   "graph/cypher": "qwen/qwen3-embedding-8b",
//   "graph/entity": "qwen/qwen3-embedding-8b",
//   "graph/extract": "qwen/qwen3-embedding-8b",
//   comment: "qwen/qwen3-embedding-8b",
//   engagement: "qwen/qwen3-embedding-8b",
//   tribe_comment: "qwen/qwen3-embedding-8b",
//   tribe_engage: "qwen/qwen3-embedding-8b",
//   "ai/tribe/comment": "qwen/qwen3-embedding-8b",
//   "moltbook/comment": "qwen/qwen3-embedding-8b",
//   "moltbook/engagement": "qwen/qwen3-embedding-8b",
//   news: "qwen/qwen3-embedding-8b",
//   default: "qwen/qwen3-embedding-8b",
// }

// export type getModelProviderOptions = {
//   app?: app | null
//   user?: user | null
//   guest?: guest | null
//   source?: string
//   isEffect?: boolean
// }

// export async function getEmbeddingProvider({
//   app,
//   user,
//   guest,
//   isEffect,
//   source,
// }: getModelProviderOptions): Promise<{
//   provider?: ReturnType<typeof createOpenRouter>
//   modelId?: string
//   textEmbeddingModel?: any
// }> {
//   const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
//   const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

//   const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
//   const orKey = byokKey ?? safeDecrypt(app?.apiKeys?.openrouter) ?? systemKey

//   const modelId =
//     EMBEDDING_SOURCES[source || "default"] ??
//     EMBEDDING_SOURCES.default ??
//     "qwen/qwen3-embedding-8b"

//   const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1

//   const provider = isEffect
//     ? undefined
//     : creditsLeft === 0 || !orKey
//       ? undefined
//       : createOpenRouter({ apiKey: orKey })

//   return {
//     provider,
//     modelId,
//     textEmbeddingModel: modelId
//       ? provider?.textEmbeddingModel(modelId)
//       : undefined,
//   }
// }

// // ─────────────────────────────────────────────────────────────────
// // getMediaAPIKeys — image/replicate/fal key resolver
// // ─────────────────────────────────────────────────────────────────

// export const getMediaAPIKeys = ({
//   app,
//   user,
//   guest,
// }: {
//   app?: app | null
//   user?: user | null
//   guest?: guest | null
// }) => {
//   const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
//   const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

//   const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
//   const appKey = safeDecrypt(app?.apiKeys?.openrouter)
//   const or = byokKey ?? appKey ?? systemKey

//   const systemReplicateKey = isFreeTier(app)
//     ? process.env.REPLICATE_API_KEY
//     : undefined
//   const appReplicateKey = safeDecrypt(app?.apiKeys?.replicate)
//   const replicate = byokKey ?? appReplicateKey ?? systemReplicateKey

//   const systemFalKey = isFreeTier(app) ? process.env.FAL_API_KEY : undefined
//   const appFalKey = safeDecrypt(app?.apiKeys?.fal)
//   const fal = byokKey ?? appFalKey ?? systemFalKey

//   return { fal, or, replicate }
// }

// export const chopStick = async <T extends sushi>(
//   payload: ramen,
// ): Promise<sushi | undefined> => {
//   // Build app identification conditions
//   const llm = payload?.llm
//   const appConditions = []

//   const {
//     id,
//     slug,
//     userId,
//     guestId,
//     storeId,
//     storeSlug,
//     storeDomain,
//     ownerId,
//     threadId,
//     isSystem,
//     role,
//     exclude,
//     name,
//     include: includeInternal,
//     join,
//     agent,
//     buildPrompt,
//     messageCount,
//   } = payload
//   const cacheKey = makeCacheKey(payload)
//   const skipCache = payload.skipCache || !includeInternal?.includes("store")
//   if (!skipCache) {
//     const cached = await getCache<sushi>(cacheKey)
//     if (cached) return cached
//   }

//   const depth = payload.depth || payload.includes("store") ? 1 : 0

//   const defaultInclude =
//     depth > 0
//       ? ["characterProfiles", "highlights", "store"]
//       : ["characterProfiles"]

//   const include = [...defaultInclude, ...(includeInternal || [])].filter(
//     (i) => !exclude?.includes(i as keyof sushi),
//   ) as (keyof sushi)[]

//   // Agent-driven join: agent.metadata.join overrides caller-supplied join
//   // which itself overrides defaults. Resolution order: agent > payload > defaults.
//   // const agentJoin = buildPrompt ? (agent as any)?.metadata?.join : null

//   if (name) {
//     appConditions.push(
//       eq(apps.name, name as "Atlas" | "Peach" | "Vault" | "Bloom"),
//     )
//   }

//   if (slug) {
//     appConditions.push(eq(apps.slug, slug))
//   }

//   if (ownerId) {
//     appConditions.push(or(eq(apps.userId, ownerId), eq(apps.guestId, ownerId)))
//   }

//   if (id) {
//     appConditions.push(eq(apps.id, id))
//   }

//   if (role) {
//     appConditions.push(eq(users.role, role))
//   }

//   if (storeId) {
//     appConditions.push(eq(apps.storeId, storeId))
//   }

//   if (storeSlug) {
//     appConditions.push(eq(stores.slug, storeSlug))
//   }

//   if (storeDomain) {
//     appConditions.push(eq(stores.domain, storeDomain))
//   }
//   if (isSystem) {
//     appConditions.push(eq(stores.isSystem, isSystem))
//   }

//   if (isSystem === false) {
//     appConditions.push(not(stores.isSystem))
//   }

//   // Build access conditions (can user/guest access this app?)
//   // Skip access check when searching by ID or ownerId (direct lookup)
//   const accessConditions =
//     id || ownerId
//       ? undefined
//       : or(
//           // User's own apps
//           userId ? eq(apps.userId, userId) : undefined,
//           // Guest's own apps
//           guestId ? eq(apps.guestId, guestId) : undefined,
//           eq(apps.visibility, "public"),
//         )

//   // Build query with conditional store join
//   const query = db
//     .select({
//       app: apps,
//       user: users,
//       guest: guests,
//       store: stores,
//     })
//     .from(apps)
//     .leftJoin(users, eq(apps.userId, users.id))
//     .leftJoin(guests, eq(apps.guestId, guests.id))
//     .leftJoin(stores, eq(apps.storeId, stores.id))

//   const [app] = await query.where(
//     and(
//       appConditions.length > 0 ? and(...appConditions) : undefined,
//       accessConditions,
//     ),
//   )

//   if (!app) return undefined

//   // Determine if user is owner from query result
//   const isOwner =
//     (userId && app.app.userId === userId) ||
//     (guestId && app.app.guestId === guestId)

//   // Phase 1b: dnaUser + dnaGuest in parallel (both depend only on dnaThread)

//   // if (app.store && app.store.slug !== app.app.storeSlug) {
//   //   await updateApp({ id: app.app.id, storeSlug: app.store.slug })
//   // }

//   const fullUser = llm
//     ? await getUser({
//         id: userId,
//       })
//     : undefined

//   const fullGuest =
//     llm && !fullUser
//       ? await getGuest({
//           id: guestId,
//         })
//       : undefined
//   // Get DNA thread (app's main thread)
//   const dnaThread = app.app.mainThreadId
//     ? await db
//         .select()
//         .from(threads)
//         .where(eq(threads.id, app.app.mainThreadId))
//         .limit(1)
//         .then((r) => r.at(0))
//     : undefined
//   const [dnaUser, dnaGuest] = await Promise.all([
//     dnaThread?.userId
//       ? db
//           .select()
//           .from(users)
//           .where(eq(users.id, dnaThread.userId))
//           .limit(1)
//           .then((r) => r.at(0))
//       : Promise.resolve(undefined),
//     dnaThread?.guestId
//       ? db
//           .select()
//           .from(guests)
//           .where(eq(guests.id, dnaThread.guestId))
//           .limit(1)
//           .then((r) => r.at(0))
//       : Promise.resolve(undefined),
//   ])

//   const isCharacterProfileEnabled =
//     dnaUser?.characterProfilesEnabled ||
//     dnaGuest?.characterProfilesEnabled ||
//     isOwner ||
//     false

//   const hasDNA =
//     join?.characterProfile?.dna ||
//     join?.memories?.dna ||
//     join?.instructions?.dna ||
//     join?.placeholders?.dna

//   const canDNA = hasDNA && isCharacterProfileEnabled

//   let generativeModel
//   let embeddingModel
//   // Phase 2: All independent queries in parallel (concurrency limited to 5)
//   const limit = pLimit(15)
//   const [
//     /*1*/ userMemories,
//     /*2*/ userCharacterProfiles,
//     /*3*/ appCharacterProfiles,
//     /*4*/ threadCharacterProfiles,
//     /*5*/ dnaCharacterProfiles,
//     /*6*/ threadMemories,
//     /*7*/ appMemories,
//     /*8*/ dnaMemories,
//     /*9*/ threadPlaceholders,
//     /*10*/ userPlaceholders,
//     /*11*/ appPlaceholders,
//     /*12*/ dnaPlaceholders,
//     /*13*/ userInstructions,
//     /*14*/ appInstructions,
//     /*15*/ threadInstructions,
//     /*16*/ dnaInstructions,
//     /*17*/ storeApps,
//   ] = await Promise.all([
//     // 1 user memories
//     limit(() =>
//       join?.memories?.user
//         ? getMemories({
//             pageSize: join.memories.user,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 2 user character profiles
//     limit(() =>
//       include.includes("characterProfiles")
//         ? getCharacterProfiles({
//             limit: join?.characterProfile?.user ?? 5,
//             userId,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 3 app character profiles
//     limit(() =>
//       include.includes("characterProfiles")
//         ? getCharacterProfiles({
//             limit: join?.characterProfile?.app ?? 3,
//             userId,
//             appId: app.app.id,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 4 thread character profiles
//     limit(() =>
//       include.includes("characterProfiles") && threadId
//         ? getCharacterProfiles({
//             limit: join?.characterProfile?.thread ?? 3,
//             userId,
//             threadId,
//             appId: app.app.id,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 5 dna character profiles (app-owner profiles, visible to everyone)
//     limit(() =>
//       dnaThread && isCharacterProfileEnabled
//         ? getCharacterProfiles({
//             limit: join?.characterProfile?.dna ?? 3,
//             appId: app.app.id,
//             isAppOwner: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 6 thread memories
//     limit(() =>
//       join?.memories?.thread && threadId
//         ? getMemories({
//             threadId,
//             pageSize: join.memories.thread,
//             userId,
//             guestId,
//             appId: app.app.id,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 7 app memories
//     limit(() =>
//       join?.memories?.app
//         ? getMemories({
//             pageSize: join.memories.app,
//             appId: app.app.id,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 8 dna memories
//     limit(() =>
//       isCharacterProfileEnabled && join?.memories?.dna && dnaThread
//         ? getMemories({
//             threadId: dnaThread.id,
//             pageSize: join.memories.dna,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 9 thread placeholders
//     limit(() =>
//       join?.placeholders?.thread && threadId
//         ? getPlaceHolders({
//             threadId,
//             appId: app.app.id,
//             pageSize: join.placeholders.thread,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 10 user placeholders
//     limit(() =>
//       join?.placeholders?.user
//         ? getPlaceHolders({
//             pageSize: join.placeholders.user,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 11 app placeholders
//     limit(() =>
//       isCharacterProfileEnabled && join?.placeholders?.app
//         ? getPlaceHolders({
//             appId: app.app.id,
//             userId,
//             guestId,
//             pageSize: join.placeholders.app,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 12 dna placeholders
//     limit(() =>
//       join?.placeholders?.dna && dnaThread && isCharacterProfileEnabled
//         ? getPlaceHolders({
//             threadId: dnaThread.id,
//             pageSize: join.placeholders.dna,
//             userId: dnaThread.userId || undefined,
//             guestId: dnaThread.guestId || undefined,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 13 user instructions
//     limit(() =>
//       join?.instructions?.user && (userId || guestId)
//         ? getInstructions({
//             userId,
//             guestId,
//             pageSize: join.instructions.user,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 14 app instructions
//     limit(() =>
//       join?.instructions?.app
//         ? getInstructions({
//             appId: app.app.id,
//             pageSize: join.instructions.app,
//             userId,
//             guestId,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 15 thread instructions
//     limit(() =>
//       join?.instructions?.thread && threadId
//         ? getInstructions({
//             threadId,
//             userId,
//             guestId,
//             appId: app.app.id,
//             scatterAcrossApps: true,
//             pageSize: join.instructions.thread,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 16 dna instructions
//     limit(() =>
//       join?.instructions?.dna && dnaThread && isCharacterProfileEnabled
//         ? getInstructions({
//             appId: app.app.id,
//             threadId: dnaThread.id,
//             pageSize: join.instructions.dna,
//             userId: dnaThread.userId || undefined,
//             guestId: dnaThread.guestId || undefined,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),

//     // 17 store apps
//     limit(async () => {
//       if (depth <= 0) {
//         return Promise.resolve(undefined)
//       }
//       if (!include.includes("store")) {
//         return Promise.resolve(undefined)
//       }

//       return getStoreApps({
//         ...payload,
//       }).then((a) => a?.store?.apps)
//     }),
//     // 18 & 19: resolved below after Promise.all — model/embedding need full app context
//   ])

//   const beast = storeApps?.find((a) => a?.id === app.store?.appId)

//   // Resolve LLM provider eagerly — app, user, guest are all available here
//   const [resolvedModel, resolvedEmbedding] = llm
//     ? await Promise.all([
//         getModelProvider({
//           app: app.app,
//           modelId: payload.modelId,
//           name: agent?.name,
//           job: payload,
//           swarm: payload?.swarm,
//           guest,
//           source: payload.source || "chopstick",
//         }),
//         getEmbeddingProvider({
//           app: app.app,
//           modelId: payload.modelId,
//           name: agent?.name,
//           job: payload,
//           swarm: payload?.swarm,
//           guest,
//           source: payload.source || "chopstick",
//         }),
//       ])
//     : [undefined, undefined]

//   // Build result object
//   const result = {
//     ...(toSafeApp({
//       app: app.app,
//       userId,
//       guestId,
//     }) as unknown as app),
//     user: toSafeUser({ user: fullUser || app.user }),
//     guest: toSafeGuest({ guest: fullGuest || app.guest }),

//     store: app.store
//       ? {
//           name: app.store.name,
//           title: app.store.title,
//           description: app.store.description,
//           slug: app.store.slug,
//           images: app.store.images,
//           excludeGridApps: app.store.excludeGridApps,
//           isSystem: app.store.isSystem,
//           domain: app.store.isSystem,
//           appId: app.store.appId,
//           userId: app.store.appId,
//           guestId: app.store.guestId,
//           parentStoreId: app.store.parentStoreId,
//           visibility: app.store.visibility,
//           createdOn: app.store.createdOn,
//           updatedOn: app.store.updatedOn,
//           app: toSafeApp({ app: beast }) ?? undefined,
//           apps: !include.includes("store")
//             ? []
//             : (storeApps?.filter(Boolean).map((a) => toSafeApp({ app: a })) ??
//               []),
//         }
//       : undefined,
//     instructions: threadInstructions?.length
//       ? threadInstructions
//       : appInstructions?.length
//         ? appInstructions
//         : app.app.highlights,
//     // Features
//     tips: app.app.tips,
//     highlights: !include.includes("highlights") ? null : app.app.highlights,
//     features: !include.includes("features") ? null : app.app.features,
//     systemPrompt: !include.includes("systemPrompt")
//       ? null
//       : app.app.systemPrompt,
//     // Joined data
//     userMemories,
//     appMemories,
//     dnaMemories,

//     userPlaceholders,
//     appPlaceholders,
//     dnaPlaceholders,
//     threadPlaceholders,
//     threadMemories,
//     threadInstructions,
//     userInstructions,
//     userCharacterProfiles,
//     appInstructions,
//     threadCharacterProfiles,
//     dnaCharacterProfiles,
//     appCharacterProfiles,
//     characterProfiles: [
//       ...(threadCharacterProfiles ?? []),
//       ...(appCharacterProfiles ?? []),
//       ...(dnaCharacterProfiles ?? []),
//     ].filter(Boolean),
//     dnaInstructions,
//     ai: llm
//       ? {
//           agent,
//           model: resolvedModel ?? null,
//           dnaContext: buildPrompt?.includes("dna")
//             ? await getAppDNAContext(app)
//             : undefined,
//           embedding: resolvedEmbedding ?? null,
//           promptSections: undefined as any, // filled below if buildPrompt
//           payload: {
//             agentName: agent?.name,
//             modelId: resolvedModel?.modelId,
//             join: join,
//             keySource: resolvedModel?.isBYOK
//               ? "byok"
//               : resolvedModel?.isFree
//                 ? "free"
//                 : "system_key",
//             isDegraded: resolvedModel?.isDegraded,
//             resolvedAt: new Date().toISOString(),
//           },
//         }
//       : undefined,
//   } as unknown as sushi

//   function containsPersonalInfo(content: string): boolean {
//     if (!content) return false

//     // PII Patterns to filter
//     const sensitivePatterns = [
//       // Email addresses
//       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
//       // Phone numbers (various formats)
//       /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
//       // Credit card numbers (basic pattern)
//       /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
//       // SSN patterns
//       /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
//       // API keys/tokens (common patterns)
//       /\b(sk-|pk-|bearer\s|token\s|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_-]{20,}/i,
//       // Password mentions
//       /\b(password|passwd|pwd)\s*[:=]\s*\S+/i,
//       // Private/internal notes
//       /\b(private|confidential|internal only|do not share)\b/i,
//       // User-specific identifiers that look like GUIDs with personal context
//       /\b(userId|user_id|guestId|guest_id)\s*[:=]\s*[a-f0-9-]{36}/i,
//     ]

//     return sensitivePatterns.some((pattern) => pattern.test(content))
//   }

//   setCache(cacheKey, result, isOwner ? 60 * 5 : 60 * 60)

//   // Cross-seed public cache if owner-specific request
//   if (isOwner) {
//     const publicCacheKey = makeCacheKey({ payload, public: true })
//     setCache(publicCacheKey, { ...toSafeApp({ app: result }) }, 60 * 60)
//   }

//   return {
//     ...result,
//     // dnaArtifacts,
//   }
// }

// export const getApp = async ({
//   id,
//   slug,
//   userId,
//   guestId,
//   isSafe = true,
// }: ramen): Promise<app | undefined> => {
//   // Build app identification conditions
//   const appConditions = []

//   if (slug) {
//     appConditions.push(eq(apps.slug, slug))
//   }

//   if (id) {
//     appConditions.push(eq(apps.id, id))
//   }

//   const [app] = await db
//     .select({
//       app: apps,
//       user: users,
//       guest: guests,
//     })
//     .from(apps)
//     .leftJoin(users, eq(apps.userId, users.id))
//     .leftJoin(guests, eq(apps.guestId, guests.id))
//     .where(and(...appConditions))

//   if (!app) return undefined

//   return (
//     isSafe
//       ? (toSafeApp({
//           app: app.app,
//           userId,
//           guestId,
//         }) as app)
//       : { ...app.app }
//   ) as app
// }
