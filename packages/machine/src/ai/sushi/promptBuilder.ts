/**
 * PromptBuilder — pure prompt-section assembly from sushi data
 *
 * No HTTP, no Hono, no Handlebars. Takes raw sushi data, returns
 * formatted strings that can be composed into a system prompt.
 *
 * Used by:
 *   - chopStick (when buildPrompt: true) → sushi.ai.promptSections
 *   - OSS chopstick npm package (same logic, different transport)
 *   - API promptBuilder.ts (adds Handlebars + runtime contexts on top)
 */

import type { sushi } from "@chrryai/donut/types"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface PromptSections {
  memories: string
  instructions: string
  characterProfiles: string
  placeholders: string
  dna: string
  apps: string
  /** All sections joined — drop-in system prompt addition */
  assembled: string
}

export interface PromptBuilderOpts {
  /**
   * Dynamic memory sizing: fewer memories as conversation grows longer
   * to stay within token limits.
   */
  messageCount?: number
  /**
   * User's name — used in instruction/character headings
   */
  userName?: string
  /**
   * The app's own id — used to label cross-app instructions
   */
  appId?: string
}

// ─────────────────────────────────────────────────────────────────
// Memory section
// ─────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  preference: "⚙️",
  fact: "📌",
  context: "💭",
  instruction: "📝",
  relationship: "👥",
  goal: "🎯",
  character: "🎭",
}

function memoryLine(m: { category?: string | null; content: string }): string {
  const emoji = CATEGORY_EMOJI[m.category ?? "context"] ?? "💭"
  return `${emoji} ${m.content}`
}

export function buildMemoryContext(
  sushi: Pick<
    sushi,
    "userMemories" | "appMemories" | "threadMemories" | "dnaMemories"
  >,
  opts?: PromptBuilderOpts,
): string {
  const userMems = (sushi.userMemories ?? []) as Array<{
    category?: string | null
    content: string
  }>
  const appMems = (sushi.appMemories ?? []) as Array<{
    category?: string | null
    content: string
    userId?: string | null
    guestId?: string | null
  }>
  const threadMems = (sushi.threadMemories ?? []) as Array<{
    category?: string | null
    content: string
  }>

  if (!userMems.length && !appMems.length && !threadMems.length) return ""

  const parts: string[] = []

  if (userMems.length) {
    parts.push(
      `\n\n## RELEVANT CONTEXT ABOUT THE USER:\n${userMems.map(memoryLine).join("\n")}\n\nUse this context to personalize your responses when relevant.`,
    )
  }

  const characterMems = appMems.filter((m) => m.category === "character")
  const knowledgeMems = appMems.filter((m) => m.category !== "character")

  if (characterMems.length) {
    parts.push(
      `\n\n## 🎭 YOUR CHARACTER PROFILE (learned from interactions):\n${characterMems.map((m) => `🎭 ${m.content}`).join("\n")}\n\n⚠️ IMPORTANT: These are observations about YOUR personality and communication style. Embody them consistently.`,
    )
  }

  if (knowledgeMems.length) {
    parts.push(
      `\n\n## 📚 APP KNOWLEDGE:\n${knowledgeMems.map(memoryLine).join("\n")}`,
    )
  }

  if (threadMems.length) {
    parts.push(
      `\n\n## 🧵 THIS CONVERSATION:\n${threadMems.map(memoryLine).join("\n")}`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Instructions section
// ─────────────────────────────────────────────────────────────────

export function buildInstructionsContext(
  sushi: Pick<
    sushi,
    | "userInstructions"
    | "appInstructions"
    | "threadInstructions"
    | "dnaInstructions"
  >,
  opts?: PromptBuilderOpts,
): string {
  type Instruction = {
    emoji?: string | null
    title?: string | null
    content: string
    appId?: string | null
  }

  const thread = (sushi.threadInstructions ?? []) as Instruction[]
  const app = (sushi.appInstructions ?? []) as Instruction[]
  const user = (sushi.userInstructions ?? []) as Instruction[]
  const dna = (sushi.dnaInstructions ?? []) as Instruction[]

  // Priority: thread > app > user > dna
  const selected = thread.length
    ? thread
    : app.length
      ? app
      : user.length
        ? user
        : dna

  if (!selected.length) return ""

  const isScattered = selected === user && app.length === 0
  const sourceLabel = thread.length
    ? "THREAD"
    : app.length
      ? "CURRENT APP"
      : "SCATTERED FROM MULTIPLE APPS"

  const lines = selected
    .map((i) => {
      const crossApp =
        opts?.appId && i.appId && i.appId !== opts.appId
          ? " [from other app]"
          : ""
      return `${i.emoji ?? "📝"} **${i.title ?? "Instruction"}**${crossApp}: ${i.content}`
    })
    .join("\n")

  return `\n\n## 🎯 USER'S CUSTOM INSTRUCTIONS (${sourceLabel}):\nThese are personalized instructions the user has created to guide your behavior. Follow them when relevant.\n\n${lines}${isScattered ? "\n\n_Instructions scattered across apps for diverse context._" : ""}`
}

// ─────────────────────────────────────────────────────────────────
// Character profiles section
// ─────────────────────────────────────────────────────────────────

export function buildCharacterContext(
  sushi: Pick<
    sushi,
    | "characterProfiles"
    | "appCharacterProfiles"
    | "threadCharacterProfiles"
    | "dnaCharacterProfiles"
  >,
): string {
  type Profile = {
    name?: string | null
    content: string
    isPinned?: boolean | null
  }

  const thread = (sushi.threadCharacterProfiles ?? []) as unknown as Profile[]
  const user = (sushi.characterProfiles ?? []) as unknown as Profile[]
  const app = (sushi.appCharacterProfiles ?? []) as unknown as Profile[]
  const dna = (sushi.dnaCharacterProfiles ?? []) as unknown as Profile[]

  if (!thread.length && !user.length && !app.length && !dna.length) return ""

  const parts: string[] = []

  if (thread.length && thread[0]) {
    parts.push(
      `\n\n## 🎯 ACTIVE CHARACTER (This Thread):\n${thread[0].content}\n\n⚠️ IMPORTANT: This is the active character for THIS conversation. It takes precedence over general profiles.`,
    )
  }

  const pinnedUsers = user.filter((p) => p.isPinned)
  const otherUsers = user.filter((p) => !p.isPinned)
  const orderedUsers = [...pinnedUsers, ...otherUsers]

  if (orderedUsers.length) {
    parts.push(
      `\n\n## ⭐ USER CHARACTERS (Favorites first):\n${orderedUsers
        .map((p) => `**${p.name ?? "Character"}**: ${p.content}`)
        .join("\n\n")}`,
    )
  }

  if (app.length) {
    parts.push(
      `\n\n## 🤖 APP CHARACTERS (Domain Expertise):\n${app.map((p) => `**${p.name ?? "Character"}**: ${p.content}`).join("\n\n")}`,
    )
  }

  if (dna.length && !thread.length && !user.length) {
    parts.push(
      `\n\n## 🧬 CREATOR'S CHARACTERS:\n${dna.map((p) => `**${p.name ?? "Character"}**: ${p.content}`).join("\n\n")}`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Placeholder / conversation starters section
// ─────────────────────────────────────────────────────────────────

export function buildPlaceholderContext(
  sushi: Pick<
    sushi,
    "userPlaceholders" | "appPlaceholders" | "threadPlaceholders"
  >,
): string {
  type Placeholder = { text: string }

  const thread = ((sushi.threadPlaceholders ?? []) as Placeholder[])[0]
  const app = ((sushi.appPlaceholders ?? []) as Placeholder[])[0]
  const user = ((sushi.userPlaceholders ?? []) as Placeholder[])[0]

  if (!thread && !app && !user) return ""

  const lines: string[] = []
  if (user) lines.push(`- User placeholder: "${user.text}"`)
  if (app) lines.push(`- App placeholder: "${app.text}"`)
  if (thread) lines.push(`- Thread placeholder: "${thread.text}"`)

  return `\n\n## 💬 PERSONALIZED CONVERSATION STARTERS:\nYou recently generated these suggestions for the user:\n${lines.join("\n")}\n\nThese reflect the user's interests and recent conversations.`
}

// ─────────────────────────────────────────────────────────────────
// DNA (app-owner foundational knowledge) section
// ─────────────────────────────────────────────────────────────────

export function buildDnaContext(
  sushi: Pick<sushi, "dnaMemories" | "dnaInstructions">,
  creatorName?: string,
): string {
  type DnaMemory = {
    content?: string | null
    title?: string | null
    category?: string | null
  }
  type DnaInstruction = {
    emoji?: string | null
    title?: string | null
    content: string
    appId?: string | null
  }

  const memories = (sushi.dnaMemories ?? []) as DnaMemory[]
  const instructions = (sushi.dnaInstructions ?? []) as DnaInstruction[]

  const knowledgeMems = memories
    .filter(
      (m) =>
        m.category !== "preference" &&
        m.category !== "relationship" &&
        m.category !== "goal",
    )
    .map((m) => m.content || m.title || "")
    .filter((c) => c.length > 10)
    .slice(0, 10)

  const filteredInstructions = instructions.slice(0, 5)

  if (!knowledgeMems.length && !filteredInstructions.length) return ""

  const creator = creatorName ?? "creator"
  const parts: string[] = []

  if (filteredInstructions.length) {
    parts.push(
      `\n\n## 🎯 CREATOR'S WORKFLOW PATTERNS (from ${creator}):\n${filteredInstructions
        .map(
          (i) =>
            `${i.emoji ?? "📝"} **${i.title ?? "Pattern"}**: ${i.content.slice(0, 200)}${i.content.length > 200 ? "..." : ""}`,
        )
        .join(
          "\n",
        )}\n\n_General workflow patterns the creator uses across apps. No personal information included._`,
    )
  }

  if (knowledgeMems.length) {
    parts.push(
      `\n\n## 🧬 APP DNA (from ${creator}):\n\n**Foundational Knowledge:**\n${knowledgeMems.map((c) => `- ${c}`).join("\n")}\n\n_General knowledge about this app's purpose. No personal information included._`,
    )
  }

  if (parts.length) {
    parts.push(
      `\n\n---\n⚠️ **Privacy Notice**: This context contains only general, non-personal information about the app.`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Store apps (Grape) section
// ─────────────────────────────────────────────────────────────────

export function buildAppsContext(
  storeApps: Array<{
    id: string
    name?: string | null
    title?: string | null
    description?: string | null
    icon?: string | null
  }>,
  storeName?: string,
): string {
  if (!storeApps.length) return ""

  const list = storeApps
    .map(
      (a) =>
        `- **${a.name}**${a.icon ? `: ${a.title ?? ""}` : ""}${a.description ? `: ${a.description}` : ""}`,
    )
    .join("\n")

  const names = storeApps.map((a) => a.name).join(", ")

  return `\n\n## 🍇 GRAPE (Discover Apps)\n\n**Available Apps** (shown in 🍇 Grape button):\n${list}\n\n**When users ask about discovering apps:**\n- Explain: "Click the 🍇 Grape button to discover apps and earn credits for feedback"\n- Available: ${names}\n- Browse → Click → Try → Feedback → Earn`
}

// ─────────────────────────────────────────────────────────────────
// Master builder — assembles all sections from a sushi object
// ─────────────────────────────────────────────────────────────────

export function buildPromptSections(
  sushi: sushi,
  opts?: PromptBuilderOpts,
): PromptSections {
  const creatorName =
    (sushi as any).user?.name ?? (sushi as any).guest?.id?.slice(0, 5) ?? ""

  const memories = buildMemoryContext(sushi, opts)
  const instructions = buildInstructionsContext(sushi, opts)
  const characterProfiles = buildCharacterContext(sushi)
  const placeholders = buildPlaceholderContext(sushi)
  const dna = buildDnaContext(sushi, creatorName)
  const apps = sushi.store?.apps?.length
    ? buildAppsContext(sushi.store.apps as any, sushi.store.name ?? undefined)
    : ""

  const assembled = [
    memories,
    instructions,
    characterProfiles,
    placeholders,
    dna,
    apps,
  ]
    .filter(Boolean)
    .join("")

  return {
    memories,
    instructions,
    characterProfiles,
    placeholders,
    dna,
    apps,
    assembled,
  }
}

// ─────────────────────────────────────────────────────────────────
// Default join weights — used when agent doesn't specify its own
// ─────────────────────────────────────────────────────────────────

export interface JoinWeights {
  memories?: { user?: number; thread?: number; app?: number; dna?: number }
  instructions?: { user?: number; thread?: number; app?: number; dna?: number }
  characterProfile?: {
    user?: number
    thread?: number
    app?: number
    dna?: number
  }
  placeholders?: { user?: number; thread?: number; app?: number; dna?: number }
}

/**
 * Default weights for the main app in a store.
 * Agent can override via aiAgent.metadata.join
 */
export const DEFAULT_MAIN_APP_JOIN: JoinWeights = {
  memories: { user: 10, thread: 6, app: 6, dna: 4 },
  instructions: { user: 7, thread: 4, app: 5, dna: 2 },
  characterProfile: { user: 3, thread: 2, app: 2, dna: 1 },
  placeholders: { user: 4, thread: 3, app: 4, dna: 2 },
}

/**
 * Lighter weights for context (non-main) apps in a store.
 */
export const DEFAULT_CONTEXT_APP_JOIN: JoinWeights = {
  memories: { user: 3, thread: 2, app: 2, dna: 1 },
  instructions: { user: 2, thread: 2, app: 2, dna: 1 },
  characterProfile: { user: 1, thread: 1, app: 1, dna: 0 },
  placeholders: { user: 2, thread: 2, app: 2, dna: 1 },
}

/**
 * Merge agent join config over defaults.
 * Agent wins on any field it specifies.
 */
export function resolveJoinWeights(
  agentJoin?: JoinWeights | null,
  isMainApp = true,
): JoinWeights {
  const base = isMainApp ? DEFAULT_MAIN_APP_JOIN : DEFAULT_CONTEXT_APP_JOIN
  if (!agentJoin) return base

  return {
    memories: { ...base.memories, ...agentJoin.memories },
    instructions: { ...base.instructions, ...agentJoin.instructions },
    characterProfile: {
      ...base.characterProfile,
      ...agentJoin.characterProfile,
    },
    placeholders: { ...base.placeholders, ...agentJoin.placeholders },
  }
}

/**
 * Dynamic memory page size based on conversation length.
 * Shorter convos → more memories (user is just starting, needs full context).
 * Longer convos → fewer memories (context already in-thread).
 */
export function resolveMemoryPageSize(messageCount: number): number {
  if (messageCount <= 5) return 25
  if (messageCount <= 15) return 20
  if (messageCount <= 30) return 15
  if (messageCount <= 50) return 12
  if (messageCount <= 75) return 5
  if (messageCount <= 100) return 3
  return 1
}
