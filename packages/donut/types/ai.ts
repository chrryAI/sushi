import type { ramen } from "./index.js"

export interface chrryChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface chrryChatRequest {
  messages: chrryChatMessage[]
  model?: string
  stream?: boolean
  ramen: ramen
}

export interface chrryChatResponse {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: Array<{
    index: number
    message: chrryChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface chrryChatStreamChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<{
    index: number
    delta: Partial<chrryChatMessage>
    finish_reason: string | null
  }>
}

// ============================================
// OpenAI-compatible LanguageModel
// Vercel AI SDK LanguageModelV1 protocol ile uyumlu
// Server: OpenRouter direkt, Client: /api/ai/v1 proxy
// Her ikisi de aynı interface'i görür
// ============================================

export interface chrryLanguageModel {
  readonly specificationVersion: "v1"
  readonly provider: string
  readonly modelId: string
  // Vercel AI SDK generateText/streamText bunu çağırır
  doGenerate(options: unknown): Promise<{
    text?: string
    toolCalls?: unknown[]
    finishReason: string
    usage: { promptTokens: number; completionTokens: number }
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> }
    [key: string]: unknown
  }>
  doStream(options: unknown): Promise<{
    stream: AsyncIterable<unknown>
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> }
  }>
  agentName: string
  lastKey: string
  supportsTools: boolean
  canAnalyze: boolean
  isBYOK: boolean
  isBELEŞ?: boolean
  isFree?: boolean
  /** Kredi bitti, free pool'a düştü — frontend banner gösterebilir */
  isDegraded?: boolean
}

// Provider factory - createOpenAI() gibi
// Server'da gerçek key, client'da proxy url ile oluşturulur
export type chrryProvider = {
  (modelId: string, settings?: Record<string, unknown>): chrryLanguageModel
  chat: (
    modelId: string,
    settings?: Record<string, unknown>,
  ) => chrryLanguageModel
  embedding: (modelId: string, settings?: Record<string, unknown>) => unknown
  readonly baseURL: string
}

// Model metadata - provider callable olmadan
export interface chrryModelMeta {
  modelId: string
  agentName: string
  isBYOK?: boolean
  isFree?: boolean
  isBELEŞ?: boolean
  supportsTools?: boolean
  canAnalyze?: boolean
  canDoWebSearch?: string[]
  canGenerateImage?: string[]
  canGenerateVideo?: string[]
  creditsCost?: number
  appCreditsLeft?: number
  ownerCreditsLeft?: number
}

// Embed model interface
export interface chrryEmbeddingModel {
  readonly specificationVersion: "v1"
  readonly provider: string
  readonly modelId: string
  readonly maxEmbeddingsPerCall: number | null
  doEmbed(options: { values: string[] }): Promise<{
    embeddings: number[][]
    usage?: { tokens: number }
  }>
}

// spatialChopstick.ai ve chrry.ai için - compose edilebilir AI context
// chopStick() gibi çalışır ama callable model döner
export interface chrryAiContext {
  // Pass this directly to generateText(), streamText() from "ai" package
  // Server: OpenRouter provider("model-id")
  // Client: proxy provider("model-id") → /api/ai/v1
  model?: chrryLanguageModel | null
  // Embedding model
  embedding?: chrryEmbeddingModel | null
  // Provider factory - farklı model denemek istersen
  provider?: chrryProvider | null
  // Metadata - UI'da model adı göstermek için
  meta?: chrryModelMeta | null
  /**
   * Assembled prompt sections from buildPrompt: true.
   * Each section is ready to append to your system prompt.
   * `assembled` = all sections joined — single drop-in addition.
   */
  promptSections?: {
    memories: string
    instructions: string
    characterProfiles: string
    placeholders: string
    dna: string
    apps: string
    assembled: string
  } | null
  dnaContext?: string | null
  /**
   * The chopStick payload that produced this context.
   * Stored in thread/message metadata for traceability.
   */
  payload?: {
    agentName?: string
    modelId?: string
    join?: Record<string, any>
    keySource?: "byok" | "app_key" | "system_key" | "free"
    isDegraded?: boolean
    resolvedAt: string
  } | null
}
