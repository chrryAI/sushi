/**
 * ChopStick Expert - Payload Optimizer
 *
 * Senkron, deterministik payload optimizasyonu.
 * JSON çıktı - AI her şeyi görsün.
 */

// ramen tipi - chopStick payload'i için
type JoinConfig = {
  memories?: { user?: number; app?: number; dna?: number; thread?: number }
  instructions?: { user?: number; app?: number; dna?: number; thread?: number }
  characterProfile?: {
    user?: number
    app?: number
    dna?: number
    thread?: number
  }
  placeholders?: { user?: number; app?: number; dna?: number; thread?: number }
}

type Ramen = {
  id?: string
  slug?: string
  join?: JoinConfig
  depth?: number
  [key: string]: any
}

// =============================================================================
// MODEL PRICING & CAPABILITIES
// =============================================================================

export const modelPricing = {
  "deepseek/deepseek-v3.2": {
    input: 0.28,
    output: 0.4,
    tools: true,
    analyze: false,
  },
  "deepseek/deepseek-chat": {
    input: 0.15,
    output: 0.45,
    tools: true,
    analyze: false,
  },
  "anthropic/claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    tools: true,
    analyze: true,
  },
  "google/gemini-3.1-pro-preview": {
    input: 0.35,
    output: 1.05,
    tools: true,
    analyze: true,
  },
  "deepseek/deepseek-v3.2-thinking": {
    input: 0.28,
    output: 0.4,
    tools: true,
    analyze: false,
  },
  "qwen/qwen3.6-plus": { input: 0.3, output: 0.8, tools: true, analyze: true },
  "minimax/minimax-m2.5": {
    input: 0.3,
    output: 1.1,
    tools: true,
    analyze: false,
  },
  "minimax/minimax-m2.7": {
    input: 0.3,
    output: 1.2,
    tools: true,
    analyze: false,
  },
  "x-ai/grok-4.1-fast": { input: 0.5, output: 2.0, tools: true, analyze: true },
  "perplexity/sonar-pro": {
    input: 2.0,
    output: 8.0,
    tools: false,
    analyze: false,
  },
  "openrouter/free": { input: 0.0, output: 0.0, tools: false, analyze: false },
  "openai/gpt-oss-120b:free": {
    input: 0.0,
    output: 0.073,
    tools: false,
    analyze: true,
  },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    input: 0.0,
    output: 0.0,
    tools: true,
    analyze: false,
  },
  "gpt-4o": { input: 2.5, output: 10.0, tools: true, analyze: true },
  "gpt-4o-mini": { input: 0.15, output: 0.6, tools: true, analyze: true },
  "openai/gpt-5.4": { input: 2.5, output: 15.0, tools: true, analyze: true },
} as const

export type ModelId = keyof typeof modelPricing

export interface ModelInfo {
  modelId: string
  inputPrice: number
  outputPrice: number
  hasTools: boolean
  canAnalyze: boolean
  reason: string
}

// =============================================================================
// JOIN WEIGHTS
// =============================================================================

export interface JoinWeights {
  memories: { user: number; app: number; dna: number; thread: number }
  instructions: { user: number; app: number; dna: number; thread: number }
  characterProfile: { user: number; app: number; dna: number; thread: number }
  placeholders: { user: number; app: number; dna: number; thread: number }
}

export interface ChopStickDecision {
  join: JoinWeights
  depth: number
  model: ModelInfo
  reasoning: string[]
}

// =============================================================================
// STORE APPS KNOWLEDGE BASE - JSON OUTPUT
// =============================================================================

export interface StoreAppKnowledge {
  /** App temel bilgileri */
  app: {
    id: string
    name: string
    slug: string
    description?: string
    systemPrompt?: string
  }
  /** Context configuration */
  context: {
    join: JoinWeights
    depth: number
    isMainApp: boolean
  }
  /** Ne kadar data çekilecek */
  limits: {
    memories: number
    instructions: number
    messages: number
  }
}

export interface StoreKnowledgeBase {
  /** Tüm store apps */
  apps: StoreAppKnowledge[]
  /** Ana app (mevcut request) */
  mainApp: StoreAppKnowledge
  /** Diğer apps (context için) */
  contextApps: StoreAppKnowledge[]
  /** Toplam context boyutu tahmini */
  estimatedTokens: number
  /** Configuration metadata */
  meta: {
    totalApps: number
    reasoning: string[]
    timestamp: string
  }
  /** DNA Artifacts for context */
  artifacts?: Array<{
    id: string
    content: string
    type: string
    createdAt: string
  }>
  /** DNA Memories for context */
  memories?: Array<{
    id: string
    content: string
    type: string
    createdAt: string
  }>
  /** Current task info */
  task?: {
    id: string
    title: string
    description?: string
    status: string
  }
  /** Task messages/work history */
  messages?: {
    messages: Array<{
      id: string
      content: string
      role: string
      createdAt: string
      mood?: {
        type: string
      }
    }>
  }
}

// =============================================================================
// CONTEXT INPUT
// =============================================================================

export interface ChopStickContext {
  appType?:
    | "chat"
    | "tribe"
    | "kanban"
    | "retro"
    | "swarm"
    | "focus"
    | "default"
  messageCount?: number
  hasTimer?: boolean
  hasDNA?: boolean
  hasKanban?: boolean
  hasRetro?: boolean
  memoriesCount?: number
  instructionsCount?: number
  isBackgroundJob?: boolean

  // Admin/Sato mode
  isAdmin?: boolean
  isSatoMode?: boolean

  // Model selection
  defaultModelId?: string
  allowsModelSwap?: boolean
  needsTools?: boolean
  needsAnalysis?: boolean
  preferFree?: boolean
  creditsLeft?: number

  // Store apps
  storeAppIds?: string[]
  mainAppId?: string
}

// =============================================================================
// PRESETS
// =============================================================================

export const presets: Record<string, ChopStickDecision> = {
  minimal: {
    join: {
      memories: { user: 1, app: 1, dna: 0, thread: 1 },
      instructions: { user: 1, app: 1, dna: 0, thread: 1 },
      characterProfile: { user: 0, app: 0, dna: 0, thread: 0 },
      placeholders: { user: 1, app: 1, dna: 0, thread: 1 },
    },
    depth: 0,
    model: {
      modelId: "nvidia/nemotron-3-super-120b-a12b:free",
      inputPrice: 0,
      outputPrice: 0,
      hasTools: true,
      canAnalyze: false,
      reason: "Free model, minimal context",
    },
    reasoning: ["Minimal preset"],
  },

  balanced: {
    join: {
      memories: { user: 3, app: 2, dna: 1, thread: 3 },
      instructions: { user: 2, app: 2, dna: 1, thread: 2 },
      characterProfile: { user: 1, app: 1, dna: 0, thread: 1 },
      placeholders: { user: 2, app: 2, dna: 1, thread: 2 },
    },
    depth: 1,
    model: {
      modelId: "deepseek/deepseek-chat",
      inputPrice: 0.15,
      outputPrice: 0.45,
      hasTools: true,
      canAnalyze: false,
      reason: "Balanced cost/performance",
    },
    reasoning: ["Balanced preset"],
  },

  rich: {
    join: {
      memories: { user: 8, app: 5, dna: 3, thread: 6 },
      instructions: { user: 5, app: 4, dna: 2, thread: 4 },
      characterProfile: { user: 2, app: 2, dna: 1, thread: 2 },
      placeholders: { user: 3, app: 3, dna: 2, thread: 3 },
    },
    depth: 2,
    model: {
      modelId: "deepseek/deepseek-v3.2",
      inputPrice: 0.28,
      outputPrice: 0.4,
      hasTools: true,
      canAnalyze: false,
      reason: "Rich context",
    },
    reasoning: ["Rich preset"],
  },

  /** Admin/Sato mode - maximum user context */
  admin: {
    join: {
      memories: { user: 15, app: 5, dna: 3, thread: 8 },
      instructions: { user: 10, app: 4, dna: 2, thread: 5 },
      characterProfile: { user: 3, app: 2, dna: 1, thread: 2 },
      placeholders: { user: 5, app: 3, dna: 2, thread: 4 },
    },
    depth: 2,
    model: {
      modelId: "anthropic/claude-sonnet-4-6",
      inputPrice: 3.0,
      outputPrice: 15.0,
      hasTools: true,
      canAnalyze: true,
      reason: "Admin mode: maximum context for Sato reports",
    },
    reasoning: ["Admin preset: Sato mode activated"],
  },

  kanban: {
    join: {
      memories: { user: 4, app: 6, dna: 2, thread: 3 },
      instructions: { user: 3, app: 6, dna: 1, thread: 3 },
      characterProfile: { user: 1, app: 2, dna: 1, thread: 1 },
      placeholders: { user: 2, app: 4, dna: 1, thread: 2 },
    },
    depth: 1,
    model: {
      modelId: "deepseek/deepseek-chat",
      inputPrice: 0.15,
      outputPrice: 0.45,
      hasTools: true,
      canAnalyze: false,
      reason: "Kanban needs tools",
    },
    reasoning: ["Kanban preset"],
  },

  tribe: {
    join: {
      memories: { user: 5, app: 3, dna: 2, thread: 8 },
      instructions: { user: 4, app: 3, dna: 1, thread: 6 },
      characterProfile: { user: 2, app: 2, dna: 1, thread: 2 },
      placeholders: { user: 3, app: 3, dna: 1, thread: 4 },
    },
    depth: 2,
    model: {
      modelId: "deepseek/deepseek-v3.2",
      inputPrice: 0.28,
      outputPrice: 0.4,
      hasTools: true,
      canAnalyze: false,
      reason: "Tribe needs thread context",
    },
    reasoning: ["Tribe preset"],
  },

  retro: {
    join: {
      memories: { user: 8, app: 2, dna: 1, thread: 5 },
      instructions: { user: 6, app: 2, dna: 1, thread: 4 },
      characterProfile: { user: 3, app: 1, dna: 0, thread: 2 },
      placeholders: { user: 4, app: 2, dna: 1, thread: 3 },
    },
    depth: 1,
    model: {
      modelId: "anthropic/claude-sonnet-4-6",
      inputPrice: 3.0,
      outputPrice: 15.0,
      hasTools: true,
      canAnalyze: true,
      reason: "Retro benefits from quality",
    },
    reasoning: ["Retro preset"],
  },

  background: {
    join: {
      memories: { user: 8, app: 5, dna: 3, thread: 6 },
      instructions: { user: 5, app: 4, dna: 2, thread: 4 },
      characterProfile: { user: 2, app: 2, dna: 1, thread: 2 },
      placeholders: { user: 3, app: 3, dna: 2, thread: 3 },
    },
    depth: 2,
    model: {
      modelId: "deepseek/deepseek-v3.2",
      inputPrice: 0.28,
      outputPrice: 0.4,
      hasTools: true,
      canAnalyze: false,
      reason: "Background job: more context",
    },
    reasoning: ["Background preset"],
  },

  free: {
    join: {
      memories: { user: 2, app: 1, dna: 0, thread: 2 },
      instructions: { user: 1, app: 1, dna: 0, thread: 1 },
      characterProfile: { user: 0, app: 0, dna: 0, thread: 0 },
      placeholders: { user: 1, app: 1, dna: 0, thread: 1 },
    },
    depth: 0,
    model: {
      modelId: "nvidia/nemotron-3-super-120b-a12b:free",
      inputPrice: 0,
      outputPrice: 0,
      hasTools: true,
      canAnalyze: false,
      reason: "Zero cost",
    },
    reasoning: ["Free preset"],
  },
}

export type PresetName = keyof typeof presets

// =============================================================================
// MODEL SWAP
// =============================================================================

const sushiSwaps: Record<string, string> = {
  "deepseek/deepseek-v3.2": "nvidia/nemotron-3-super-120b-a12b:free",
  "deepseek/deepseek-r1": "qwen/qwen3.6-plus",
  "minimax/minimax-m2.5": "qwen/qwen3.6-plus",
  "minimax/minimax-m2.7": "qwen/qwen3.6-plus",
}

function swapModel(
  modelId: string,
  preferFree: boolean,
): { modelId: string; swapped: boolean } {
  return { modelId, swapped: false }
  // if (preferFree) {
  //   return {
  //     modelId: "nvidia/nemotron-3-super-120b-a12b:free",
  //     swapped: modelId !== "nvidia/nemotron-3-super-120b-a12b:free",
  //   }
  // }
  // const swapped = sushiSwaps[modelId]
  // return swapped
  //   ? { modelId: swapped, swapped: true }
  //   : { modelId, swapped: false }
}

// =============================================================================
// OPTIMIZE - Main Function
// =============================================================================

export function optimizeChopStick(ctx: ChopStickContext): ChopStickDecision {
  const reasoning: string[] = []

  // 1. Base preset seç - default balanced
  let base: ChopStickDecision = presets.balanced!

  // Admin/Sato mode öncelikli
  if (ctx.isAdmin || ctx.isSatoMode) {
    base = presets.admin!
    reasoning.push("Admin/Sato mode: maximum user context")
  } else if (ctx.isBackgroundJob) {
    base = presets.background!
  } else if (ctx.hasRetro) {
    base = presets.retro!
  } else if (ctx.appType === "kanban" || ctx.hasKanban) {
    base = presets.kanban!
  } else if (ctx.appType === "tribe") {
    base = presets.tribe!
  }

  // 2. Düşük kredi = free
  if ((ctx.creditsLeft ?? 10) < 3) {
    base = presets.free!
    reasoning.push(`Low credits: ${ctx.creditsLeft}`)
  }

  // 3. Derin thread
  let depth = base.depth
  if ((ctx.messageCount ?? 0) > 50) {
    depth = 2
    reasoning.push(`Deep thread: ${ctx.messageCount}`)
  }

  // 4. DNA boost
  const join = { ...base.join }
  if (ctx.hasDNA) {
    join.memories.dna = Math.min(5, join.memories.dna + 2)
    join.instructions.dna = Math.min(3, join.instructions.dna + 1)
    reasoning.push("DNA boost")
  }

  // 5. Timer boost
  if (ctx.hasTimer) {
    join.memories.app = Math.min(10, join.memories.app + 1)
    reasoning.push("Timer boost")
  }

  // 6. Model seçimi
  let modelId = ctx.defaultModelId || base.model.modelId

  if (ctx.needsTools && !modelPricing[modelId as ModelId]?.tools) {
    modelId = "deepseek/deepseek-chat"
    reasoning.push("Tool requirement")
  }

  if (ctx.needsAnalysis && !modelPricing[modelId as ModelId]?.analyze) {
    modelId = "anthropic/claude-sonnet-4-6"
    reasoning.push("Analysis requirement")
  }

  if (ctx.allowsModelSwap) {
    const swap = swapModel(
      modelId,
      ctx.preferFree || (ctx.creditsLeft ?? 10) < 5,
    )
    if (swap.swapped) {
      modelId = swap.modelId
      reasoning.push(`Sushi swap`)
    }
  }

  const pricing = modelPricing[modelId as ModelId]

  return {
    join,
    depth,
    model: {
      modelId,
      inputPrice: pricing?.input ?? 1,
      outputPrice: pricing?.output ?? 2,
      hasTools: pricing?.tools ?? true,
      canAnalyze: pricing?.analyze ?? false,
      reason: reasoning.join(", ") || "Default",
    },
    reasoning: [...base.reasoning, ...reasoning],
  }
}

// =============================================================================
// STORE KNOWLEDGE BASE BUILDER - JSON OUTPUT
// =============================================================================

/**
 * Store apps için knowledge base oluştur - JSON output
 *
 * @example
 * ```ts
 * const kb = buildStoreKnowledgeBase({
 *   mainAppId: "app-123",
 *   storeAppIds: ["app-123", "app-456", "app-789"],
 *   appType: "kanban",
 *   hasDNA: true,
 * })
 *
 * // Direkt JSON olarak kullan
 * return Response.json(kb)
 * ```
 */
export function buildStoreKnowledgeBase(ctx: {
  mainAppId: string
  storeAppIds: string[]
  appType?: ChopStickContext["appType"]
  hasDNA?: boolean
  hasTimer?: boolean
  hasKanban?: boolean
  messageCount?: number
  isBackgroundJob?: boolean
}): StoreKnowledgeBase {
  const reasoning: string[] = []

  // Main app için zengin context
  const mainConfig = optimizeChopStick({
    appType: ctx.appType,
    hasDNA: ctx.hasDNA,
    hasTimer: ctx.hasTimer,
    hasKanban: ctx.hasKanban,
    messageCount: ctx.messageCount,
    isBackgroundJob: ctx.isBackgroundJob,
  })

  // Context apps için lighter context
  const contextConfig = optimizeChopStick({
    appType: "default",
    isBackgroundJob: true, // lighter
  })

  // Build apps array
  const apps: StoreAppKnowledge[] = ctx.storeAppIds.map((id, index) => {
    const isMain = id === ctx.mainAppId
    const config = isMain ? mainConfig : contextConfig

    // Her app için limitler
    const limits = isMain
      ? { memories: 15, instructions: 10, messages: 10 }
      : { memories: 5, instructions: 3, messages: 3 }

    return {
      app: {
        id,
        name: `App-${index + 1}`, // Caller doldurur
        slug: `app-${id.slice(0, 6)}`,
      },
      context: {
        join: config.join,
        depth: config.depth,
        isMainApp: isMain,
      },
      limits,
    }
  })

  const mainApp = apps.find((a) => a.app.id === ctx.mainAppId) || apps[0]!
  const contextApps = apps.filter((a) => a.app.id !== ctx.mainAppId)

  // Token estimate (rough)
  const estimatedTokens = apps.reduce((sum, app) => {
    const memTokens = app.limits.memories * 100
    const instTokens = app.limits.instructions * 200
    const msgTokens = app.limits.messages * 150
    return sum + memTokens + instTokens + msgTokens
  }, 0)

  if (ctx.hasDNA) reasoning.push("DNA context included")
  if (ctx.hasTimer) reasoning.push("Timer context included")
  if (ctx.hasKanban) reasoning.push("Kanban context included")

  return {
    apps,
    mainApp,
    contextApps,
    estimatedTokens,
    meta: {
      totalApps: apps.length,
      reasoning,
      timestamp: new Date().toISOString(),
    },
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/** Preset al */
export function getPreset(name: PresetName): ChopStickDecision {
  return presets[name] ?? presets.balanced!
}

/** Sadece join weights */
export function getJoinWeights(ctx: ChopStickContext): JoinWeights {
  return optimizeChopStick(ctx).join
}

/** Ramen payload builder */
export function buildRamenPayload(
  base: Omit<Ramen, "join" | "depth">,
  ctx: ChopStickContext,
): Ramen & {
  _meta: { modelId: string; estimatedCost: number; reasoning: string[] }
} {
  const opt = optimizeChopStick(ctx)
  const estimatedCost = 2 * (opt.model.inputPrice + opt.model.outputPrice) // ~2k tokens

  return {
    ...base,
    join: opt.join,
    depth: opt.depth,
    _meta: {
      modelId: opt.model.modelId,
      estimatedCost: Math.round(estimatedCost * 1000) / 1000,
      reasoning: opt.reasoning,
    },
  }
}
