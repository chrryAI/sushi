// packages/ai-core/src/pipeline/index.ts
// ============================================
// 🧠 DATA-DRIVEN AI PIPELINE
// Effect + Schema-based, her katman compose edilebilir
// ============================================

import type { guest, sushi, swarm, user } from "@chrryai/donut/types"
import { Context, Data, Effect, Layer, pipe, Schema } from "effect"

// ============================================
// 🚨 DOMAIN ERRORS
// ============================================

export class ContextResolveError extends Data.TaggedError(
  "ContextResolveError",
)<{
  readonly cause: unknown
}> {}

export class PromptBuildError extends Data.TaggedError("PromptBuildError")<{
  readonly template: string
  readonly cause: unknown
}> {}

export class ModelRouteError extends Data.TaggedError("ModelRouteError")<{
  readonly modelId: string
  readonly reason: string
}> {}

export class BgJobError extends Data.TaggedError("BgJobError")<{
  readonly jobId: string
  readonly cause: unknown
}> {}

export type PipelineError =
  | ContextResolveError
  | PromptBuildError
  | ModelRouteError
  | BgJobError

// ============================================
// 📐 PROMPT SCHEMA - data-driven, MIT prompt builder gibi
// Agent bg jobda bunu okuyup ne çekeceğine karar verir
// ============================================

export const sourceWeight = Schema.Struct({
  source: Schema.String, // "memories", "dna", "rag", "instructions", "news"
  weight: Schema.Number, // 0-1 arası önem
  maxTokens: Schema.Number, // bu kaynağa max ne kadar token
  required: Schema.Boolean, // olmazsa error mı verse
})

export const promptSchema = Schema.Struct({
  // Model config
  modelId: Schema.String,
  temperature: Schema.Number,
  maxOutputTokens: Schema.optional(Schema.Number),

  // Source weights - agent bunu okur, ne çekeceğine karar verir
  sources: Schema.Array(sourceWeight),

  // Rendered sections - her biri ayrı Effect
  sections: Schema.Struct({
    system: Schema.String,
    memory: Schema.optional(Schema.String),
    dna: Schema.optional(Schema.String),
    rag: Schema.optional(Schema.String),
    instructions: Schema.optional(Schema.String),
    calendar: Schema.optional(Schema.String),
    vault: Schema.optional(Schema.String),
    focus: Schema.optional(Schema.String),
    news: Schema.optional(Schema.String),
    analytics: Schema.optional(Schema.String),
  }),

  // Metadata - bg job için
  meta: Schema.Struct({
    appId: Schema.optional(Schema.String),
    threadId: Schema.String,
    userId: Schema.optional(Schema.String),
    guestId: Schema.optional(Schema.String),
    language: Schema.String,
    isBurn: Schema.Boolean,
    isJob: Schema.Boolean,
    jobType: Schema.optional(Schema.String),
  }),
})

export type promptSchema = typeof promptSchema.Type
export type sourceWeight = typeof sourceWeight.Type

// ============================================
// 🎛️ CONTEXT TAG - dependency injection
// ============================================

export class PipelineContext extends Context.Tag("PipelineContext")<
  PipelineContext,
  {
    readonly app: sushi | null
    readonly user: user | null
    readonly guest: guest | null
    readonly threadId: string
    readonly language: string
    readonly isBurn: boolean
    readonly isJob: boolean
    readonly source?: string
    readonly swarm?: swarm
  }
>() {}

// ============================================
// 🔌 STEP 1: resolveContext
// chopStick + session bilgisi
// ============================================

export const resolveContext = (params: {
  appId?: string
  appSlug?: string
  userId?: string
  guestId?: string
  threadId: string
  source?: string
}) =>
  Effect.gen(function* () {
    // chopStick DB'den app çeker - bu server-side only
    const { chopStick } = yield* Effect.promise(() =>
      import("@chrryai/machine").then((m) => ({ chopStick: m.chopStick })),
    )

    const app = yield* Effect.tryPromise({
      try: () =>
        chopStick({
          id: params.appId,
          slug: params.appSlug,
          userId: params.userId,
          guestId: params.guestId,
          threadId: params.threadId,
          join: {
            memories: { user: 5, app: 3, dna: 2 },
            instructions: { user: 3, app: 3, thread: 3 },
            characterProfile: { user: 1, app: 1 },
            placeholders: { user: 2, thread: 2 },
          },
        }),
      catch: (e) => new ContextResolveError({ cause: e }),
    })

    return app
  })

// ============================================
// 🧩 STEP 2: buildpromptSchema
// Data-driven - her source bir sourceWeight
// Agent bg jobda ne çekeceğine buna bakarak karar verir
// ============================================

const DEFAULT_SOURCE_WEIGHTS: sourceWeight[] = [
  { source: "system", weight: 1.0, maxTokens: 4000, required: true },
  { source: "memories", weight: 0.8, maxTokens: 2000, required: false },
  { source: "instructions", weight: 0.7, maxTokens: 1500, required: false },
  { source: "dna", weight: 0.6, maxTokens: 2000, required: false },
  { source: "rag", weight: 0.5, maxTokens: 3000, required: false },
  { source: "calendar", weight: 0.4, maxTokens: 1000, required: false },
  { source: "news", weight: 0.3, maxTokens: 1000, required: false },
  { source: "analytics", weight: 0.2, maxTokens: 1500, required: false },
]

// MIT prompt builder yaklaşımı:
// Her source bir "slot" - agent bunları okuyup hangisini ne kadar alacağına karar verir
export const buildpromptSchema = (params: {
  app: sushi | null
  user: user | null
  guest: guest | null
  threadId: string
  language: string
  modelId: string
  isBurn?: boolean
  isJob?: boolean
  jobType?: string
  messageCount?: number // dinamik weight hesabı için
}) =>
  Effect.gen(function* () {
    const {
      app,
      user,
      guest,
      threadId,
      language,
      modelId,
      messageCount = 0,
    } = params

    // Dinamik weight: az mesaj = daha fazla context, çok mesaj = daha az
    const contextBoost = messageCount < 10 ? 1.2 : messageCount > 50 ? 0.7 : 1.0

    const sources: sourceWeight[] = DEFAULT_SOURCE_WEIGHTS.map((s) => ({
      ...s,
      weight: Math.min(1, s.weight * contextBoost),
      // Burn mode: memory ve dna kapatılır
      required:
        params.isBurn && ["memories", "dna"].includes(s.source)
          ? false
          : s.required,
    }))

    // App'e özel source override
    if (app?.slug === "vault") {
      const vaultIdx = sources.findIndex((s) => s.source === "calendar")
      if (vaultIdx >= 0)
        sources[vaultIdx] = {
          ...sources[vaultIdx]!,
          weight: 0.9,
          maxTokens: 2000,
        }
    }

    if (app?.slug === "grape" || app?.slug === "pear") {
      sources.push({
        source: "analytics",
        weight: 0.95,
        maxTokens: 3000,
        required: true,
      })
    }

    const schema: promptSchema = {
      modelId,
      temperature: app?.temperature ?? 0.7,
      sources,
      sections: {
        system: "", // renderSections ile doldurulacak
      },
      meta: {
        appId: app?.id,
        threadId,
        userId: user?.id,
        guestId: guest?.id,
        language,
        isBurn: params.isBurn ?? false,
        isJob: params.isJob ?? false,
        jobType: params.jobType,
      },
    }

    return schema
  })

// ============================================
// 🎨 STEP 3: renderSections
// Her section ayrı Effect - parallel çalışır
// ============================================

export const renderSections = (
  schema: promptSchema,
  app: sushi | null,
  user: user | null,
  guest: guest | null,
) =>
  Effect.gen(function* () {
    const { renderSystemPrompt, getAppDNAContext } = yield* Effect.promise(() =>
      import("../api/hono/routes/ai")
        .then((m) => ({
          renderSystemPrompt: m.renderSystemPrompt,
          getAppDNAContext: (m as any).getAppDNAContext,
        }))
        .catch(() => ({
          renderSystemPrompt: async () => "",
          getAppDNAContext: async () => "",
        })),
    )

    // Hangi source'lar aktif?
    const active = new Set(
      schema.sources
        .filter(
          (s) =>
            s.weight > 0 &&
            !(schema.meta.isBurn && ["memories", "dna"].includes(s.source)),
        )
        .map((s) => s.source),
    )

    // Parallel render - hepsi aynı anda çalışır
    const [systemSection, dnaSection] = yield* Effect.all(
      [
        // System prompt
        Effect.tryPromise({
          try: () =>
            Promise.resolve(
              renderSystemPrompt({
                template: app?.systemPrompt ?? "",
                app,
                language: schema.meta.language,
                threadInstructions: undefined,
              }),
            ),
          catch: (e) => new PromptBuildError({ template: "system", cause: e }),
        }),

        // DNA context (app owner's foundational knowledge)
        active.has("dna") && app?.mainThreadId
          ? Effect.tryPromise({
              try: () => getAppDNAContext(app),
              catch: (e) => new PromptBuildError({ template: "dna", cause: e }),
            })
          : Effect.succeed(""),
      ],
      { concurrency: "unbounded" },
    )

    return {
      ...schema,
      sections: {
        ...schema.sections,
        system: systemSection,
        dna: dnaSection || undefined,
      },
    } satisfies promptSchema
  })

// ============================================
// 🤖 STEP 4: BG JOB AGENT DECISION
// Agent schema'yı okur, ne çekeceğine kendisi karar verir
// MIT prompt builder mantığı burada
// ============================================

export const BgJobDecision = Schema.Struct({
  shouldExtractMemories: Schema.Boolean,
  shouldGenerateSuggestions: Schema.Boolean,
  shouldUpdateCharacterProfile: Schema.Boolean,
  shouldUpdateThreadSummary: Schema.Boolean,
  // Hangi source'lardan ne kadar çekileceği
  sourceConfig: Schema.Array(
    Schema.Struct({
      source: Schema.String,
      pageSize: Schema.Number,
      priority: Schema.Literal("high", "medium", "low"),
    }),
  ),
  reasoning: Schema.String, // Neden bu kararları verdi
})
export type BgJobDecision = typeof BgJobDecision.Type

// Agent kendi başına bg job kararı verir
export const makeBgJobDecision = (
  schema: promptSchema,
  conversationStats: {
    messageCount: number
    hasFiles: boolean
    hasMemoriesEnabled: boolean
    hasCharacterProfilesEnabled: boolean
    isFirstMessage: boolean
  },
) =>
  Effect.gen(function* () {
    const { getModelProvider } = yield* Effect.promise(() =>
      import("@chrryai/machine").then((m) => ({
        getModelProvider: m.getModelProvider,
      })),
    )

    const model = yield* Effect.tryPromise({
      try: () =>
        getModelProvider({
          source: "ai/content",
        }),
      catch: (e) =>
        new ModelRouteError({ modelId: "ai/content", reason: String(e) }),
    })

    // Agent schema'yı okur - data-driven karar
    const decisionPrompt = `
You are a background job scheduler. Based on the conversation schema below, decide what background tasks to run.

SCHEMA:
${JSON.stringify(schema, null, 2)}

CONVERSATION STATS:
${JSON.stringify(conversationStats, null, 2)}

Rules:
- Extract memories: only if memoriesEnabled and messageCount >= 3
- Generate suggestions: only if memoriesEnabled
- Update character profile: only if characterProfilesEnabled and messageCount >= 5
- Update thread summary: always if messageCount >= 2
- Source config: adjust pageSize based on messageCount (fewer messages = more context)

Return ONLY valid JSON matching this schema:
{
  "shouldExtractMemories": boolean,
  "shouldGenerateSuggestions": boolean,
  "shouldUpdateCharacterProfile": boolean,
  "shouldUpdateThreadSummary": boolean,
  "sourceConfig": [
    { "source": "memories", "pageSize": number, "priority": "high"|"medium"|"low" }
  ],
  "reasoning": "brief explanation"
}
`

    const { runStructuredOutputWithFallback } = yield* Effect.promise(() =>
      import("./sushi/structuredOutput").then((m) => ({
        runStructuredOutputWithFallback: m.runStructuredOutputWithFallback,
      })),
    )
    const { getEffectModelLayer } = yield* Effect.promise(() =>
      import("./sushi/aiProvider").then((m) => ({
        getEffectModelLayer: m.getEffectModelLayer,
      })),
    )

    const { layer: modelLayer } = yield* Effect.promise(() =>
      getEffectModelLayer({ source: "autonomous" }),
    )
    const parsed = yield* Effect.tryPromise({
      try: () =>
        runStructuredOutputWithFallback(
          BgJobDecision,
          decisionPrompt,
          modelLayer,
        ),
      catch: (e) => new BgJobError({ jobId: schema.meta.threadId, cause: e }),
    })

    return parsed
  })

// ============================================
// 🚀 STEP 5: FULL PIPELINE
// Compose all steps
// ============================================

export const runAiPipeline = (params: {
  appId?: string
  appSlug?: string
  userId?: string
  guestId?: string
  threadId: string
  language: string
  modelId: string
  source?: string
  isBurn?: boolean
  isJob?: boolean
  jobType?: string
  messageCount?: number
}) =>
  pipe(
    // Step 1: resolve context
    resolveContext({
      appId: params.appId,
      appSlug: params.appSlug,
      userId: params.userId,
      guestId: params.guestId,
      threadId: params.threadId,
      source: params.source,
    }),

    // Step 2: build schema (data-driven)
    Effect.flatMap((app) =>
      buildpromptSchema({
        app: app ?? null,
        user: null, // inject from session
        guest: null,
        threadId: params.threadId,
        language: params.language,
        modelId: params.modelId,
        isBurn: params.isBurn,
        isJob: params.isJob,
        jobType: params.jobType,
        messageCount: params.messageCount,
      }).pipe(Effect.map((schema) => ({ app, schema }))),
    ),

    // Step 3: render sections (parallel)
    Effect.flatMap(({ app, schema }) =>
      renderSections(schema, app ?? null, null, null).pipe(
        Effect.map((renderedSchema) => ({ app, schema: renderedSchema })),
      ),
    ),

    // Step 4: bg job decision (agent decides)
    Effect.flatMap(({ app, schema }) =>
      makeBgJobDecision(schema, {
        messageCount: params.messageCount ?? 0,
        hasFiles: false,
        hasMemoriesEnabled: true,
        hasCharacterProfilesEnabled: true,
        isFirstMessage: (params.messageCount ?? 0) === 0,
      }).pipe(Effect.map((decision) => ({ app, schema, decision }))),
    ),

    // Error handling - fallback to safe defaults
    Effect.catchTag("ContextResolveError", (e) =>
      Effect.logError(`Context resolve failed: ${e.cause}`).pipe(
        Effect.flatMap(() =>
          Effect.fail(new ContextResolveError({ cause: e.cause })),
        ),
      ),
    ),
    Effect.catchTag("ModelRouteError", (e) =>
      Effect.succeed({
        app: null,
        schema: null,
        decision: {
          shouldExtractMemories: false,
          shouldGenerateSuggestions: false,
          shouldUpdateCharacterProfile: false,
          shouldUpdateThreadSummary: true,
          sourceConfig: [],
          reasoning: `Model route error: ${e.reason}`,
        } satisfies BgJobDecision,
      }),
    ),
  )

// ============================================
// 🎯 LAYER - DI için
// ============================================

export const PipelineLive = Layer.succeed(PipelineContext, {
  app: null,
  user: null,
  guest: null,
  threadId: "",
  language: "en",
  isBurn: false,
  isJob: false,
})

// Export convenience runner
export const runPipeline = <A, E>(
  effect: Effect.Effect<A, E, PipelineContext>,
) => Effect.runPromise(Effect.provide(effect, PipelineLive))

// packages/ai-core/src/pipeline/bgJob.ts
// ============================================
// 🦛 BG JOB RUNNER
// makeBgJobDecision sonucuna göre çalışır
// generateAIContent'in yerini alır
// ============================================

// import { Effect } from "effect"
// import type { BgJobDecision } from "./index"
// import { BgJobError } from "./index"

export const executeBgJob = (
  decision: BgJobDecision,
  context: {
    threadId: string
    userId?: string
    guestId?: string
    appId?: string
    agentId: string
    conversationText: string
    language: string
    modelProvider: any
    modelName: string
    memoriesEnabled?: boolean
    characterProfilesEnabled?: boolean
    message: any
    app?: any
    user?: any
    guest?: any
    c?: any
    thread?: any
  },
) =>
  Effect.gen(function* () {
    const tasks: Effect.Effect<void, BgJobError>[] = []

    // Agent kararına göre task'ları seç
    if (decision.shouldExtractMemories) {
      tasks.push(
        Effect.tryPromise({
          try: async () => {
            const { extractAndSaveMemories } = await import("./memories").catch(
              () => ({
                extractAndSaveMemories: async () => {},
              }),
            )
            await extractAndSaveMemories(
              context.conversationText,
              context.modelProvider,
              context.modelName,
              context.userId,
              context.guestId,
              context.appId,
              context.threadId,
              context.message?.id,
              context.memoriesEnabled,
              context.app,
            )
          },
          catch: (e) => new BgJobError({ jobId: context.threadId, cause: e }),
        }),
      )
    }

    if (decision.shouldUpdateThreadSummary) {
      tasks.push(
        Effect.tryPromise({
          try: async () => {
            const { updateSummary } = await import("./summary").catch(() => ({
              updateSummary: async () => {},
            }))
            await updateSummary(context)
          },
          catch: (e) => new BgJobError({ jobId: context.threadId, cause: e }),
        }),
      )
    }

    if (decision.shouldGenerateSuggestions) {
      tasks.push(
        Effect.tryPromise({
          try: async () => {
            const { generateSuggestions } = await import("./suggestions").catch(
              () => ({
                generateSuggestions: async () => {},
              }),
            )
            await generateSuggestions(context)
          },
          catch: (e) => new BgJobError({ jobId: context.threadId, cause: e }),
        }),
      )
    }

    if (
      decision.shouldUpdateCharacterProfile &&
      context.characterProfilesEnabled
    ) {
      tasks.push(
        Effect.tryPromise({
          try: async () => {
            const { updateCharacterProfile } = await import(
              "./character"
            ).catch(() => ({
              updateCharacterProfile: async () => {},
            }))
            await updateCharacterProfile(context)
          },
          catch: (e) => new BgJobError({ jobId: context.threadId, cause: e }),
        }),
      )
    }

    // Hepsini parallel çalıştır
    yield* Effect.all(tasks, { concurrency: "unbounded" })

    console.log(
      `✅ BgJob complete: ${JSON.stringify({
        memories: decision.shouldExtractMemories,
        suggestions: decision.shouldGenerateSuggestions,
        character: decision.shouldUpdateCharacterProfile,
        summary: decision.shouldUpdateThreadSummary,
      })}`,
    )
  })

// generateAIContent'i replace eden adapter
// Mevcut kod bunu çağırır, içeride Effect pipeline çalışır
export const generateAIContentV2 = async (params: {
  thread: any
  user: any
  guest: any
  agentId: string
  conversationHistory: any[]
  message: any
  language: string
  app?: any
  c?: any
  isE2E?: boolean
}) => {
  const runAiPipelineLocal = (await import("./pipleline")).runAiPipeline
  const executeBgJobLocal = executeBgJob

  const conversationText = params.conversationHistory
    .map(
      (m) =>
        `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`,
    )
    .join("\n")

  // Pipeline çalıştır - schema + decision
  const result: any = await Effect.runPromise(
    runAiPipelineLocal({
      appId: params.app?.id,
      userId: params.user?.id,
      guestId: params.guest?.id,
      threadId: params.thread.id,
      language: params.language,
      modelId: "deepseek/deepseek-v3.2",
      source: "ai/content",
      isBurn: params.thread.isIncognito,
      messageCount: params.conversationHistory.length,
    }).pipe(
      Effect.catchAll((e) => {
        console.error("Pipeline error:", e)
        return Effect.succeed({ app: null, schema: null, decision: null })
      }),
    ),
  )

  if (!result.decision) return

  // Bg job'u agent'ın kararına göre çalıştır
  const { getModelProvider } = await import("@chrryai/machine")
  const model = await getModelProvider({
    source: "ai/content",
    app: params.app,
  })

  await Effect.runPromise(
    executeBgJobLocal(result.decision, {
      threadId: params.thread.id,
      userId: params.user?.id,
      guestId: params.guest?.id,
      appId: params.app?.id,
      agentId: params.agentId,
      conversationText,
      language: params.language,
      modelProvider: model.modelId,
      modelName: model.agentName,
      memoriesEnabled:
        params.user?.memoriesEnabled || params.guest?.memoriesEnabled,
      characterProfilesEnabled:
        params.user?.characterProfilesEnabled ||
        params.guest?.characterProfilesEnabled,
      message: params.message,
      app: params.app,
      user: params.user,
      guest: params.guest,
      c: params.c,
      thread: params.thread,
    }).pipe(
      Effect.catchAll((e) => {
        console.error("BgJob error:", e)
        return Effect.succeed(undefined)
      }),
    ),
  )
}
