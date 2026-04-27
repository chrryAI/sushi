/**
 * PromptComposer — Composable, deduplication-safe system prompt assembler
 *
 * Bridges @anythingai/teleprompt (composition layer: dedup, conditional, forking)
 * with promptBuilder.ts (budget layer: weight-based dropping, token truncation).
 *
 * DEDUPLICATION GUARANTEES:
 * - Teleprompt's .use() REPLACES sections with the same id → no duplicate ids
 * - Conditional rendering via render returning null → sections excluded when not applicable
 * - buildSections() → PromptSection[] with golden ratio weights → token budget applied
 * - buildWithBudget() → final string with weight-based dropping
 */
import {
  PromptBuilder,
  type PromptContext,
  section as teleSection,
} from "@anythingai/teleprompt"
import {
  type BuildResult,
  buildSystemPromptV2,
  DEFAULT_SECTION_WEIGHTS,
  type PromptSection,
  section as weightSection,
} from "./promptBuilder"

// ── Types ─────────────────────────────────────────────────────────

/** Section tracking metadata for chopstick payload — visibility into prompt composition */
export type SectionTracking = {
  includedSections: string[]
  excludedSections: string[]
  droppedSections: string[]
  systemPromptTokens: number
}

export type VexFlags = {
  isDevelopment: boolean
  burnEnabled: boolean
  member: boolean
  isRetro: boolean
  isAdmin: boolean
  isCalendarApp: boolean
  isVexApp: boolean
}

export type VexVars = {
  assistantName: string
  burnContent: string
  calendarContent: string
  calendarToolRules: string
  satoContent: string
  satoDojoContent: string
  storeContent: string
  grapeContent: string
  characterContent: string
  inheritanceContent: string
  baseSystemPrompt: string
  devBanner: string
  aiSelfAware: string
  piiRedaction: string
}

export type VexContext = PromptContext<VexFlags, VexVars>

// ── composeSection ─────────────────────────────────────────────────

/**
 * Create a prompt section with golden-ratio weight metadata.
 * Wrapper around teleprompt's section() that carries weight/maxTokens
 * from DEFAULT_SECTION_WEIGHTS.
 *
 * - Same id = replacement (prevents duplication)
 * - render returns null = excluded
 * - Weight is sourced from DEFAULT_SECTION_WEIGHTS for budget integration
 */
export function composeSection(
  id: keyof typeof DEFAULT_SECTION_WEIGHTS | string,
  render: (ctx: VexContext) => string | null,
): ReturnType<typeof teleSection<VexContext>> & {
  _weight: number
  _maxTokens: number
} {
  const weights =
    DEFAULT_SECTION_WEIGHTS[id as keyof typeof DEFAULT_SECTION_WEIGHTS]
  const weight = weights?.weight ?? 0.5
  const maxTokens = weights?.maxTokens ?? 500

  const tele = teleSection<VexContext>(id, render)
  return {
    ...tele,
    _weight: weight,
    _maxTokens: maxTokens,
  }
}

// ── PromptComposer ─────────────────────────────────────────────────

export class PromptComposer<C extends VexContext = VexContext> {
  private builder: PromptBuilder<C>
  private sectionMeta: Map<string, { weight: number; maxTokens: number }> =
    new Map()

  constructor() {
    this.builder = new PromptBuilder<C>()
  }

  /**
   * Register a section. If a section with the same id already exists,
   * it is REPLACED — this is the core deduplication mechanism.
   */
  use(
    section: ReturnType<typeof teleSection<C>> & {
      _weight?: number
      _maxTokens?: number
    },
  ): this {
    this.builder.use(section)

    // Track weight metadata for golden ratio budgeting
    if (section._weight !== undefined && section._maxTokens !== undefined) {
      this.sectionMeta.set(section.id, {
        weight: section._weight,
        maxTokens: section._maxTokens,
      })
    }

    return this
  }

  /**
   * Register exactly one of several sections (first non-empty render wins).
   */
  useOneOf(...candidates: ReturnType<typeof teleSection<C>>[]): this {
    this.builder.useOneOf(...candidates)
    return this
  }

  /**
   * Group sections under a named wrapper.
   */
  group(id: string, configure: (builder: PromptBuilder<C>) => void): this {
    this.builder.group(id, configure)
    return this
  }

  /**
   * Remove a section by id or reference.
   */
  without(ref: string | { id: string }): this {
    this.builder.without(ref)
    this.sectionMeta.delete(typeof ref === "string" ? ref : ref.id)
    return this
  }

  /**
   * Check if a section exists.
   */
  has(ref: string | { id: string }): boolean {
    return this.builder.has(ref)
  }

  /**
   * List all section ids.
   */
  ids(): string[] {
    return this.builder.ids()
  }

  /**
   * Fork into an independent copy.
   */
  fork(): PromptComposer<C> {
    const forked = new PromptComposer<C>()
    forked.builder = this.builder.fork() as PromptBuilder<C>
    forked.sectionMeta = new Map(this.sectionMeta)
    return forked
  }

  /**
   * Build the final prompt string (composition only, no budgeting).
   */
  build(ctx: C): string {
    return this.builder.build(ctx)
  }

  /**
   * Build with metadata — returns included/excluded section ids and prompt.
   */
  buildWithMeta(
    ctx: C,
    options?: { format?: "text" | "xml" },
  ): {
    prompt: string
    included: string[]
    excluded: string[]
  } {
    return this.builder.buildWithMeta(ctx, options)
  }

  /**
   * Build as PromptSection[] ready for golden ratio budgeting.
   * This is the key bridge: teleprompt composition → golden ratio budgeting.
   *
   * Strategy:
   * 1. Get included section ids from teleprompt buildWithMeta
   * 2. Build each section individually to get content
   * 3. Create PromptSection[] with weight/maxTokens from sectionMeta
   */
  buildSections(ctx: C): PromptSection[] {
    const { included, excluded } = this.builder.buildWithMeta(ctx)

    const sections: PromptSection[] = []

    for (const id of included) {
      const meta = this.sectionMeta.get(id)
      const weight =
        meta?.weight ??
        DEFAULT_SECTION_WEIGHTS[id as keyof typeof DEFAULT_SECTION_WEIGHTS]
          ?.weight ??
        0.5
      const maxTokens =
        meta?.maxTokens ??
        DEFAULT_SECTION_WEIGHTS[id as keyof typeof DEFAULT_SECTION_WEIGHTS]
          ?.maxTokens ??
        500

      // Build each section individually via a single-section builder
      // to extract just that section's content
      const sectionContent = this.renderSectionById(id, ctx)
      if (!sectionContent || sectionContent.trim().length === 0) continue

      sections.push({
        key: id,
        content: sectionContent,
        weight,
        maxTokens,
        enabled: true,
      })
    }

    return sections
  }

  /**
   * Build with golden ratio budgeting.
   * Composes sections via teleprompt, then applies weight-based token budgeting.
   *
   * Returns: { prompt, tokensUsed, droppedSections }
   */
  buildWithBudget(ctx: C, maxTokens: number): BuildResult & SectionTracking {
    const sections = this.buildSections(ctx)
    const meta = this.builder.buildWithMeta(ctx)
    const budgetResult = buildSystemPromptV2({ sections, maxTokens })

    return {
      ...budgetResult,
      includedSections: meta.included,
      excludedSections: meta.excluded,
      droppedSections: budgetResult.droppedSections,
      systemPromptTokens: budgetResult.tokensUsed,
    }
  }

  /**
   * Render a single section by id.
   * Creates a minimal builder with just that section to isolate its content.
   */
  private renderSectionById(id: string, ctx: C): string {
    // Use the full builder but extract content for just this section.
    // We rebuild a minimal builder containing only the target section.
    // This is simpler than trying to access internal state.
    const singleBuilder = new PromptBuilder<C>()

    // Find the section in the original builder's node list.
    // We iterate through the builder's output to find the section.
    // Alternative: build full prompt and find section boundaries.
    // Simplest: build with XML format, extract tag content.
    const xmlResult = this.builder.buildWithMeta(ctx, { format: "xml" })

    // If the section is included, find its XML tag
    if (!xmlResult.included.includes(id)) {
      return ""
    }

    // Build with XML to get tagged sections
    const xmlPrompt = this.builder.build(ctx, { format: "xml" })

    // Extract content between <id>...</id> tags
    // Note: group sections may nest, but we handle flat sections first
    const regex = new RegExp(`<${id}>\\n?([\\s\\S]*?)\\n?<\\/${id}>`, "m")
    const match = xmlPrompt.match(regex)

    if (match?.[1]) {
      return match[1].trim()
    }

    // Fallback: build text and hope the section is identifiable
    // This happens when section content doesn't have clear boundaries
    return ""
  }
}
