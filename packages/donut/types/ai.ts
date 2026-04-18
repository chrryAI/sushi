import type { ramen } from "./index.js"

export interface ChrryChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChrryChatRequest {
  messages: ChrryChatMessage[]
  model?: string
  stream?: boolean
  ramen: ramen
}

export interface ChrryChatResponse {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChrryChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChrryChatStreamChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<{
    index: number
    delta: Partial<ChrryChatMessage>
    finish_reason: string | null
  }>
}

// ============================================
// OpenAI-compatible LanguageModel
// Vercel AI SDK LanguageModelV1 protocol ile uyumlu
// Server: OpenRouter direkt, Client: /api/ai/v1 proxy
// Her ikisi de aynı interface'i görür
// ============================================

export interface ChrryLanguageModel {
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
}

// Provider factory - createOpenAI() gibi
// Server'da gerçek key, client'da proxy url ile oluşturulur
export type ChrryProvider = {
  (modelId: string, settings?: Record<string, unknown>): ChrryLanguageModel
  chat: (
    modelId: string,
    settings?: Record<string, unknown>,
  ) => ChrryLanguageModel
  embedding: (modelId: string, settings?: Record<string, unknown>) => unknown
  readonly baseURL: string
}

// Model metadata - provider callable olmadan
export interface ChrryModelMeta {
  modelId: string
  agentName: string
  isBYOK?: boolean
  isFree?: boolean
  isBELES?: boolean
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
export interface ChrryEmbeddingModel {
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
export interface ChrryAiContext {
  // Pass this directly to generateText(), streamText() from "ai" package
  // Server: OpenRouter provider("model-id")
  // Client: proxy provider("model-id") → /api/ai/v1
  model?: ChrryLanguageModel | null
  // Embedding model
  embedding?: ChrryEmbeddingModel | null
  // Provider factory - farklı model denemek istersen
  provider?: ChrryProvider | null
  // Metadata - UI'da model adı göstermek için
  meta?: ChrryModelMeta | null
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
