import type { guest, nil, sushi, user } from "@chrryai/donut/types"
import * as AiEmbeddingModel from "@effect/ai/EmbeddingModel"
import * as AiLanguageModel from "@effect/ai/LanguageModel"
import { OpenAiLanguageModel } from "@effect/ai-openai"
import { Context, Data, Effect, type Layer } from "effect"
import { decrypt } from "../../../encryption"
import type { JobWithModelConfig } from "./model-capabilities"
import {
  AGENT_DEFAULTS,
  modelCapabilities,
  SOURCES,
} from "./model-capabilities"

function safeDecrypt(key: string | undefined): string | undefined {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    return undefined
  }
}

// ============================================
// PROVIDER CONFIG - Context tag
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
// ERRORS
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
// RESOLVE CONFIG
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
          try: () => safeDecrypt(accountKey) ?? "",
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

    return yield* Effect.succeed(
      Context.make(ProviderConfig, {
        apiKey,
        modelId,
        agentName: resolvedName,
        supportsTools: caps?.tools ?? false,
        canAnalyze: caps?.canAnalyze ?? false,
        isBYOK,
        isFree: isFreeTier,
        isBELES: resolvedName === "beles",
      }),
    ).pipe(Effect.map((ctx) => Context.get(ctx, ProviderConfig)))
  })

// ============================================
// LANGUAGE MODEL LAYERS
// ============================================

export const ServerLanguageModelLayer = (
  config: ProviderConfig["Type"],
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layerCompletions({
    model: config.modelId,
    apiKey: config.apiKey,
    baseURL: config.baseUrl ?? "https://openrouter.ai/api/v1",
  } as any)

export const ClientLanguageModelLayer = (
  config: Pick<ProviderConfig["Type"], "modelId">,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layerCompletions({
    model: config.modelId,
    apiKey: "proxy",
    baseURL: "/api/ai/v1",
  } as any)

export const EmbeddingModelLayer = (
  config: ProviderConfig["Type"],
): Layer.Layer<AiEmbeddingModel.EmbeddingModel<string>> =>
  OpenAiLanguageModel.layerEmbeddings({
    model: "openai/text-embedding-3-small",
    apiKey: config.apiKey,
    baseURL: config.baseUrl ?? "https://openrouter.ai/api/v1",
  } as any)

// ============================================
// UNIFIED PROVIDER
// ============================================

export type AiProvider = {
  readonly languageModel: AiLanguageModel.LanguageModel
  readonly embeddingModel: AiEmbeddingModel.EmbeddingModel<string>
  readonly config: ProviderConfig["Type"]
}

export const makeAiProvider = (
  params: Parameters<typeof resolveProviderConfig>[0],
): Effect.Effect<AiProvider, ProviderError> =>
  Effect.gen(function* () {
    const config = yield* resolveProviderConfig(params)

    const lmLayer = ServerLanguageModelLayer(config)
    const emLayer = EmbeddingModelLayer(config)

    const languageModel = yield* Effect.provide(
      AiLanguageModel.LanguageModel,
      lmLayer,
    )

    const embeddingModel = yield* Effect.provide(
      AiEmbeddingModel.EmbeddingModel,
      emLayer,
    )

    return { languageModel, embeddingModel, config }
  })

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

export type { JobWithModelConfig }
