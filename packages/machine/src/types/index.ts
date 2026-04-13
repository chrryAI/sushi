/**
 * Core Types for @chrryai/machine
 */

// ============================================
// Base Types
// ============================================

export type nil = null | undefined

export interface Entity {
  id: string
  createdOn?: Date
  updatedOn?: Date
}

// ============================================
// User & Guest Types
// ============================================

export interface User extends Entity {
  name: string | null
  email: string
  userName: string
  image?: string | null
  role: "admin" | "user"
  credits: number
  creditsLeft?: number
  timezone: string | null
  language: string
  fingerprint: string | null
  isOnline: boolean | null
  apiKeys?: ApiKeys
}

export interface Guest extends Entity {
  fingerprint: string
  email: string | null
  credits: number
  creditsLeft?: number
  timezone: string | null
  language: string
  isOnline: boolean | null
  apiKeys?: ApiKeys
}

export interface ApiKeys {
  openrouter?: string
  openai?: string
  anthropic?: string
}

// ============================================
// App Types
// ============================================

export interface App extends Entity {
  name: string
  slug: string
  title: string
  description: string | null
  systemPrompt: string | null
  icon: string | null
  status: "testing" | "draft" | "active" | "inactive"
  visibility: "private" | "public" | "unlisted"
  userId: string | null
  guestId: string | null
  storeId: string | null
  tier: "free" | "plus" | "pro"
  defaultModel: string | null
  temperature: number | null
}

// ============================================
// AI Types
// ============================================

export interface ModelCapabilities {
  readonly tools: boolean
  readonly canAnalyze: boolean
  readonly canDoWebSearch: boolean
  readonly canGenerateImage: boolean
}

export interface ProviderConfig {
  readonly apiKey: string
  readonly baseUrl?: string
  readonly modelId: string
  readonly agentName: string
  readonly supportsTools: boolean
  readonly canAnalyze: boolean
  readonly isBYOK: boolean
  readonly isFree: boolean
}

// ============================================
// Ramen (Query Config)
// ============================================

export interface JoinConfig {
  user?: number
  app?: number
  dna?: number
  thread?: number
}

export interface Ramen {
  id?: string
  slug?: string
  userId?: string
  guestId?: string
  depth?: number
  skipCache?: boolean
  join?: {
    memories?: JoinConfig
    instructions?: JoinConfig
    characterProfile?: JoinConfig
    placeholders?: JoinConfig
  }
}

// ============================================
// Spatial Types
// ============================================

export interface SpatialPosition {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface SpatialNode {
  readonly app: Pick<App, "id" | "slug" | "name" | "icon" | "storeId">
  readonly timestamp: number
  readonly from?: string
  readonly duration?: number
  readonly position?: SpatialPosition
}
