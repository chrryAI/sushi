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

// ─────────────────────────────────────────────────────────────────
// Streaming bridge — full Vercel AI SDK compatible interface
// ─────────────────────────────────────────────────────────────────

/**
 * Stream part types matching Vercel AI SDK's fullStream part types.
 * Effect AI uses `_tag` instead of `type`, and `delta` instead of `text`.
 * This normalizes the interface for consumers.
 */
export type StreamPartType =
  | { type: "text-delta"; text: string }
  | { type: "reasoning-start" }
  | { type: "reasoning-delta"; text: string }
  | { type: "reasoning-end" }
  | { type: "tool-call"; toolName: string; args: any }
  | { type: "tool-result"; toolName: string; result: any }
  | { type: "finish"; usage: { inputTokens: number; outputTokens: number } }
  | { type: "error"; error: unknown }

export interface StreamTextResult {
  /** Async iterable of text chunks (for SSE streaming) */
  textStream: AsyncIterable<string>
  /** Async iterable of all stream parts (reasoning, text, tool calls, etc.) */
  fullStream: AsyncIterable<StreamPartType>
  /** Promise resolving to full text */
  text: Promise<string>
  /** Promise resolving to usage info */
  usage: Promise<{ inputTokens: number; outputTokens: number }>
  /** Convert to a ReadableStream Response (like Vercel's toTextStreamResponse) */
  toTextStreamResponse: () => { body: ReadableStream<Uint8Array> | null }
  /** Promise resolving when stream finishes (for post-processing) */
  onFinish?: Promise<void>
}

export interface StreamTextOptions {
  /** System prompt */
  system?: string
  /** Temperature (0-2) */
  temperature?: number
  /** Max output tokens */
  maxOutputTokens?: number
  /** Effect toolkit for tool calling */
  toolkit?: any
  /** Tool choice: "auto" | "required" | "none" | { tool: string } */
  toolChoice?: any
  /** Disable automatic tool call resolution */
  disableToolCallResolution?: boolean
  /** Callback when stream finishes */
  onFinish?: (result: {
    text: string
    usage: { inputTokens: number; outputTokens: number }
    toolCalls?: any[]
  }) => void | Promise<void>
}

/**
 * Run streaming text generation from async/await code.
 * Returns a Vercel-like interface: { textStream, fullStream, text, usage, toTextStreamResponse, onFinish }.
 * Consumes Effect Stream.Stream<StreamPart> internally.
 * Supports tools, toolChoice, reasoning parts, and onFinish callback.
 *
 * @param prompt - String prompt, or array of messages for multi-turn conversations.
 *                 Messages can be Vercel AI SDK ModelMessage[] or Effect Prompt message format.
 * @param modelLayer - Effect Layer for the language model
 * @param options - Stream options (system, temperature, toolkit, etc.)
 */
export async function runStreamText(
  prompt: string | any[],
  modelLayer: Layer.Layer<AiLanguageModel.LanguageModel>,
  options?: StreamTextOptions,
): Promise<StreamTextResult> {
  const program = Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel

    // Build prompt input - support both string and message array
    let promptInput: any
    if (typeof prompt === "string") {
      promptInput = options?.system
        ? Prompt.setSystem(Prompt.make(prompt), options.system)
        : prompt
    } else if (Array.isArray(prompt)) {
      // Convert message array to Effect Prompt
      // Messages can be Vercel AI SDK format: { role, content }
      // or Effect format: { role, content }
      promptInput = Prompt.make(prompt as any)
      if (options?.system) {
        promptInput = Prompt.setSystem(promptInput, options.system)
      }
    } else {
      promptInput = prompt
    }

    // Build options object, only including defined values to avoid "never" type conflicts
    const streamOpts: Record<string, unknown> = { prompt: promptInput }
    if (options?.temperature !== undefined)
      streamOpts.temperature = options.temperature
    if (options?.maxOutputTokens !== undefined)
      streamOpts.maxOutputTokens = options.maxOutputTokens
    if (options?.toolkit !== undefined) streamOpts.toolkit = options.toolkit
    if (options?.toolChoice !== undefined)
      streamOpts.toolChoice = options.toolChoice
    if (options?.disableToolCallResolution !== undefined)
      streamOpts.disableToolCallResolution = options.disableToolCallResolution

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = model.streamText(streamOpts as any)
    return stream
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (await Effect.runPromise(
    (program as any).pipe(Effect.provide(modelLayer)),
  )) as Stream.Stream<any>

  // ── Shared state ──────────────────────────────────────────────
  const textChunks: string[] = []
  const allParts: StreamPartType[] = []
  const toolCalls: any[] = []
  let textResolver: ((value: string) => void) | null = null
  let usageResolver:
    | ((value: { inputTokens: number; outputTokens: number }) => void)
    | null = null
  let streamDone = false
  let streamError: unknown = null

  // Part queue for fullStream async iterator
  const partQueue: StreamPartType[] = []
  let partWaiters: Array<(value: IteratorResult<StreamPartType>) => void> = []

  const textPromise = new Promise<string>((resolve) => {
    textResolver = resolve
  })
  const usagePromise = new Promise<{
    inputTokens: number
    outputTokens: number
  }>((resolve) => {
    usageResolver = resolve
  })

  // ── Helper: enqueue a part and wake up waiters ────────────────
  function enqueuePart(part: StreamPartType) {
    allParts.push(part)
    partQueue.push(part)
    if (partWaiters.length > 0) {
      const waiter = partWaiters.shift()!
      waiter({ done: false, value: part })
    }
  }

  // ── Start consuming the Effect stream in the background ──────
  Effect.runPromise(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Stream.runForEach(stream as any, (part: any) =>
      Effect.sync(() => {
        // Normalize Effect AI StreamPart → Vercel-like StreamPartType
        switch (part._tag) {
          case "textDelta":
          case "text-delta": {
            const text = part.delta ?? part.text ?? ""
            textChunks.push(text)
            enqueuePart({ type: "text-delta", text })
            break
          }
          case "reasoningDelta":
          case "reasoning-delta": {
            const text = part.delta ?? part.text ?? ""
            enqueuePart({ type: "reasoning-delta", text })
            break
          }
          case "reasoningStart":
          case "reasoning-start": {
            enqueuePart({ type: "reasoning-start" })
            break
          }
          case "reasoningEnd":
          case "reasoning-end": {
            enqueuePart({ type: "reasoning-end" })
            break
          }
          case "toolCall":
          case "tool-call": {
            const tc = {
              toolName: part.name ?? part.toolName,
              args: part.params ?? part.args,
            }
            toolCalls.push(tc)
            enqueuePart({
              type: "tool-call",
              toolName: tc.toolName,
              args: tc.args,
            })
            break
          }
          case "toolResult":
          case "tool-result": {
            enqueuePart({
              type: "tool-result",
              toolName: part.name ?? part.toolName,
              result: part.result,
            })
            break
          }
          case "finish": {
            const usage = {
              inputTokens:
                part.usage?.inputTokens ??
                part.metadata?.usage?.inputTokens ??
                0,
              outputTokens:
                part.usage?.outputTokens ??
                part.metadata?.usage?.outputTokens ??
                0,
            }
            streamDone = true
            textResolver?.(textChunks.join(""))
            usageResolver?.(usage)
            enqueuePart({ type: "finish", usage })
            // Wake up any remaining waiters with done signal
            for (const waiter of partWaiters) {
              waiter({ done: true, value: undefined as any })
            }
            partWaiters = []
            break
          }
          case "error": {
            streamError = part.error ?? part.cause
            enqueuePart({ type: "error", error: streamError })
            streamDone = true
            textResolver?.(textChunks.join(""))
            usageResolver?.({ inputTokens: 0, outputTokens: 0 })
            for (const waiter of partWaiters) {
              waiter({ done: true, value: undefined as any })
            }
            partWaiters = []
            break
          }
        }
      }),
    ),
  )
    .then(async () => {
      // Ensure stream is marked done even if no "finish" part was received
      if (!streamDone) {
        streamDone = true
        textResolver?.(textChunks.join(""))
        usageResolver?.({ inputTokens: 0, outputTokens: 0 })
        for (const waiter of partWaiters) {
          waiter({ done: true, value: undefined as any })
        }
        partWaiters = []
      }
      // Call onFinish callback after stream completes
      if (options?.onFinish) {
        const finalText = textChunks.join("")
        const finalUsage = await usagePromise
        await options.onFinish({
          text: finalText,
          usage: finalUsage,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        })
      }
    })
    .catch((err) => {
      streamDone = true
      streamError = err
      textResolver?.(textChunks.join(""))
      usageResolver?.({ inputTokens: 0, outputTokens: 0 })
      enqueuePart({ type: "error", error: err })
      for (const waiter of partWaiters) {
        waiter({ done: true, value: undefined as any })
      }
      partWaiters = []
      console.error("[runStreamText] stream error:", err)
    })

  // ── textStream: async iterable of text chunks ────────────────
  let textChunkIndex = 0
  const textStream: AsyncIterable<string> = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (textChunkIndex >= textChunks.length) {
            if (streamDone) return { done: true, value: undefined }
            await new Promise((r) => setTimeout(r, 10))
          }
          return { done: false, value: textChunks[textChunkIndex++]! }
        },
      }
    },
  }

  // ── fullStream: async iterable of all parts ──────────────────
  const fullStream: AsyncIterable<StreamPartType> = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          // If there are queued parts, return immediately
          if (partQueue.length > 0) {
            const part = partQueue.shift()!
            return { done: false, value: part }
          }
          // If stream is done and no more parts, finish
          if (streamDone) {
            return { done: true, value: undefined }
          }
          // Wait for a new part to be enqueued
          return new Promise<IteratorResult<StreamPartType>>((resolve) => {
            partWaiters.push(resolve)
          })
        },
      }
    },
  }

  // ── toTextStreamResponse: convert to ReadableStream ──────────
  function toTextStreamResponse(): {
    body: ReadableStream<Uint8Array> | null
  } {
    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of fullStream) {
            if (part.type === "text-delta") {
              controller.enqueue(encoder.encode(part.text))
            }
          }
        } catch {
          // Stream ended or errored
        } finally {
          controller.close()
        }
      },
    })
    return { body: readable }
  }

  return {
    textStream,
    fullStream,
    text: textPromise,
    usage: usagePromise,
    toTextStreamResponse,
  }
}
