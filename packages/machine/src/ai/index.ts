/**
 * AI Module - Effect.js based AI provider management
 * Includes FREE model support for testing
 */

import { Context, Data, Effect, Layer } from "effect"
import type { App, Guest, User } from "../types/index.js"

// ============================================
// Errors
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
}> {}

export class ProviderError extends Data.TaggedError("ProviderError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export type AiError =
  | NoCreditsError
  | NoApiKeyError
  | ModelNotFoundError
  | ProviderError

// ============================================
// FREE Model Registry - For Testing
// ============================================

export const FREE_MODELS = {
  // OpenRouter Free Tier
  "deepseek/deepseek-chat:free": {
    modelId: "deepseek/deepseek-chat:free",
    displayName: "DeepSeek V3 (Free)",
    provider: "openrouter",
    creditCost: 0,
  },
  "deepseek/deepseek-r1:free": {
    modelId: "deepseek/deepseek-r1:free",
    displayName: "DeepSeek R1 (Free)",
    provider: "openrouter",
    creditCost: 0,
  },
  "google/gemini-2.0-flash-exp:free": {
    modelId: "google/gemini-2.0-flash-exp:free",
    displayName: "Gemini 2.0 Flash (Free)",
    provider: "openrouter",
    creditCost: 0,
  },
  "meta-llama/llama-3.3-70b-instruct:free": {
    modelId: "meta-llama/llama-3.3-70b-instruct:free",
    displayName: "Llama 3.3 70B (Free)",
    provider: "openrouter",
    creditCost: 0,
  },
  // Default test model
  default: "deepseek/deepseek-chat:free",
} as const

// ============================================
// Provider Config Service
// ============================================

export const ProviderConfig = Context.GenericTag<{
  apiKey: string
  modelId: string
  baseUrl: string
}>("@chrryai/machine/ProviderConfig")

// ============================================
// Provider Resolution
// ============================================

export interface ResolveProviderInput {
  readonly app?: App | null
  readonly user?: User | null
  readonly guest?: Guest | null
  readonly modelId?: string | null
  readonly preferFree?: boolean // Use free models for testing
}

/**
 * Resolve AI provider with FREE model support for testing
 */
export const resolveProvider = (
  input: ResolveProviderInput,
): Effect.Effect<
  {
    apiKey: string
    modelId: string
    baseUrl: string
    isFree: boolean
  },
  AiError
> =>
  Effect.gen(function* () {
    // Use free model if preferred or no API key available
    const useFreeModel = input.preferFree ?? true

    const modelId = useFreeModel
      ? (input.modelId ?? FREE_MODELS.default)
      : (input.modelId ?? FREE_MODELS.default)

    // Check if it's a free model
    const isFreeModel = modelId.includes(":free")

    // For free models, use OpenRouter with optional key
    // OpenRouter allows some free requests without key
    const apiKey = process.env.OPENROUTER_API_KEY ?? ""

    if (!apiKey && !isFreeModel) {
      return yield* Effect.fail(new NoApiKeyError({ source: "openrouter" }))
    }

    // Check credits (skip for free models)
    const creditsLeft = input.user?.creditsLeft ?? input.guest?.creditsLeft ?? 0
    if (creditsLeft === 0 && !isFreeModel) {
      return yield* Effect.fail(
        new NoCreditsError({
          userId: input.user?.id,
          guestId: input.guest?.id,
        }),
      )
    }

    return {
      apiKey,
      modelId,
      baseUrl: "https://openrouter.ai/api/v1",
      isFree: isFreeModel,
    }
  })

// ============================================
// Language Model Service
// ============================================

export interface GenerateOptions {
  readonly system?: string
  readonly maxTokens?: number
  readonly temperature?: number
}

export interface LanguageModel {
  readonly generate: (
    prompt: string,
    options?: GenerateOptions,
  ) => Effect.Effect<string, AiError>
  readonly generateWithMetadata: (
    prompt: string,
    options?: GenerateOptions,
  ) => Effect.Effect<
    {
      text: string
      model: string
      usage?: { prompt: number; completion: number; total: number }
    },
    AiError
  >
}

export const LanguageModel = Context.GenericTag<LanguageModel>(
  "@chrryai/machine/LanguageModel",
)

/**
 * Create LanguageModel implementation
 */
export const makeLanguageModel = (config: {
  apiKey: string
  modelId: string
  baseUrl: string
}): LanguageModel => ({
  generate: (prompt: string, options?: GenerateOptions) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: async () => {
          const res = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://chrry.ai",
              "X-Title": "Chrry AI Test",
            } as Record<string, string>,
            body: JSON.stringify({
              model: config.modelId,
              messages: [
                ...(options?.system
                  ? [{ role: "system", content: options.system }]
                  : []),
                { role: "user", content: prompt },
              ],
              max_tokens: options?.maxTokens ?? 500,
              temperature: options?.temperature ?? 0.7,
            }),
          })

          if (!res.ok) {
            const error = await res.text()
            throw new Error(`API error ${res.status}: ${error}`)
          }

          return res.json()
        },
        catch: (error) =>
          new ProviderError({
            message:
              error instanceof Error ? error.message : "Generation failed",
            cause: error,
          }),
      })

      const data = response as {
        choices?: Array<{ message?: { content?: string } }>
      }
      return data.choices?.[0]?.message?.content ?? ""
    }),

  generateWithMetadata: (prompt: string, options?: GenerateOptions) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: async () => {
          const res = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://chrry.ai",
              "X-Title": "Chrry AI Test",
            } as Record<string, string>,
            body: JSON.stringify({
              model: config.modelId,
              messages: [
                ...(options?.system
                  ? [{ role: "system", content: options.system }]
                  : []),
                { role: "user", content: prompt },
              ],
              max_tokens: options?.maxTokens ?? 500,
              temperature: options?.temperature ?? 0.7,
            }),
          })

          if (!res.ok) {
            const error = await res.text()
            throw new Error(`API error ${res.status}: ${error}`)
          }

          return res.json()
        },
        catch: (error) =>
          new ProviderError({
            message:
              error instanceof Error ? error.message : "Generation failed",
            cause: error,
          }),
      })

      const data = response as {
        choices?: Array<{ message?: { content?: string } }>
        model?: string
        usage?: { prompt: number; completion: number; total: number }
      }
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        model: data.model ?? config.modelId,
        usage: data.usage,
      }
    }),
})

// ============================================
// Layer Construction
// ============================================

export const LanguageModelLive = Layer.effect(
  LanguageModel,
  Effect.gen(function* () {
    const config = yield* ProviderConfig
    return makeLanguageModel(config)
  }),
)
