/**
 * PromptBuilder — token-aware, weight-driven system prompt assembler
 *
 * SOLID:
 *   Single responsibility: takes assembled sections, trims to model limit.
 *   Open/closed: new section type? just add to the array.
 *
 * Usage (drop-in replacement for ai.ts L3937):
 *   const { prompt: systemPrompt, tokensUsed, dropped } = buildSystemPromptV2({
 *     sections: [ ... ],
 *     maxTokens: modelLimit,
 *   })
 */

// ─── estimation ───────────────────────────────────────────────────
// rough but fast: 4 chars ≈ 1 token for western text.
// conservative for CJK: 2 chars ≈ 1 token.
function estimateTokens(text: string | undefined): number {
  if (!text) return 0
  let cjk = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xac00 && code <= 0xd7af)
    ) {
      cjk++
    }
  }
  const nonCjk = text.length - cjk
  return Math.ceil(cjk / 2 + nonCjk / 4)
}

/** hard ceiling: cut string down to target tokens */
function truncateToTokens(text: string | undefined, maxTokens: number): string {
  if (!text) return ""
  const charsPerToken = 3.5 // slightly more conservative than 4
  const maxChars = Math.floor(maxTokens * charsPerToken)
  if (text.length <= maxChars) return text
  // cut at last space before limit to avoid mid-word breaks
  let cut = maxChars
  while (cut > 0 && text[cut] !== " " && text[cut] !== "\n") cut--
  if (cut <= 0) cut = maxChars // no space found, hard cut
  return text.slice(0, cut) + "\n\n...[truncated for token limit]"
}

// ─── types ────────────────────────────────────────────────────────

export interface PromptSection {
  /** unique key for logging / debug */
  key: string
  /** raw section content (may be empty) */
  content: string | undefined
  /** priority: 0..1, higher = harder to drop.  system=1.0, memories=0.8 … */
  weight: number
  /** soft cap in tokens. section is shrunk to this first */
  maxTokens: number
  /** if false, section is omitted from the start */
  enabled?: boolean
}

export interface BuildResult {
  prompt: string
  tokensUsed: number
  droppedSections: string[]
}

// ─── default weights (mirror the pipeline schema) ────────────────
/** override per app-slug if needed */
export const DEFAULT_SECTION_WEIGHTS: Record<
  string,
  { weight: number; maxTokens: number }
> = {
  // core: never drop
  system: { weight: 1.0, maxTokens: 4000 },
  devBanner: { weight: 0.98, maxTokens: 50 },
  piiRedaction: { weight: 0.98, maxTokens: 200 },
  aiSelfAware: { weight: 0.95, maxTokens: 500 },

  // user context: precious
  instructions: { weight: 0.9, maxTokens: 2000 },
  character: { weight: 0.85, maxTokens: 1500 },
  mood: { weight: 0.82, maxTokens: 500 },
  memories: { weight: 0.8, maxTokens: 2000 },
  placeholders: { weight: 0.75, maxTokens: 800 },
  userBehavior: { weight: 0.7, maxTokens: 1000 },
  dna: { weight: 0.7, maxTokens: 2000 },
  branch: { weight: 0.65, maxTokens: 1500 },

  // app/tool context: medium
  moltbook: { weight: 0.55, maxTokens: 1500 },
  tribe: { weight: 0.55, maxTokens: 1500 },
  sato: { weight: 0.5, maxTokens: 800 },
  store: { weight: 0.5, maxTokens: 800 },
  calendar: { weight: 0.45, maxTokens: 1000 },
  vault: { weight: 0.45, maxTokens: 1000 },
  focus: { weight: 0.45, maxTokens: 800 },
  task: { weight: 0.45, maxTokens: 800 },
  timerTools: { weight: 0.4, maxTokens: 500 },
  spatialNav: { weight: 0.4, maxTokens: 500 },

  // cross-app / optional: drop first
  news: { weight: 0.35, maxTokens: 1000 },
  analytics: { weight: 0.3, maxTokens: 1500 },
  grape: { weight: 0.25, maxTokens: 800 },
  pear: { weight: 0.25, maxTokens: 800 },
  feedbackApps: { weight: 0.2, maxTokens: 1000 },
  subscription: { weight: 0.2, maxTokens: 300 },
  statistics: { weight: 0.2, maxTokens: 500 },
  inheritance: { weight: 0.2, maxTokens: 500 },
  e2e: { weight: 0.15, maxTokens: 500 },
  burnMode: { weight: 0.15, maxTokens: 200 },
  featureStatus: { weight: 0.15, maxTokens: 200 },
  pearReminder: { weight: 0.1, maxTokens: 100 },
  aiCoach: { weight: 0.1, maxTokens: 500 },

  // enhanced system prompt sections (previously appended outside budget)
  rag: { weight: 0.75, maxTokens: 3000 },
  calendarInstructions: { weight: 0.6, maxTokens: 800 },
  pricing: { weight: 0.15, maxTokens: 1500 },
  pearFeedback: { weight: 0.25, maxTokens: 800 },
  retroAnalytics: { weight: 0.2, maxTokens: 1500 },
  memoryExplanation: { weight: 0.4, maxTokens: 600 },
  debate: { weight: 0.1, maxTokens: 2000 },
}

/** helper: create a section with defaults from the table */
export function section(
  key: string,
  content: string | undefined,
  overrides?: Partial<Omit<PromptSection, "key" | "content">>,
): PromptSection {
  const def = DEFAULT_SECTION_WEIGHTS[key]
  return {
    key,
    content: content || "",
    weight: overrides?.weight ?? def?.weight ?? 0.5,
    maxTokens: overrides?.maxTokens ?? def?.maxTokens ?? 500,
    enabled: overrides?.enabled ?? true,
  }
}

// ─── the assembler ──────────────────────────────────────────────

/**
 * 1. discard empty / disabled sections
 * 2. shrink each section to its own maxTokens
 * 3. if total still exceeds global maxTokens, drop lowest-weight sections first
 * 4. never drop weight >= 0.98 (system, pii, devBanner)
 */
export function buildSystemPromptV2(params: {
  sections: PromptSection[]
  maxTokens: number
}): BuildResult {
  const { sections, maxTokens } = params
  const hardFloor = 1000 // always reserve ~1k for the conversation itself
  const budget = Math.max(hardFloor, maxTokens - hardFloor)

  // 1. filter out disabled / empty
  let active = sections
    .filter((s) => s.enabled !== false && (s.content || "").trim().length > 0)
    .map((s) => ({
      ...s,
      originalTokens: estimateTokens(s.content),
    }))

  // 2. shrink each to its own maxTokens ceiling
  active = active.map((s) => {
    if (s.originalTokens <= s.maxTokens) return s
    return {
      ...s,
      content: truncateToTokens(s.content, s.maxTokens),
      originalTokens: s.maxTokens,
    }
  })

  // 3. calculate running total
  const total = () => active.reduce((sum, s) => sum + s.originalTokens, 0)

  const dropped: string[] = []

  // 4. drop lightest sections until we fit
  while (total() > budget && active.length > 1) {
    // find droppable (weight < 0.98)
    const droppable = active
      .filter((s) => s.weight < 0.98)
      .sort((a, b) => a.weight - b.weight)

    if (droppable.length === 0) break // nothing more we can drop

    const victim = droppable[0]!
    active = active.filter((s) => s.key !== victim.key)
    dropped.push(victim.key)
  }

  // 5. if STILL over budget, truncate the heaviest *non-core* section
  if (total() > budget) {
    const truncatable = active
      .filter((s) => s.weight < 0.95)
      .sort((a, b) => b.originalTokens - a.originalTokens)

    for (const s of truncatable) {
      const excess = total() - budget
      const newCap = Math.max(100, s.originalTokens - excess)
      s.content = truncateToTokens(s.content, newCap)
      s.originalTokens = estimateTokens(s.content)
      if (total() <= budget) break
    }
  }

  // 6. preserve insertion order of the originals
  const keyOrder = sections.map((s) => s.key)
  const sorted = [...active].sort(
    (a, b) => keyOrder.indexOf(a.key) - keyOrder.indexOf(b.key),
  )

  const prompt = sorted.map((s) => s.content).join("")
  const tokensUsed = total()

  // debug log (replace with structured logger when available)
  // eslint-disable-next-line no-console
  console.log(
    `📐 buildSystemPromptV2: ${tokensUsed}/${budget} tokens, ` +
      `sections=${sorted.length}, dropped=${dropped.join(",") || "none"}`,
  )

  return { prompt, tokensUsed, droppedSections: dropped }
}

/** drop-in adapter: converts the old `[...].join("")` array into BuildResult */
export function buildSystemPromptFromParts(
  parts: Record<string, string | undefined | null>,
  maxTokens: number,
): BuildResult {
  const sections: PromptSection[] = Object.entries(parts).map(
    ([key, content]) => section(key, content || undefined),
  )
  return buildSystemPromptV2({ sections, maxTokens })
}
