// ─────────────────────────────────────────────────────────────────
// sushi/structuredOutput.ts — Effect-based structured output wrapper
//
// Replaces `generateText` + `JSON.parse` pattern with
// `LanguageModel.generateObject(schema)` which handles JSON extraction
// and validation natively, eliminating markdown code fence errors.
//
// Includes fallback to `generateText` + `parseAIJson` for models
// that don't support structured output natively.
// ─────────────────────────────────────────────────────────────────

import * as AiLanguageModel from "@effect/ai/LanguageModel"
import * as Prompt from "@effect/ai/Prompt"
import { Effect, type Layer, type Schema, Stream } from "effect"
import { parseAIJson } from "../jsonParser"

// ─────────────────────────────────────────────────────────────────
// generateStructuredOutput — core Effect program
// ─────────────────────────────────────────────────────────────────

/**
 * Generate structured output from an LLM using Effect Schema.
 * Uses `LanguageModel.generateObject` which natively handles JSON
 * extraction, eliminating markdown code fence parsing issues.
 */
export const generateStructuredOutput = <
  A,
  I extends Record<string, unknown>,
  R,
>(
  schema: Schema.Schema<A, I, R>,
  prompt: string | Prompt.Prompt,
  options?: { system?: string },
) =>
  Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel
    const promptInput =
      options?.system && typeof prompt === "string"
        ? Prompt.setSystem(Prompt.make(prompt), options.system)
        : prompt
    const result = yield* model.generateObject({
      prompt: promptInput,
      schema,
    })
    return result.value
  })

// ─────────────────────────────────────────────────────────────────
// generateStructuredOutputWithFallback — with parseAIJson fallback
// ─────────────────────────────────────────────────────────────────

/**
 * Same as generateStructuredOutput but falls back to generateText +
 * parseAIJson if generateObject fails. Useful for models/providers
 * that don't support structured output natively.
 */
export const generateStructuredOutputWithFallback = <
  A,
  I extends Record<string, unknown>,
  R,
>(
  schema: Schema.Schema<A, I, R>,
  prompt: string | Prompt.Prompt,
  options?: { system?: string },
) =>
  Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel

    const promptInput =
      options?.system && typeof prompt === "string"
        ? Prompt.setSystem(Prompt.make(prompt), options.system)
        : prompt

    // Try native structured output first
    const result = yield* Effect.either(
      model.generateObject({
        prompt: promptInput,
        schema,
      }),
    )

    if (result._tag === "Right") {
      return result.right.value
    }

    // Fallback: generate text and parse with robust JSON repair
    console.warn(
      "[structuredOutput] generateObject failed, falling back to generateText + parseAIJson:",
      result.left,
    )

    const textResult = yield* model.generateText({
      prompt: promptInput,
    })

    const parsed = parseAIJson(textResult.text) as A
    return parsed
  })

// ─────────────────────────────────────────────────────────────────
// Bridge: async wrapper for use in non-Effect code
// ─────────────────────────────────────────────────────────────────

/**
 * Run structured output generation from async/await code.
 * Provides an Effect.runPromise bridge for gradual migration.
 */
export async function runStructuredOutput<
  A,
  I extends Record<string, unknown>,
  R,
>(
  schema: Schema.Schema<A, I, R>,
  prompt: string,
  modelLayer: Layer.Layer<AiLanguageModel.LanguageModel>,
  options?: { system?: string },
): Promise<A> {
  const program = generateStructuredOutput(schema, prompt, options)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(modelLayer)))
}

/**
 * Run structured output with fallback from async/await code.
 * Falls back to generateText + parseAIJson if generateObject fails.
 */
export async function runStructuredOutputWithFallback<
  A,
  I extends Record<string, unknown>,
  R,
>(
  schema: Schema.Schema<A, I, R>,
  prompt: string,
  modelLayer: Layer.Layer<AiLanguageModel.LanguageModel>,
  options?: { system?: string },
): Promise<A> {
  const program = generateStructuredOutputWithFallback(schema, prompt, options)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(modelLayer)))
}

/**
 * Run plain text generation from async/await code.
 * For cases where structured output is not needed.
 */
export async function runGenerateText(
  prompt: string,
  modelLayer: Layer.Layer<AiLanguageModel.LanguageModel>,
  options?: { system?: string },
): Promise<string> {
  const program = Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel
    const promptInput = options?.system
      ? Prompt.setSystem(Prompt.make(prompt), options.system)
      : prompt
    const result = yield* model.generateText({
      prompt: promptInput,
    })
    return result.text
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Effect.runPromise((program as any).pipe(Effect.provide(modelLayer)))
}

// ─────────────────────────────────────────────────────────────────
// Streaming bridge
// ─────────────────────────────────────────────────────────────────

export interface StreamTextResult {
  /** Async iterable of text chunks (for SSE streaming) */
  textStream: AsyncIterable<string>
  /** Promise resolving to full text */
  text: Promise<string>
  /** Promise resolving to usage info */
  usage: Promise<{ inputTokens: number; outputTokens: number }>
}

/**
 * Run streaming text generation from async/await code.
 * Returns a Vercel-like interface: { textStream, text, usage }.
 * Consumes Effect Stream.Stream<Response.StreamPart> internally.
 */
export async function runStreamText(
  prompt: string,
  modelLayer: Layer.Layer<AiLanguageModel.LanguageModel>,
  options?: { system?: string; temperature?: number; maxOutputTokens?: number },
): Promise<StreamTextResult> {
  const program = Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel
    const promptInput = options?.system
      ? Prompt.setSystem(Prompt.make(prompt), options.system)
      : prompt

    // Build options object, only including defined values to avoid "never" type conflicts
    const streamOpts: Record<string, unknown> = { prompt: promptInput }
    if (options?.temperature !== undefined)
      streamOpts.temperature = options.temperature
    if (options?.maxOutputTokens !== undefined)
      streamOpts.maxOutputTokens = options.maxOutputTokens

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = model.streamText(streamOpts as any)
    return stream
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (await Effect.runPromise(
    (program as any).pipe(Effect.provide(modelLayer)),
  )) as Stream.Stream<any>

  // Collect all parts from the stream into a shared buffer
  const textChunks: string[] = []
  let textResolver: ((value: string) => void) | null = null
  let usageResolver:
    | ((value: { inputTokens: number; outputTokens: number }) => void)
    | null = null
  let streamDone = false

  const textPromise = new Promise<string>((resolve) => {
    textResolver = resolve
  })
  const usagePromise = new Promise<{
    inputTokens: number
    outputTokens: number
  }>((resolve) => {
    usageResolver = resolve
  })

  // Start consuming the Effect stream in the background
  Effect.runPromise(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Stream.runForEach(stream as any, (part: any) =>
      Effect.sync(() => {
        if (part._tag === "textDelta") {
          textChunks.push(part.delta ?? part.text ?? "")
        }
        if (part._tag === "finish") {
          streamDone = true
          textResolver?.(textChunks.join(""))
          usageResolver?.({
            inputTokens:
              part.usage?.inputTokens ?? part.metadata?.usage?.inputTokens ?? 0,
            outputTokens:
              part.usage?.outputTokens ??
              part.metadata?.usage?.outputTokens ??
              0,
          })
        }
      }),
    ),
  ).catch((err) => {
    streamDone = true
    textResolver?.(textChunks.join(""))
    usageResolver?.({ inputTokens: 0, outputTokens: 0 })
    console.error("[runStreamText] stream error:", err)
  })

  // Async iterator that yields text chunks as they arrive
  let chunkIndex = 0
  const textStream: AsyncIterable<string> = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (chunkIndex >= textChunks.length) {
            if (streamDone) return { done: true, value: undefined }
            await new Promise((r) => setTimeout(r, 10))
          }
          return { done: false, value: textChunks[chunkIndex++]! }
        },
      }
    },
  }

  return { textStream, text: textPromise, usage: usagePromise }
}
