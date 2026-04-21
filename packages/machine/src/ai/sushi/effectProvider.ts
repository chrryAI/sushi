// ─────────────────────────────────────────────────────────────────
// sushi/effectProvider.ts — Effect Layer factory for AI providers
//
// Single source of truth: all model selection delegates to
// provider.ts → getModelProvider() / getEmbeddingProvider()
// ─────────────────────────────────────────────────────────────────

import * as EmbeddingModel from "@effect/ai/EmbeddingModel"
import type * as AiLanguageModel from "@effect/ai/LanguageModel"
import {
  OpenAiClient,
  OpenAiEmbeddingModel,
  OpenAiLanguageModel,
} from "@effect/ai-openai"
import { FetchHttpClient } from "@effect/platform"
import { Effect, Layer, Redacted } from "effect"
import { isDevelopment } from "../../../index"
import {
  getEmbeddingProvider,
  getModelProvider,
  type getModelProviderOptions,
  type modelProviderOptions,
} from "./provider"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type EffectModelResult = {
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

export type EffectEmbeddingResult = {
  layer: Layer.Layer<EmbeddingModel.EmbeddingModel>
  modelId: string
  apiKey: string
}

// ─────────────────────────────────────────────────────────────────
// Client layer factories (internal)
// ─────────────────────────────────────────────────────────────────

const makeOpenRouterLayer = (apiKey: string) =>
  OpenAiClient.layer({
    apiKey: Redacted.make(apiKey),
    apiUrl: "https://openrouter.ai/api/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

const makeModelLayer = (
  modelId: string,
  clientLayer: Layer.Layer<OpenAiClient.OpenAiClient>,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layer({ model: modelId }).pipe(Layer.provide(clientLayer))

// ─────────────────────────────────────────────────────────────────
// getEffectModelLayer — delegates to getModelProvider
// ─────────────────────────────────────────────────────────────────

export async function getEffectModelLayer(
  options: modelProviderOptions,
): Promise<EffectModelResult> {
  const result = await getModelProvider(options)

  const apiKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!

  let layer: Layer.Layer<AiLanguageModel.LanguageModel>

  if (result.lastKey === "ollama") {
    layer = makeModelLayer(result.modelId, makeOpenRouterLayer(apiKey))
  } else {
    // openrouter, byok, deepseek, system, fallback
    layer = makeModelLayer(result.modelId, makeOpenRouterLayer(apiKey))
  }

  return {
    layer,
    modelId: result.modelId,
    agentName: result.agentName,
    lastKey: result.lastKey,
    isFree: result.isFree ?? false,
    supportsTools: result.supportsTools,
    canAnalyze: result.canAnalyze,
    isBYOK: result.isBYOK,
    isBELES: result.isBELES ?? false,
    isDegraded: result.isDegraded ?? false,
  }
}

// ─────────────────────────────────────────────────────────────────
// getEmbeddingLayer — delegates to getEmbeddingProvider
// ─────────────────────────────────────────────────────────────────

export async function getEmbeddingLayer(
  options: getModelProviderOptions,
): Promise<EffectEmbeddingResult> {
  const result = await getEmbeddingProvider(options)

  const apiKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!

  const effectiveKey = result.provider
    ? (result.provider as any).apiKey
    : apiKey

  const clientLayer = OpenAiClient.layer({
    apiKey: Redacted.make(effectiveKey),
    apiUrl: "https://openrouter.ai/api/v1",
  }).pipe(Layer.provide(FetchHttpClient.layer))

  const layer = OpenAiEmbeddingModel.layerBatched({
    model: result.modelId ?? "qwen/qwen3-embedding-8b",
    config: {},
  }).pipe(Layer.provide(clientLayer))

  return {
    layer,
    modelId: result.modelId ?? "qwen/qwen3-embedding-8b",
    apiKey: effectiveKey,
  }
}

// ─────────────────────────────────────────────────────────────────
// Bridge helpers (for direct embed calls without Layer)
// ─────────────────────────────────────────────────────────────────

export async function runEmbed(
  text: string,
  layer: Layer.Layer<EmbeddingModel.EmbeddingModel>,
): Promise<number[]> {
  const program = Effect.gen(function* () {
    const model = yield* EmbeddingModel.EmbeddingModel
    return yield* model.embed(text.substring(0, 8000))
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(layer)))
}

export async function runEmbedMany(
  texts: string[],
  layer: Layer.Layer<EmbeddingModel.EmbeddingModel>,
  options?: { concurrency?: number },
): Promise<number[][]> {
  const program = Effect.gen(function* () {
    const model = yield* EmbeddingModel.EmbeddingModel
    return yield* model.embedMany(
      texts.map((t) => t.substring(0, 8000)),
      options,
    )
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(layer)))
}

// ─────────────────────────────────────────────────────────────────
// createModelLayer — for known modelId + apiKey (no routing)
// Used when you already have the modelId from getModelProvider
// ─────────────────────────────────────────────────────────────────

// export function createModelLayer(
//   modelId: string,
//   apiKey: string,
//   baseUrl = "https://openrouter.ai/api/v1",
// ): Layer.Layer<AiLanguageModel.LanguageModel> {
//   const clientLayer = OpenAiClient.layer({
//     apiKey: Redacted.make(apiKey),
//     apiUrl: baseUrl,
//   }).pipe(Layer.provide(FetchHttpClient.layer))

//   return makeModelLayer(modelId, clientLayer)
// }

// ─────────────────────────────────────────────────────────────────
