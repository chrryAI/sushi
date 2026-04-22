// // ─────────────────────────────────────────────────────────────────
// // sushi/providerProtocolService.ts — @providerprotocol/ai as Effect Service
// //
// // Wraps @providerprotocol/ai (UPP) inside Effect's DI system.
// // Effect handles: dependency injection, error handling, retry, observability.
// // UPP handles: actual AI calls, streaming, reasoning, tool execution.
// //
// // This replaces Vercel AI SDK's streamText/generateText calls
// // while keeping Effect as the orchestration layer.
// // ─────────────────────────────────────────────────────────────────

// import { llm, embedding } from "@providerprotocol/ai"
// import { openrouter } from "@providerprotocol/ai/openrouter"
// import { anthropic } from "@providerprotocol/ai/anthropic"
// import { openai } from "@providerprotocol/ai/openai"
// import type {
//   Turn,
//   StreamResult,
//   StreamEvent,
//   StreamEventType,
//   Message,
//   Thread,
//   Tool,
//   Structure,
//   TokenUsage,
//   ContentBlock,
//   TextBlock,
//   ReasoningBlock,
//   LLMCapabilities,
//   UPPError,
//   ErrorCode,
//   LLMInstance,
// } from "@providerprotocol/ai"
// import {
//   Context,
//   Effect,
//   Layer,
//   type Schema,
//   Stream,
//   Schedule,
//   type Duration,
// } from "effect"
// import { isDevelopment } from "../../../index"
// import {
//   getModelProvider,
//   type modelProviderOptions,
// } from "./provider"

// // ─────────────────────────────────────────────────────────────────
// // UPP Error → Effect typed error
// // ─────────────────────────────────────────────────────────────────

// export class ProviderProtocolError {
//   readonly _tag = "ProviderProtocolError"
//   constructor(
//     readonly code: string,
//     readonly message: string,
//     readonly provider: string,
//     readonly statusCode?: number,
//     readonly cause?: unknown,
//   ) {}
// }

// export class ModelResolutionError {
//   readonly _tag = "ModelResolutionError"
//   constructor(readonly message: string, readonly cause?: unknown) {}
// }

// // ─────────────────────────────────────────────────────────────────
// // Service interface
// // ─────────────────────────────────────────────────────────────────

// export interface ProviderProtocolAI {
//   /** Generate a complete response (non-streaming) */
//   readonly generate: (
//     input: string | Message[],
//     options?: PPGenericOptions,
//   ) => Effect.Effect<PPGenerateResult, ProviderProtocolError | ModelResolutionError>

//   /** Stream a response (returns Effect Stream of events) */
//   readonly stream: (
//     input: string | Message[],
//     options?: PPGenericOptions,
//   ) => Effect.Effect<PPStreamResult, ProviderProtocolError | ModelResolutionError>

//   /** Get model info without creating an instance */
//   readonly resolveModel: (
//     options: modelProviderOptions,
//   ) => Effect.Effect<PPModelInfo, ModelResolutionError>
// }

// // ─────────────────────────────────────────────────────────────────
// // Types — bridge between UPP and our existing system
// // ─────────────────────────────────────────────────────────────────

// export interface PPGenericOptions {
//   /** System prompt */
//   system?: string
//   /** Temperature (0-2) */
//   temperature?: number
//   /** Max output tokens */
//   maxOutputTokens?: number
//   /** Tools (UPP Tool format) */
//   tools?: Tool[]
//   /** Tool choice */
//   toolChoice?: "auto" | "required" | "none" | { tool: string }
//   /** Reasoning effort (for OpenRouter) */
//   reasoningEffort?: "xhigh" | "high" | "medium" | "low" | "minimal" | "none"
//   /** Provider-specific params */
//   params?: Record<string, unknown>
//   /** Abort signal */
//   signal?: AbortSignal
//   /** Callback when generation finishes */
//   onFinish?: (result: PPGenerateResult) => void | Promise<void>
// }

// export interface PPGenerateResult {
//   /** The final text response */
//   text: string
//   /** Reasoning content (if model supports it) */
//   reasoning: string | null
//   /** All content blocks from response */
//   contentBlocks: ContentBlock[]
//   /** Token usage */
//   usage: TokenUsage
//   /** Number of inference cycles (1 + tool rounds) */
//   cycles: number
//   /** All messages in the turn */
//   messages: Message[]
//   /** Tool executions (if any) */
//   toolExecutions: unknown[]
//   /** Model ID that was used */
//   modelId: string
//   /** Agent name */
//   agentName: string
//   /** Key source */
//   keySource: string
//   /** Free model? */
//   isFree: boolean
//   /** BYOK? */
//   isBYOK: boolean
//   /** Degraded? */
//   isDegraded?: boolean
// }

// export interface PPStreamResult {
//   /** Effect Stream of UPP StreamEvents */
//   stream: Stream.Stream<StreamEvent, ProviderProtocolError>
//   /** Promise-like: resolves when stream finishes */
//   turn: Effect.Effect<Turn, ProviderProtocolError>
//   /** Abort the stream */
//   abort: () => void
//   /** Model info */
//   modelId: string
//   agentName: string
//   keySource: string
// }

// export interface PPModelInfo {
//   modelId: string
//   agentName: string
//   keySource: string
//   isFree: boolean
//   isBYOK: boolean
//   supportsTools: boolean
//   canAnalyze: boolean
//   isDegraded?: boolean
// }

// // ─────────────────────────────────────────────────────────────────
// // Effect Tag (Service identifier)
// // ─────────────────────────────────────────────────────────────────

// export class ProviderProtocolAI extends Context.Tag("@chrryai/machine/ProviderProtocolAI")<
//   ProviderProtocolAI,
//   {
//     generate: (
//       input: string | Message[],
//       options?: PPGenericOptions,
//     ) => Effect.Effect<PPGenerateResult, ProviderProtocolError | ModelResolutionError>

//     stream: (
//       input: string | Message[],
//       options?: PPGenericOptions,
//     ) => Effect.Effect<PPStreamResult, ProviderProtocolError | ModelResolutionError>

//     resolveModel: (
//       options: modelProviderOptions,
//     ) => Effect.Effect<PPModelInfo, ModelResolutionError>
//   }
// ) {}

// // ─────────────────────────────────────────────────────────────────
// // Helpers — UPP error → Effect error
// // ─────────────────────────────────────────────────────────────────

// function uppToEffectError(err: unknown): ProviderProtocolError {
//   if (err && typeof err === "object" && "code" in err && "provider" in err) {
//     const upp = err as UPPError
//     return new ProviderProtocolError(
//       upp.code,
//       upp.message,
//       upp.provider,
//       upp.statusCode,
//       upp.cause,
//     )
//   }
//   return new ProviderProtocolError(
//     "PROVIDER_ERROR",
//     err instanceof Error ? err.message : String(err),
//     "unknown",
//     undefined,
//     err,
//   )
// }

// // ─────────────────────────────────────────────────────────────────
// // UPP model factory — creates LLMInstance from our provider system
// // ─────────────────────────────────────────────────────────────────

// function createPPModel(
//   modelId: string,
//   apiKey: string,
//   options?: PPGenericOptions,
// ): LLMInstance {
//   const isOllama = modelId.startsWith("ollama/")
//   const isDirectAnthropic =
//     modelId.startsWith("anthropic/") && !modelId.includes("openrouter")
//   const isDirectOpenAI =
//     modelId.startsWith("openai/") && !modelId.includes("openrouter")

//   // Clean model IDs — strip provider prefixes for direct providers
//   const cleanId = (id: string) => id.replace(/^(anthropic|openai|openrouter)\//, "")

//   // Build UPP model reference
//   let model: ReturnType<typeof openrouter | typeof anthropic | typeof openai>

//   if (isDirectAnthropic) {
//     model = anthropic(cleanId(modelId))
//   } else if (isDirectOpenAI) {
//     model = openai(cleanId(modelId))
//   } else {
//     // Default: go through OpenRouter for everything
//     model = openrouter(modelId, {
//       // Use Chat Completions API (not Responses API)
//       api: "completions",
//     })
//   }

//   // Build params
//   const params: Record<string, unknown> = {
//     ...options?.params,
//   }
//   if (options?.maxOutputTokens !== undefined) {
//     params.max_tokens = options.maxOutputTokens
//   }
//   if (options?.temperature !== undefined) {
//     params.temperature = options.temperature
//   }
//   if (options?.reasoningEffort !== undefined) {
//     params.reasoning = {
//       effort: options.reasoningEffort,
//       exclude: false,
//     }
//   }

//   return llm({
//     model,
//     system: options?.system,
//     tools: options?.tools,
//     params: Object.keys(params).length > 0 ? params : undefined,
//     apiKey, // UPP supports inline API key
//   })
// }

// // ─────────────────────────────────────────────────────────────────
// // Layer — Live implementation
// // ─────────────────────────────────────────────────────────────────

// export const ProviderProtocolAILive = Layer.succeed(
//   ProviderProtocolAI,
//   {
//     generate: (input, options) =>
//       Effect.gen(function* () {
//         // Resolve model through our existing provider system
//         const modelResult = yield* Effect.tryPromise({
//           try: () => getModelProvider({ ...options?._modelOptions, isEffect: false }),
//           catch: (e) => new ModelResolutionError("Failed to resolve model", e),
//         })

//         const apiKey = isDevelopment
//           ? process.env.OPENROUTER_SUSHI!
//           : process.env.OPENROUTER_API_KEY!

//         const effectiveKey = modelResult.isBYOK
//           ? apiKey // TODO: get BYOK key from modelResult
//           : apiKey

//         const instance = createPPModel(
//           modelResult.modelId,
//           effectiveKey,
//           options,
//         )

//         // Call UPP generate
//         const turn = yield* Effect.tryPromise({
//           try: () => instance.generate(input),
//           catch: (e) => uppToEffectError(e),
//         })

//         // Extract reasoning from content blocks
//         const reasoning = turn.response.content
//           ?.filter((b: ContentBlock) => b.type === "reasoning")
//           .map((b: ReasoningBlock) => b.text)
//           .join("\n") ?? null

//         const text = turn.response.text ?? ""

//         return {
//           text,
//           reasoning,
//           contentBlocks: turn.response.content ?? [],
//           usage: turn.usage,
//           cycles: turn.cycles,
//           messages: turn.messages,
//           toolExecutions: turn.toolExecutions,
//           modelId: modelResult.modelId,
//           agentName: modelResult.agentName,
//           keySource: modelResult.lastKey,
//           isFree: modelResult.isFree ?? false,
//           isBYOK: modelResult.isBYOK,
//           isDegraded: modelResult.isDegraded,
//         } satisfies PPGenerateResult
//       }),

//     stream: (input, options) =>
//       Effect.gen(function* () {
//         // Resolve model through our existing provider system
//         const modelResult = yield* Effect.tryPromise({
//           try: () => getModelProvider({ ...options?._modelOptions, isEffect: false }),
//           catch: (e) => new ModelResolutionError("Failed to resolve model", e),
//         })

//         const apiKey = isDevelopment
//           ? process.env.OPENROUTER_SUSHI!
//           : process.env.OPENROUTER_API_KEY!

//         const instance = createPPModel(
//           modelResult.modelId,
//           apiKey,
//           options,
//         )

//         // Call UPP stream
//         const streamResult = instance.stream(input)

//         // Wrap UPP AsyncIterable → Effect Stream
//         const effectStream = Stream.fromAsyncIterable(
//           streamResult as AsyncIterable<StreamEvent>,
//           (e) => uppToEffectError(e),
//         )

//         // Wrap UPP Turn promise → Effect
//         const turnEffect = Effect.tryPromise({
//           try: () => streamResult.turn,
//           catch: (e) => uppToEffectError(e),
//         })

//         return {
//           stream: effectStream,
//           turn: turnEffect,
//           abort: () => streamResult.abort(),
//           modelId: modelResult.modelId,
//           agentName: modelResult.agentName,
//           keySource: modelResult.lastKey,
//         } satisfies PPStreamResult
//       }),

//     resolveModel: (options) =>
//       Effect.gen(function* () {
//         const result = yield* Effect.tryPromise({
//           try: () => getModelProvider({ ...options, isEffect: false }),
//           catch: (e) => new ModelResolutionError("Failed to resolve model", e),
//         })

//         return {
//           modelId: result.modelId,
//           agentName: result.agentName,
//           keySource: result.lastKey,
//           isFree: result.isFree ?? false,
//           isBYOK: result.isBYOK,
//           supportsTools: result.supportsTools,
//           canAnalyze: result.canAnalyze,
//           isDegraded: result.isDegraded,
//         } satisfies PPModelInfo
//       }),
//   },
// )

// // ─────────────────────────────────────────────────────────────────
// // Convenience: async bridge (for non-Effect code like Hono routes)
// // ─────────────────────────────────────────────────────────────────

// /**
//  * Quick generate without Effect Layer — for Hono routes and scripts.
//  * Resolves model via getModelProvider, calls UPP, returns result.
//  */
// export async function ppGenerate(
//   input: string | Message[],
//   modelOptions: modelProviderOptions,
//   genOptions?: PPGenericOptions,
// ): Promise<PPGenerateResult> {
//   const modelResult = await getModelProvider({ ...modelOptions, isEffect: false })

//   const apiKey = isDevelopment
//     ? process.env.OPENROUTER_SUSHI!
//     : process.env.OPENROUTER_API_KEY!

//   const instance = createPPModel(modelResult.modelId, apiKey, genOptions)
//   const turn = await instance.generate(input)

//   const reasoning = turn.response.content
//     ?.filter((b: ContentBlock) => b.type === "reasoning")
//     .map((b: ReasoningBlock) => b.text)
//     .join("\n") ?? null

//   const result: PPGenerateResult = {
//     text: turn.response.text ?? "",
//     reasoning,
//     contentBlocks: turn.response.content ?? [],
//     usage: turn.usage,
//     cycles: turn.cycles,
//     messages: turn.messages,
//     toolExecutions: turn.toolExecutions,
//     modelId: modelResult.modelId,
//     agentName: modelResult.agentName,
//     keySource: modelResult.lastKey,
//     isFree: modelResult.isFree ?? false,
//     isBYOK: modelResult.isBYOK,
//     isDegraded: modelResult.isDegraded,
//   }

//   await genOptions?.onFinish?.(result)
//   return result
// }

// /**
//  * Quick stream without Effect Layer — for Hono routes.
//  * Returns UPP's StreamResult directly (iterable + turn promise).
//  */
// export async function ppStream(
//   input: string | Message[],
//   modelOptions: modelProviderOptions,
//   streamOptions?: PPGenericOptions,
// ): Promise<{ streamResult: StreamResult; modelInfo: PPModelInfo }> {
//   const modelResult = await getModelProvider({ ...modelOptions, isEffect: false })

//   const apiKey = isDevelopment
//     ? process.env.OPENROUTER_SUSHI!
//     : process.env.OPENROUTER_API_KEY!

//   const instance = createPPModel(modelResult.modelId, apiKey, streamOptions)
//   const streamResult = instance.stream(input)

//   return {
//     streamResult,
//     modelInfo: {
//       modelId: modelResult.modelId,
//       agentName: modelResult.agentName,
//       keySource: modelResult.lastKey,
//       isFree: modelResult.isFree ?? false,
//       isBYOK: modelResult.isBYOK,
//       supportsTools: modelResult.supportsTools,
//       canAnalyze: modelResult.canAnalyze,
//       isDegraded: modelResult.isDegraded,
//     },
//   }
// }

// // ─────────────────────────────────────────────────────────────────
// // Bridge: Vercel AI SDK compatible interface
// //
// // These provide drop-in replacements for streamText/generateText
// // using UPP under the hood. Same interface consumers expect.
// // ─────────────────────────────────────────────────────────────────

// export type VercelLikeStreamPart =
//   | { type: "text-delta"; text: string }
//   | { type: "reasoning-start" }
//   | { type: "reasoning-delta"; text: string }
//   | { type: "reasoning-end" }
//   | { type: "tool-call"; toolName: string; args: any }
//   | { type: "tool-result"; toolName: string; result: any }
//   | { type: "finish"; usage: { inputTokens: number; outputTokens: number } }
//   | { type: "error"; error: unknown }

// export interface VercelLikeStreamResult {
//   /** Async iterable of text chunks (for SSE streaming) */
//   textStream: AsyncIterable<string>
//   /** Async iterable of all stream parts (reasoning, text, tool calls, etc.) */
//   fullStream: AsyncIterable<VercelLikeStreamPart>
//   /** Promise resolving to full text */
//   text: Promise<string>
//   /** Promise resolving to usage info */
//   usage: Promise<{ inputTokens: number; outputTokens: number }>
//   /** Convert to a ReadableStream Response */
//   toTextStreamResponse: () => { body: ReadableStream<Uint8Array> | null }
// }

// /**
//  * Drop-in replacement for Vercel AI SDK's streamText using UPP.
//  * Returns same interface: { textStream, fullStream, text, usage, toTextStreamResponse }.
//  */
// export async function ppStreamText(
//   input: string | Message[],
//   modelOptions: modelProviderOptions,
//   options?: PPGenericOptions,
// ): Promise<VercelLikeStreamResult> {
//   const { streamResult, modelInfo } = await ppStream(input, modelOptions, options)

//   // Shared state
//   const textChunks: string[] = []
//   const allParts: VercelLikeStreamPart[] = []
//   let textResolver: ((value: string) => void) | null = null
//   let usageResolver: ((value: { inputTokens: number; outputTokens: number }) => void) | null = null
//   let streamDone = false

//   const partQueue: VercelLikeStreamPart[] = []
//   let partWaiters: Array<(value: IteratorResult<VercelLikeStreamPart>) => void> = []

//   const textPromise = new Promise<string>((resolve) => {
//     textResolver = resolve
//   })
//   const usagePromise = new Promise<{ inputTokens: number; outputTokens: number }>(
//     (resolve) => {
//       usageResolver = resolve
//     },
//   )

//   function enqueuePart(part: VercelLikeStreamPart) {
//     allParts.push(part)
//     partQueue.push(part)
//     if (partWaiters.length > 0) {
//       const waiter = partWaiters.shift()!
//       waiter({ done: false, value: part })
//     }
//   }

//   function resolveStream() {
//     if (streamDone) return
//     streamDone = true
//     textResolver?.(textChunks.join(""))
//     for (const waiter of partWaiters) {
//       waiter({ done: true, value: undefined as any })
//     }
//     partWaiters = []
//   }

//   // Start consuming UPP stream in background
//   ;(async () => {
//     try {
//       let isReasoning = false

//       for await (const event of streamResult) {
//         switch (event.type) {
//           case "text_delta": {
//             const text = event.delta?.text ?? ""
//             if (text) {
//               textChunks.push(text)
//               enqueuePart({ type: "text-delta", text })
//             }
//             break
//           }
//           case "reasoning_delta":
//           case "reasoning": {
//             // UPP might send reasoning as content_block events
//             const text = (event as any).delta?.text ?? (event as any).text ?? ""
//             if (text) {
//               if (!isReasoning) {
//                 isReasoning = true
//                 enqueuePart({ type: "reasoning-start" })
//               }
//               enqueuePart({ type: "reasoning-delta", text })
//             }
//             break
//           }
//           case "content_block_start": {
//             const blockType = (event as any).content_block?.type
//             if (blockType === "reasoning") {
//               isReasoning = true
//               enqueuePart({ type: "reasoning-start" })
//             }
//             break
//           }
//           case "content_block_stop": {
//             if (isReasoning) {
//               enqueuePart({ type: "reasoning-end" })
//               isReasoning = false
//             }
//             break
//           }
//           case "tool_call_delta":
//           case "tool_call": {
//             const tc = event.delta ?? event
//             enqueuePart({
//               type: "tool-call",
//               toolName: tc.toolName ?? tc.name ?? "unknown",
//               args: tc.args ?? tc.params ?? {},
//             })
//             break
//           }
//           case "tool_result": {
//             enqueuePart({
//               type: "tool-result",
//               toolName: (event as any).toolName ?? (event as any).name ?? "unknown",
//               result: (event as any).result,
//             })
//             break
//           }
//           case "message_stop":
//           case "message_delta": {
//             // Check for usage in message_delta
//             if ((event as any).usage) {
//               const usage = (event as any).usage
//               usageResolver?.({
//                 inputTokens: usage.inputTokens ?? usage.prompt_tokens ?? 0,
//                 outputTokens: usage.outputTokens ?? usage.completion_tokens ?? 0,
//               })
//               enqueuePart({
//                 type: "finish",
//                 usage: {
//                   inputTokens: usage.inputTokens ?? usage.prompt_tokens ?? 0,
//                   outputTokens: usage.outputTokens ?? usage.completion_tokens ?? 0,
//                 },
//               })
//             }
//             break
//           }
//           default: {
//             // Unknown event type — skip or handle custom events
//             break
//           }
//         }
//       }

//       // Get final turn for usage if we didn't get it from events
//       try {
//         const turn = await streamResult.turn
//         const usage = turn.usage
//         if (usageResolver) {
//           usageResolver({
//             inputTokens: (usage as any).inputTokens ?? (usage as any).prompt_tokens ?? 0,
//             outputTokens: (usage as any).outputTokens ?? (usage as any).completion_tokens ?? 0,
//           })
//         }
//         if (!allParts.some((p) => p.type === "finish")) {
//           enqueuePart({
//             type: "finish",
//             usage: {
//               inputTokens: (usage as any).inputTokens ?? (usage as any).prompt_tokens ?? 0,
//               outputTokens: (usage as any).outputTokens ?? (usage as any).completion_tokens ?? 0,
//             },
//           })
//         }
//       } catch {}

//       resolveStream()
//     } catch (err) {
//       enqueuePart({ type: "error", error: err })
//       resolveStream()
//     }
//   })()

//   // textStream: async iterable of text chunks
//   let textChunkIndex = 0
//   const textStream: AsyncIterable<string> = {
//     [Symbol.asyncIterator]() {
//       return {
//         async next() {
//           while (textChunkIndex >= textChunks.length) {
//             if (streamDone) return { done: true, value: undefined }
//             await new Promise((r) => setTimeout(r, 10))
//           }
//           return { done: false, value: textChunks[textChunkIndex++]! }
//         },
//       }
//     },
//   }

//   // fullStream: async iterable of all parts
//   const fullStream: AsyncIterable<VercelLikeStreamPart> = {
//     [Symbol.asyncIterator]() {
//       return {
//         async next() {
//           if (partQueue.length > 0) {
//             const part = partQueue.shift()!
//             return { done: false, value: part }
//           }
//           if (streamDone) {
//             return { done: true, value: undefined }
//           }
//           return new Promise<IteratorResult<VercelLikeStreamPart>>((resolve) => {
//             partWaiters.push(resolve)
//           })
//         },
//       }
//     },
//   }

//   // toTextStreamResponse
//   function toTextStreamResponse(): { body: ReadableStream<Uint8Array> | null } {
//     const encoder = new TextEncoder()
//     const readable = new ReadableStream<Uint8Array>({
//       async start(controller) {
//         try {
//           for await (const part of fullStream) {
//             if (part.type === "text-delta") {
//               controller.enqueue(encoder.encode(part.text))
//             }
//           }
//         } catch {
//           // Stream ended or errored
//         } finally {
//           controller.close()
//         }
//       },
//     })
//     return { body: readable }
//   }

//   return {
//     textStream,
//     fullStream,
//     text: textPromise,
//     usage: usagePromise,
//     toTextStreamResponse,
//   }
// }
