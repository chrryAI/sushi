// packages/machine/src/ai/vault/provider.ts

import type { guest, nil, sushi, user } from "@chrryai/donut/types"
import * as AiEmbeddingModel from "@effect/ai/EmbeddingModel"
import * as AiLanguageModel from "@effect/ai/LanguageModel"
import {
  OpenAiClient,
  OpenAiEmbeddingModel,
  OpenAiLanguageModel,
} from "@effect/ai-openai"
import { FetchHttpClient } from "@effect/platform"
import { Context, Data, Effect, Layer, Redacted } from "effect"
import type { JobWithModelConfig } from "./modelCapabilities"
import { AGENT_DEFAULTS, modelCapabilities, SOURCES } from "./modelCapabilities"

// ============================================
// 🔑 PROVIDER CONFIG
// ============================================

export class ProviderConfig extends Context.Tag("ProviderConfig")<
  ProviderConfig,
  {
    readonly apiKey: string
    readonly baseUrl?: string
    readonly modelId: string
    readonly agentName: string
    readonly supportsTools: boolean
    readonly canAnalyze: boolean
    readonly isBYOK: boolean
    readonly isFree: boolean
    readonly isBELES: boolean
  }
>() {}

// ============================================
// 🚨 ERRORS
// ============================================

export class NoCreditsError extends Data.TaggedError("NoCreditsError")<{
  readonly userId?: string
  readonly guestId?: string
}> {}

export class NoApiKeyError extends Data.TaggedError("NoApiKeyError")<{
  readonly source: string
}> {}

export class ModelNotFoundError extends Data.TaggedError("ModelNotFoundError")<{
  readonly modelId: string
  readonly agentName: string
}> {}

export type ProviderError = NoCreditsError | NoApiKeyError | ModelNotFoundError

// ============================================
// 🎯 RESOLVE CONFIG
// ============================================

export const resolveProviderConfig = ({
  app,
  user,
  guest,
  source,
  name,
  modelId: modelIdOverride,
  swarm,
  job,
  canReason = true,
}: {
  app?: sushi | nil
  user?: user | nil
  guest?: guest | nil
  source?: string | nil
  name?: string | nil
  modelId?: string | nil
  canReason?: boolean | nil
  swarm?: { modelId?: string; postType?: string } | nil
  job?: JobWithModelConfig | nil
}): Effect.Effect<ProviderConfig["Type"], ProviderError> =>
  Effect.gen(function* () {
    const resolvedName =
      (name ?? "deepSeek") === "peach" ? "deepSeek" : (name ?? "deepSeek")

    const modelId =
      swarm?.modelId ??
      job?.metadata?.modelId ??
      job?.modelConfig?.model ??
      SOURCES[swarm?.postType || ""] ??
      modelIdOverride ??
      SOURCES[source || ""] ??
      (resolvedName === "sushi"
        ? !job
          ? "deepseek/deepseek-r1"
          : "deepseek/deepseek-v3.2"
        : (AGENT_DEFAULTS[resolvedName] ?? "deepseek/deepseek-v3.2"))

    const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
    const isBYOK = !!accountKey

    const byokKey = accountKey
      ? yield* Effect.try({
          try: () => safeDecrypt(accountKey),
          catch: () => new NoApiKeyError({ source: "byok" }),
        })
      : undefined

    const isFreeTier = !["plus", "pro"].includes(app?.tier || "")
    const systemKey = isFreeTier ? process.env.OPENROUTER_API_KEY : undefined
    const appKey = app?.apiKeys?.openrouter
      ? safeDecrypt(app.apiKeys.openrouter)
      : undefined

    const apiKey = byokKey ?? appKey ?? systemKey

    if (!apiKey) {
      return yield* Effect.fail(new NoApiKeyError({ source: "all" }))
    }

    const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1
    if (creditsLeft === 0 && !isBYOK) {
      return yield* Effect.fail(
        new NoCreditsError({ userId: user?.id, guestId: guest?.id }),
      )
    }

    const caps = modelCapabilities[modelId]

    if (!caps) {
      console.warn(
        `[Provider] Unknown modelId "${modelId}" for agent "${resolvedName}". ` +
          `Falling back to no-tools config.`,
      )
    }

    return yield* Effect.succeed(
      Context.make(ProviderConfig, {
        apiKey,
        modelId,
        agentName: resolvedName,
        supportsTools: caps?.tools ?? false,
        canAnalyze: caps?.canAnalyze ?? false,
        isBYOK,
        isFree: isFreeTier,
        isBELES: resolvedName === "beleş",
      }),
    ).pipe(Effect.map((ctx) => Context.get(ctx, ProviderConfig)))
  })

// ============================================
// 🌐 LANGUAGE MODEL LAYER
// Full stack: LanguageModel → OpenAiClient → FetchHttpClient
// ============================================

const makeOpenAiClientLayer = (config: ProviderConfig["Type"]) =>
  OpenAiClient.layer({
    apiKey: Redacted.make(config.apiKey),
    apiUrl: config.baseUrl ?? "https://openrouter.ai/api/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

// SERVER layer — self-contained, no external requirements
export const ServerLanguageModelLayer = (
  config: ProviderConfig["Type"],
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layer({ model: config.modelId }).pipe(
    Layer.provide(makeOpenAiClientLayer(config)),
  )

// CLIENT layer — proxy, no API key needed on client
export const ClientLanguageModelLayer = (
  config: Pick<ProviderConfig["Type"], "modelId">,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layer({ model: config.modelId }).pipe(
    Layer.provide(
      OpenAiClient.layer({
        apiKey: Redacted.make("proxy"),
        apiUrl: "/api/ai/v1",
      }).pipe(Layer.provide(FetchHttpClient.layer)),
    ),
  )

// ============================================
// 🧩 EMBEDDING MODEL LAYER
// ============================================

export const EmbeddingModelLayer = (
  config: ProviderConfig["Type"],
): Layer.Layer<AiEmbeddingModel.EmbeddingModel> =>
  OpenAiEmbeddingModel.layerBatched({
    model: "openai/text-embedding-3-small",
  }).pipe(Layer.provide(makeOpenAiClientLayer(config)))

// ============================================
// 🍱 CHOPSTICK AI EXTENSION
// ============================================

export type chopstickAi = {
  languageModel: Effect.Effect<
    AiLanguageModel.LanguageModel["Type"],
    ProviderError,
    ProviderConfig
  >
  embeddingModel: Effect.Effect<
    AiEmbeddingModel.EmbeddingModel["Type"],
    ProviderError,
    ProviderConfig
  >
  config: Effect.Effect<ProviderConfig["Type"], ProviderError>
}

// ============================================
// 🎛️ UNIFIED PROVIDER
// ============================================

export type AiProvider = {
  readonly languageModel: AiLanguageModel.LanguageModel["Type"]
  readonly embeddingModel: AiEmbeddingModel.EmbeddingModel["Type"]
  readonly config: ProviderConfig["Type"]
}

// Effect program — server'da çalışır, client proxy ile erişir
export const makeAiProvider = (
  params: Parameters<typeof resolveProviderConfig>[0],
): Effect.Effect<AiProvider, ProviderError, never> =>
  Effect.gen(function* () {
    const config = yield* resolveProviderConfig(params)

    const languageModel = yield* AiLanguageModel.LanguageModel.pipe(
      Effect.provide(ServerLanguageModelLayer(config)),
    )

    const embeddingModel = yield* AiEmbeddingModel.EmbeddingModel.pipe(
      Effect.provide(EmbeddingModelLayer(config)),
    )

    return { languageModel, embeddingModel, config }
  }) as Effect.Effect<AiProvider, ProviderError, never>

// ============================================
// 🔄 RUNTIME HELPER
// ============================================

export const runProviderEffect = <A>(
  effect: Effect.Effect<A, ProviderError>,
  fallback: A,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.catchAll((err) => {
        console.warn("[ai-core] provider error:", err._tag)
        return Effect.succeed(fallback)
      }),
    ),
  )

// ============================================
// 📦 EXPORTS
// ============================================

export type { JobWithModelConfig }

// inline helper — uses decrypt from encryption module
function safeDecrypt(value: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { decrypt } = require("../../../encryption")
    return decrypt(value) as string
  } catch {
    return value
  }
}
