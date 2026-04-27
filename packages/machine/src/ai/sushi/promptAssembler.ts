/**
 * PromptAssembler — Golden-ratio-aware system prompt builder
 *
 * Takes chopStick output (sushi) + member/guest state and assembles
 * the final system prompt with conditional sections based on:
 *  - golden ratio feature triggers
 *  - user/guest enabled flags
 *  - agent-driven join weights
 */
import {
  evaluateGoldenRatio,
  getNextFibonacciThreshold,
  type goldenFeature,
} from "../../agent/goldenRatio"
import {
  section as buildSection,
  buildSystemPromptV2,
  type PromptSection,
} from "./promptBuilder"

// ─── Types ───────────────────────────────────────────────────────

export interface PromptAssemblyParams {
  /** The enriched app object from chopStick */
  app: any // sushi type — kept loose for cross-package compat
  /** User model (if authenticated) */
  member?: any
  /** Guest model (if anonymous) */
  guest?: any
  /** Agent config driving join weights */
  agent?: any
  /** Current thread metadata */
  thread?: any
  /** Raw base system prompt (template) */
  baseSystemPrompt: string
  /** Additional context sections supplied by caller */
  extraSections?: Record<string, string>
  /** Conversation metadata for golden ratio evaluation */
  threadMessageCount: number
  userThreadCount: number
  /** Features already triggered (persisted on user/guest) */
  lastTriggeredFeatures?: goldenFeature[]
  /** Override: force enable/disable specific features regardless of golden ratio */
  featureOverrides?: Record<goldenFeature, boolean>
  /** Whether dev mode banner should be shown */
  isDevelopment?: boolean
  /** Model token limit for trimming */
  modelLimit?: number
}

export interface PromptAssemblyResult {
  /** Final assembled system prompt string */
  systemPrompt: string
  /** Token count of assembled prompt */
  tokensUsed: number
  /** Sections that were dropped due to token budget */
  droppedSections: string[]
  /** Active features after golden ratio + overrides evaluation */
  enabledFeatures: Record<goldenFeature, boolean>
  /** Which sections were included (for debugging) */
  includedSections: string[]
}

// ─── Feature-to-section mapping ─────────────────────────────────

/** Maps golden ratio features to their corresponding prompt section keys */
const FEATURE_SECTION_MAP: Record<goldenFeature, string[]> = {
  memory: ["memories", "userBehavior"],
  characterProfile: ["character", "mood"],
  instructions: ["instructions"],
  placeholders: ["placeholders"],
  kanban: ["task", "focus"],
  vectorEmbed: [], // vectorEmbed is infrastructure, no prompt section
}

/** Sections that are ALWAYS included regardless of golden ratio */
const ALWAYS_INCLUDE_SECTIONS = [
  "system",
  "devBanner",
  "piiRedaction",
  "aiSelfAware",
]

/** Sections that are ALWAYS omitted unless explicitly provided */
const OPT_IN_SECTIONS = ["tribe", "analytics", "grape", "pear", "news"]

// ─── Core assembler ─────────────────────────────────────────────

export function assembleSystemPrompt(
  params: PromptAssemblyParams,
): PromptAssemblyResult {
  const {
    app,
    member,
    guest,
    baseSystemPrompt,
    extraSections = {},
    threadMessageCount,
    userThreadCount,
    lastTriggeredFeatures = [],
    featureOverrides = {} as Record<goldenFeature, boolean>,
    isDevelopment = false,
    modelLimit = 25000,
  } = params

  // ── Step 1: Evaluate golden ratio ──────────────────────────────
  const goldenEvaluations = evaluateGoldenRatio(
    userThreadCount,
    threadMessageCount,
    lastTriggeredFeatures,
    member?.goldenRatioConfig ?? guest?.goldenRatioConfig ?? null,
  )

  // Build enabled feature map
  const enabledFeatures: Record<goldenFeature, boolean> = {} as Record<
    goldenFeature,
    boolean
  >
  for (const ev of goldenEvaluations) {
    // Override wins: if explicitly set, use that. Otherwise use golden ratio result.
    if (ev.feature in featureOverrides) {
      enabledFeatures[ev.feature] = featureOverrides[ev.feature]!
    } else {
      enabledFeatures[ev.feature] = ev.triggered || ev.alreadyTriggered
    }
  }

  // Legacy: check user/guest hard flags (backward compat)
  const characterProfilesEnabled =
    member?.characterProfilesEnabled ?? guest?.characterProfilesEnabled ?? false
  const memoriesEnabled =
    member?.memoriesEnabled ?? guest?.memoriesEnabled ?? false

  // Legacy flags override golden ratio for backward compat
  if (memoriesEnabled !== undefined) enabledFeatures.memory = memoriesEnabled
  if (characterProfilesEnabled !== undefined) {
    enabledFeatures.characterProfile = characterProfilesEnabled
  }

  // ── Step 2: Extract context from chopStick output ──────────────
  const sections = buildSectionMap({
    app,
    member,
    guest,
    baseSystemPrompt,
    extraSections,
    enabledFeatures,
    isDevelopment,
  })

  // ── Step 3: Convert to weighted prompt sections ────────────────
  const promptSections: PromptSection[] = Object.entries(sections).map(
    ([key, value]) => {
      const isAlways = ALWAYS_INCLUDE_SECTIONS.includes(key)
      const isOptIn = OPT_IN_SECTIONS.includes(key)
      const enabled =
        isAlways ||
        (isOptIn
          ? Boolean(value?.content?.trim())
          : Boolean(value?.content?.trim()))

      return buildSection(key, value.content, {
        enabled,
        weight: value.weight,
        maxTokens: value.maxTokens,
      })
    },
  )

  // ── Step 4: Assemble via promptBuilder (token-aware dropping) ──
  const {
    prompt: systemPrompt,
    tokensUsed,
    droppedSections,
  } = buildSystemPromptV2({
    sections: promptSections,
    maxTokens: modelLimit,
  })

  // ── Step 5: Sanitize for Anthropic (strip URLs) ──────────────────
  const sanitized = systemPrompt
    .replace(/!\[([^[\]]*)\]\([^()\r\n]*\)/g, "$1")
    .replace(/\[([^[\]]*)\]\([^()\r\n]*\)/g, "$1")
    .replace(/\bhttps?:\/\/[^\s<>"{}|\\^`[\]]+/gi, "[link]")

  const includedSections = promptSections
    .filter((s) => s.enabled !== false && (s.content || "").trim().length > 0)
    .map((s) => s.key)

  return {
    systemPrompt: sanitized,
    tokensUsed,
    droppedSections,
    enabledFeatures,
    includedSections,
  }
}

// ─── Section builder (reads from chopStick output) ──────────────

interface SectionValue {
  content: string
  weight: number
  maxTokens: number
}

function buildSectionMap(ctx: {
  app: any
  member?: any
  guest?: any
  baseSystemPrompt: string
  extraSections: Record<string, string>
  enabledFeatures: Record<goldenFeature, boolean>
  isDevelopment: boolean
}): Record<string, SectionValue> {
  const {
    app,
    member,
    guest,
    baseSystemPrompt,
    extraSections,
    enabledFeatures,
    isDevelopment,
  } = ctx
  const dna = app?.dnaThread ?? app?.dna ?? {}
  const user = dna?.user ?? app?.user ?? member ?? {}

  // Helper: safe string extraction from chopStick data
  const safe = (val: any): string => {
    if (!val) return ""
    if (typeof val === "string") return val
    if (typeof val === "object")
      return val.text ?? val.content ?? JSON.stringify(val)
    return String(val)
  }

  // Helper: build context from memory arrays
  const buildMemories = (memories: any[]): string => {
    if (!memories?.length) return ""
    const lines = memories.map((m: any) => {
      const cat = m.category ?? "context"
      const emojiMap: Record<string, string> = {
        preference: "⚙️",
        fact: "📌",
        context: "💭",
        instruction: "📝",
        relationship: "👥",
        goal: "🎯",
        character: "🎭",
      }
      const emoji = emojiMap[cat] || "💭"
      return `${emoji} ${safe(m.content ?? m)}`
    })
    return lines.join("\n")
  }

  // Helper: format character profiles
  const buildCharacters = (profiles: any[]): string => {
    if (!profiles?.length) return ""
    return profiles
      .map((p: any) => {
        const traits = p.traits ?? {}
        return `### ${p.name}\n- **Personality**: ${traits.personality ?? p.personality ?? ""}\n- **Communication Style**: ${traits.conversationStyle ?? ""}\n- **Preferences**: ${Array.isArray(traits.preferences) ? traits.preferences.join(", ") : ""}\n- **Expertise**: ${Array.isArray(traits.expertise) ? traits.expertise.join(", ") : ""}\n- **Behavior**: ${Array.isArray(traits.behavior) ? traits.behavior.join(", ") : ""}`
      })
      .join("\n\n")
  }

  // Helper: format instructions
  const buildInstructions = (instructions: any[]): string => {
    if (!instructions?.length) return ""
    return instructions
      .map(
        (i: any) =>
          `${i.emoji ?? "🎯"} **${i.title}**${i.appId ? " [from other app]" : ""}: ${i.content}`,
      )
      .join("\n")
  }

  // Helper: format placeholders
  const buildPlaceholders = (
    placeholder: any,
    appPlaceholder: any,
    threadPlaceholder: any,
  ): string => {
    if (!placeholder && !appPlaceholder && !threadPlaceholder) return ""
    const parts: string[] = []
    if (placeholder) parts.push(`🎯 Current Context: "${safe(placeholder)}"`)
    if (appPlaceholder) parts.push(`App placeholder: "${safe(appPlaceholder)}"`)
    if (threadPlaceholder)
      parts.push(`Thread placeholder: "${safe(threadPlaceholder)}"`)
    return parts.join("\n")
  }

  const memoriesEnabled = enabledFeatures.memory
  const charEnabled = enabledFeatures.characterProfile
  const instrEnabled = enabledFeatures.instructions
  const placeholderEnabled = enabledFeatures.placeholders

  return {
    // Core (always included)
    system: {
      content: baseSystemPrompt,
      weight: 1.0,
      maxTokens: 4000,
    },
    devBanner: {
      content: isDevelopment
        ? "This is Dev mode Hocam: anlamsiz seyler duyabilirsin cevap vermeye calis mermi gibi"
        : "",
      weight: 0.98,
      maxTokens: 50,
    },

    // Conditional: instructions
    instructions: {
      content: instrEnabled
        ? buildInstructions(app?.instructions ?? [])
        : (extraSections.instructions ?? ""),
      weight: 0.9,
      maxTokens: 2000,
    },

    // Conditional: character profiles
    character: {
      content: charEnabled
        ? buildCharacters(app?.characterProfiles ?? [])
        : (extraSections.character ?? ""),
      weight: 0.85,
      maxTokens: 1500,
    },

    // Conditional: mood (part of character)
    mood: {
      content:
        charEnabled && app?.moods?.[0]
          ? `Recent Mood: ${app.moods[0].type} - ${app.moods[0].metadata?.reason ?? ""}`
          : (extraSections.mood ?? ""),
      weight: 0.82,
      maxTokens: 500,
    },

    // Conditional: memories
    memories: {
      content: memoriesEnabled
        ? buildMemories(app?.memories ?? [])
        : (extraSections.memories ?? ""),
      weight: 0.8,
      maxTokens: 2000,
    },

    // Conditional: user behavior (derived from analytics)
    userBehavior: {
      content:
        memoriesEnabled && app?.recentAnalytics?.length
          ? `Recent Activity: ${app.recentAnalytics
              .slice(0, 15)
              .map((a: any) => safe(a.eventName))
              .join(", ")}`
          : (extraSections.userBehavior ?? ""),
      weight: 0.7,
      maxTokens: 1000,
    },

    // Conditional: placeholders
    placeholders: {
      content: placeholderEnabled
        ? buildPlaceholders(
            app?.placeholder,
            app?.appPlaceholder,
            app?.threadPlaceholder,
          )
        : (extraSections.placeholders ?? ""),
      weight: 0.75,
      maxTokens: 800,
    },

    // DNA context (always shown if available, but trimmed last)
    dna: {
      content: app?.dnaContext ?? extraSections.dna ?? "",
      weight: 0.7,
      maxTokens: 2000,
    },

    // Branch context (if available)
    branch: {
      content: extraSections.branch ?? "",
      weight: 0.65,
      maxTokens: 1500,
    },

    // Cross-app / store context
    store: {
      content: app?.storeContext ?? extraSections.store ?? "",
      weight: 0.5,
      maxTokens: 800,
    },

    // Tribal / social context
    tribe: {
      content: extraSections.tribe ?? app?.tribeContext ?? "",
      weight: 0.55,
      maxTokens: 1500,
    },

    // News context (opt-in)
    news: {
      content: extraSections.news ?? app?.newsContext ?? "",
      weight: 0.35,
      maxTokens: 1000,
    },

    // Analytics (opt-in, admin only)
    analytics: {
      content: extraSections.analytics ?? app?.analyticsContext ?? "",
      weight: 0.3,
      maxTokens: 1500,
    },

    // Pear feedback (opt-in)
    pear: {
      content: extraSections.pear ?? app?.pearContext ?? "",
      weight: 0.25,
      maxTokens: 800,
    },

    // Subscription / billing
    subscription: {
      content: extraSections.subscription ?? app?.subscriptionContext ?? "",
      weight: 0.2,
      maxTokens: 300,
    },

    // Burn mode reminder
    burnMode: {
      content: extraSections.burnMode ?? app?.burnModeContext ?? "",
      weight: 0.15,
      maxTokens: 200,
    },

    // Feature status
    featureStatus: {
      content: extraSections.featureStatus ?? app?.featureStatusContext ?? "",
      weight: 0.15,
      maxTokens: 200,
    },

    // Statistics guidelines
    statistics: {
      content: extraSections.statistics ?? app?.statisticsContext ?? "",
      weight: 0.2,
      maxTokens: 500,
    },

    // E2E context
    e2e: {
      content: extraSections.e2e ?? app?.e2eContext ?? "",
      weight: 0.15,
      maxTokens: 500,
    },

    // Timer tools
    timerTools: {
      content: extraSections.timerTools ?? app?.timerToolInstructions ?? "",
      weight: 0.4,
      maxTokens: 500,
    },

    // Calendar
    calendar: {
      content: extraSections.calendar ?? app?.calendarContext ?? "",
      weight: 0.45,
      maxTokens: 1000,
    },

    // Vault context
    vault: {
      content: extraSections.vault ?? app?.vaultContext ?? "",
      weight: 0.45,
      maxTokens: 1000,
    },

    // Focus / productivity
    focus: {
      content: extraSections.focus ?? app?.focusContext ?? "",
      weight: 0.45,
      maxTokens: 800,
    },

    // Tasks
    task: {
      content: extraSections.task ?? app?.taskContext ?? "",
      weight: 0.45,
      maxTokens: 800,
    },

    // Spatial navigation
    spatialNav: {
      content: extraSections.spatialNav ?? app?.spatialNavContext ?? "",
      weight: 0.4,
      maxTokens: 500,
    },

    // Grape (discover apps)
    grape: {
      content: extraSections.grape ?? app?.grapeContext ?? "",
      weight: 0.25,
      maxTokens: 800,
    },

    // Inheritance (parent apps)
    inheritance: {
      content: extraSections.inheritance ?? app?.inheritanceContext ?? "",
      weight: 0.2,
      maxTokens: 500,
    },

    // Pear reminder
    pearReminder: {
      content: extraSections.pearReminder ?? app?.pearReminder ?? "",
      weight: 0.1,
      maxTokens: 100,
    },

    // AI coach
    aiCoach: {
      content: extraSections.aiCoach ?? app?.aiCoachContext ?? "",
      weight: 0.1,
      maxTokens: 500,
    },

    // PII redaction awareness
    piiRedaction: {
      content:
        extraSections.piiRedaction ??
        "🛡️ PII REDACTION AWARENESS: Some data may be redacted for privacy.",
      weight: 0.98,
      maxTokens: 200,
    },

    // AI self-awareness
    aiSelfAware: {
      content: extraSections.aiSelfAware ?? app?.aiSelfAwarenessContext ?? "",
      weight: 0.95,
      maxTokens: 500,
    },

    // Feedback apps (cross-posting)
    feedbackApps: {
      content: extraSections.feedbackApps ?? app?.feedbackAppsContext ?? "",
      weight: 0.2,
      maxTokens: 1000,
    },

    // Tribe post context
    tribePost: {
      content: extraSections.tribePost ?? app?.tribePostContext ?? "",
      weight: 0.5,
      maxTokens: 1000,
    },
  }
}

// ─── Utility: which features are missing next ─────────────────────

export function getNextUnlocks(
  userThreadCount: number,
  threadMessageCount: number,
  lastTriggeredFeatures: goldenFeature[],
): Array<{
  feature: goldenFeature
  threadsNeeded: number
  messagesNeeded: number
}> {
  const evals = evaluateGoldenRatio(
    userThreadCount,
    threadMessageCount,
    lastTriggeredFeatures,
  )
  const next: Array<{
    feature: goldenFeature
    threadsNeeded: number
    messagesNeeded: number
  }> = []

  for (const ev of evals) {
    if (!ev.triggered && !ev.alreadyTriggered) {
      next.push({
        feature: ev.feature,
        threadsNeeded: Math.max(0, ev.threadThreshold - userThreadCount),
        messagesNeeded: Math.max(0, ev.messageThreshold - threadMessageCount),
      })
    }
  }

  return next.sort(
    (a, b) =>
      a.threadsNeeded + a.messagesNeeded - (b.threadsNeeded + b.messagesNeeded),
  )
}
