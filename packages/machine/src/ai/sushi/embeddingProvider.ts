// ─────────────────────────────────────────────────────────────────
// sushi/embeddingProvider.ts — Effect-based embedding provider
//
// Replaces Vercel AI SDK `embed` / `embedMany` + `getEmbeddingProvider`
// with Effect EmbeddingModel layers + bridge functions.
// ─────────────────────────────────────────────────────────────────

import * as EmbeddingModel from "@effect/ai/EmbeddingModel"
import { OpenAiClient, OpenAiEmbeddingModel } from "@effect/ai-openai"
import { FetchHttpClient } from "@effect/platform"
import { Effect, Layer, Redacted } from "effect"
import { EMBEDDING_SOURCES } from "./aiProvider"

/**
 * Create an Effect EmbeddingModel layer for the given model + API key.
 * Uses @effect/ai-openai with OpenRouter API URL by default.
 */
export function createEmbeddingLayer(
  modelId: string,
  apiKey: string,
  baseUrl = "https://openrouter.ai/api/v1",
): Layer.Layer<EmbeddingModel.EmbeddingModel, never, never> {
  const clientLayer = OpenAiClient.layer({
    apiKey: Redacted.make(apiKey),
    apiUrl: baseUrl,
  }).pipe(Layer.provide(FetchHttpClient.layer))

  return OpenAiEmbeddingModel.layerBatched({
    model: modelId,
    config: {},
  }).pipe(Layer.provide(clientLayer))
}

/**
 * Resolve embedding model ID + API key from app/user/guest context.
 * Mirrors getEmbeddingProvider key resolution logic.
 */
export async function resolveEmbeddingConfig(options: {
  app?: any
  user?: any
  guest?: any
  source?: string
}): Promise<{ modelId: string; apiKey: string } | null> {
  const { app, user, guest, source } = options

  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const isFreeTier = (app: any) => !app?.apiKeys?.openrouter
  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const orKey = byokKey ?? safeDecrypt(app?.apiKeys?.openrouter) ?? systemKey

  const modelId =
    EMBEDDING_SOURCES[source || "default"] ?? EMBEDDING_SOURCES.default

  return { modelId: modelId ?? "qwen/qwen3-embedding-8b", apiKey: orKey! }
}

// Re-export these from provider.ts for the decrypt logic
function byokDecrypt(encrypted: string): string | undefined {
  try {
    const { decrypt } = require("../../../index")
    return decrypt(encrypted)
  } catch {
    return undefined
  }
}

function safeDecrypt(encrypted: string | undefined): string | undefined {
  if (!encrypted) return undefined
  try {
    const { decrypt } = require("../../../index")
    return decrypt(encrypted)
  } catch {
    return undefined
  }
}

// ─────────────────────────────────────────────────────────────────
// Bridge: async wrappers for embedding
// ─────────────────────────────────────────────────────────────────

/**
 * Generate an embedding for a single text string.
 * Drop-in replacement for Vercel AI SDK `embed({ model, value })`.
 */
export async function runEmbed(
  text: string,
  modelLayer: Layer.Layer<EmbeddingModel.EmbeddingModel>,
): Promise<number[]> {
  const program = Effect.gen(function* () {
    const model = yield* EmbeddingModel.EmbeddingModel
    return yield* model.embed(text.substring(0, 8000))
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(modelLayer)))
}

/**
 * Generate embeddings for multiple text strings.
 * Drop-in replacement for Vercel AI SDK `embedMany({ model, values })`.
 */
export async function runEmbedMany(
  texts: string[],
  modelLayer: Layer.Layer<EmbeddingModel.EmbeddingModel>,
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
  return Effect.runPromise((program as any).pipe(Effect.provide(modelLayer)))
}
