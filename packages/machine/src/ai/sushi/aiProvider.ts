// ─────────────────────────────────────────────────────────────────
// sushi/aiProvider.ts — Effect Layer factory for AI providers
//
// Single source of truth for ALL AI calls.
// Vercel AI SDK is the transport layer for most providers.
// @providerprotocol/ai handles reasoning, multi-turn, middleware.
// Effect is the orchestration layer throughout.
//
// Capabilities:
//   • Model routing      (delegates to provider.ts)
//   • Streaming          (Effect Stream over Vercel streamText)
//   • Generate text      (Effect-wrapped generateText)
//   • Structured output  (Effect-wrapped + Schema validation)
//   • Embeddings         (Effect-wrapped, batched)
//   • Reasoning          (@providerprotocol/ai thinking blocks)
//   • Multi-turn         (@providerprotocol/ai Thread)
//   • Retry              (Schedule.exponential, per-operation)
//   • Tracing            (Effect.withSpan → OpenTelemetry)
//   • DI                 (Context.Tag service, Layer composition)
// ─────────────────────────────────────────────────────────────────
import crypto from "node:crypto"
import * as AiEmbeddingModel from "@effect/ai/EmbeddingModel"
import * as AiLanguageModel from "@effect/ai/LanguageModel"
import {
  OpenAiClient,
  OpenAiEmbeddingModel,
  OpenAiLanguageModel,
} from "@effect/ai-openai"
import { OpenRouterClient, OpenRouterLanguageModel } from "@effect/ai-openrouter"
import { AnthropicClient, AnthropicLanguageModel } from "@effect/ai-anthropic"
import { FetchHttpClient } from "@effect/platform"
// @providerprotocol/ai — for makePPModel function
import { llm, type Turn } from "@providerprotocol/ai"
import { anthropic, betas } from "@providerprotocol/ai/anthropic"
import { google } from "@providerprotocol/ai/google"
import { groq } from "@providerprotocol/ai/groq"
import { openai } from "@providerprotocol/ai/openai"
import { openrouter } from "@providerprotocol/ai/openrouter"
import { proxy } from "@providerprotocol/ai/proxy"
import {
  type PostgresJsDatabase,
  drizzle as postgresDrizzle,
} from "drizzle-orm/postgres-js"
import Redis from "ioredis"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createOllama } from "ollama-ai-provider" // Kept for potential future use

// ─────────────────────────────────────────────────────────────────
// vault/index.ts — Pricing data, model limits, capabilities, API key helpers
//
// Model routing logic (getModelProvider, getEmbeddingProvider) has moved
// to packages/machine/src/ai/sushi/provider.ts
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ModelProviderResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any
  modelId: string
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

export type JobWithModelConfig = {
  metadata?: { modelId?: string } | null
  modelConfig?: { model?: string } | null
}

export type routeTier = "free" | "cheap" | "mid" | "quality" | "premium"

// ─────────────────────────────────────────────────────────────────
// Pricing table ($/1M tokens)
// ─────────────────────────────────────────────────────────────────

export const prizes: Record<
  string,
  { input: number; output: number; tools: boolean; canAnalyze: boolean | null }
> = {
  "qwen/qwen3.6-plus": {
    input: 0.0,
    output: 0.0,
    tools: true,
    canAnalyze: true,
  },
  "deepseek/deepseek-v3.2": {
    input: 0.28,
    output: 0.4,
    tools: true,
    canAnalyze: null,
  },
  "deepseek/deepseek-v3.2-thinking": {
    input: 0.28,
    output: 0.4,
    tools: true,
    canAnalyze: null,
  },
  "deepseek/deepseek-v3.2-speciale": {
    input: 0.0,
    output: 0.001,
    tools: false,
    canAnalyze: null,
  },
  "minimax/minimax-m2.5": {
    input: 0.3,
    output: 1.1,
    tools: true,
    canAnalyze: null,
  },
  "minimax/minimax-m2.7": {
    input: 0.3,
    output: 1.2,
    tools: true,
    canAnalyze: null,
  },
  "google/gemini-3.1-pro-preview": {
    input: 0.35,
    output: 1.05,
    tools: true,
    canAnalyze: true,
  },
  "x-ai/grok-4.1-fast": {
    input: 0.5,
    output: 2.0,
    tools: true,
    canAnalyze: true,
  },
  "perplexity/sonar-pro": {
    input: 2.0,
    output: 8.0,
    tools: false,
    canAnalyze: null,
  },
  "anthropic/claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    tools: true,
    canAnalyze: true,
  },
  "openai/gpt-5.4": { input: 2.5, output: 15.0, tools: true, canAnalyze: true },
  "openrouter/free": {
    input: 0.0,
    output: 0.0,
    tools: false,
    canAnalyze: false,
  },
  "openai/gpt-oss-120b:free": {
    input: 0.0,
    output: 0.073,
    tools: false,
    canAnalyze: true,
  },
  "gpt-4o": { input: 2.5, output: 10.0, tools: true, canAnalyze: true },
  "gpt-4o-mini": { input: 0.15, output: 0.6, tools: true, canAnalyze: true },
}

// ─────────────────────────────────────────────────────────────────
// Model limits & capabilities
// ─────────────────────────────────────────────────────────────────

interface modelLimits {
  maxTokens: number
  name: string
}

export const DEFAULT_LIMIT: modelLimits = { maxTokens: 64000, name: "Default" }

export const MODEL_LIMITS: Record<string, modelLimits> = {
  "deepseek-chat": { maxTokens: 128000, name: "DeepSeek Chat" },
  "deepseek-reasoner": { maxTokens: 131000, name: "DeepSeek Reasoner" },
  "deepseek/deepseek-chat": { maxTokens: 128000, name: "DeepSeek Chat" },
  "deepseek/deepseek-r1": { maxTokens: 131000, name: "DeepSeek R1" },
  "deepseek/deepseek-v3": { maxTokens: 128000, name: "DeepSeek V3" },
  "deepseek-v3.2": { maxTokens: 163000, name: "DeepSeek V3.2" },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    maxTokens: 262000,
    name: "DeepSeek Thinking",
  },
  "nvidia/nemotron-3-super-120b-a12b": {
    maxTokens: 262000,
    name: "DeepSeek Thinking",
  },
  "qwen/qwen3.6-plus": { maxTokens: 1000000, name: "Qwen 3.6 Plus Preview" },
  "qwen/qwen3-235b-a22b-thinking-2507": {
    maxTokens: 131000,
    name: "Qwen3 Thinking",
  },
  "qwen/qwen3-vl-235b-a22b-thinking": {
    maxTokens: 131000,
    name: "Qwen3 VL Thinking",
  },
  "qwen/qwen3-235b": { maxTokens: 131000, name: "Qwen3" },
  "claude-3-5-sonnet-20241022": {
    maxTokens: 200000,
    name: "Claude 3.5 Sonnet",
  },
  "claude-3-opus-20240229": { maxTokens: 200000, name: "Claude 3 Opus" },
  "anthropic/claude-sonnet-4.5": {
    maxTokens: 200000,
    name: "Claude Sonnet 4.5",
  },
  "anthropic/claude-sonnet-4-6": {
    maxTokens: 200000,
    name: "Claude Sonnet 4.6",
  },
  "claude-sonnet-4-20250514": { maxTokens: 200000, name: "Claude Sonnet 4.5" },
  "gpt-4o-mini": { maxTokens: 128000, name: "gpt-4o-mini" },
  "gpt-4-turbo": { maxTokens: 128000, name: "GPT-4 Turbo" },
  "gpt-3.5-turbo": { maxTokens: 16000, name: "GPT-3.5 Turbo" },
  "gpt-5.1": { maxTokens: 128000, name: "GPT-5.1" },
  "openai/gpt-5.1-chat": { maxTokens: 128000, name: "GPT-5.1" },
  "gpt-5.2-pro": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "openai/gpt-5.2-pro": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "gpt-5.2-2025-12-11": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "gemini-2.0-flash-exp": { maxTokens: 1000000, name: "Gemini 2.0 Flash" },
  "gemini-3.1-pro-preview": { maxTokens: 2000000, name: "Gemini 3.1 Pro" },
  "google/gemini-3.1-pro-preview": {
    maxTokens: 2000000,
    name: "Gemini 3.1 Pro",
  },
  "sonar-pro": { maxTokens: 200000, name: "Sonar Pro" },
  "perplexity/sonar-pro": { maxTokens: 200000, name: "Sonar Pro" },
  "grok-4-1-fast": { maxTokens: 128000, name: "Grok 4.1 Fast" },
  "grok-4-1-fast-reasoning": {
    maxTokens: 128000,
    name: "Grok 4.1 Fast Reasoning",
  },
  "x-ai/grok-4-1-fast-reasoning": {
    maxTokens: 128000,
    name: "Grok 4.1 Fast Reasoning",
  },
  "grok-4-1": { maxTokens: 128000, name: "Grok 4.1" },
  "minimax/minimax-m2.7:free": { maxTokens: 200000, name: "MiniMax M2.7 Free" },
  "minimax/minimax-m2.7": { maxTokens: 200000, name: "MiniMax M2.7" },
  "minimax/minimax-m2.5:free": { maxTokens: 200000, name: "MiniMax M2.5 Free" },
  "minimax/minimax-m2.5": { maxTokens: 200000, name: "MiniMax M2.5" },
  "black-forest-labs/flux-schnell": { maxTokens: 4000, name: "Flux Schnell" },
}

export const modelCapabilities: Record<
  string,
  { tools: boolean; canAnalyze?: boolean }
> = {
  "gpt-4o": { tools: true, canAnalyze: true },
  "gpt-4o-mini": { tools: true, canAnalyze: true },
  "anthropic/claude-sonnet-4-6": { tools: true, canAnalyze: true },
  "google/gemini-3.1-pro-preview": { tools: true, canAnalyze: true },
  "qwen/qwen3.6-plus": { tools: true, canAnalyze: true },
  "deepseek/deepseek-v3.2": { tools: true, canAnalyze: false },
  "deepseek/deepseek-v3.2-thinking": { tools: true },
  "deepseek/deepseek-v3.2-speciale": { tools: false },
  "minimax/minimax-m2.5:free": { tools: true },
  "minimax/minimax-m2.5": { tools: true },
  "minimax/minimax-m2.7:free": { tools: true },
  "minimax/minimax-m2.7": { tools: true },
  "nvidia/nemotron-3-super-120b-a12b:free": { tools: true },
  "nvidia/nemotron-3-super-120b-a12b": { tools: true, canAnalyze: false },
  "x-ai/grok-4.1-fast": { tools: true, canAnalyze: true },
  "perplexity/sonar-pro": { tools: false },
  "openrouter/free": { tools: false, canAnalyze: false },
  "openai/gpt-oss-120b:free": { tools: false, canAnalyze: true },
}

// Vercel AI SDK — primary transport for most providers
import { generateText, type ModelMessage, streamText } from "ai"

import {
  Context,
  Duration,
  Effect,
  Layer,
  pipe,
  Redacted,
  Schedule,
  Schema,
  Stream,
} from "effect"

// ─────────────────────────────────────────────────────────────────
// sushi/provider.ts — Model routing + provider resolution
//
// All model-selection logic lives here. vault/index.ts is now just
// a data/types layer (prizes, limits, capabilities, API key helpers).
// ─────────────────────────────────────────────────────────────────

import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"
import type {
  aiAgent,
  characterProfile,
  collaboration,
  guest,
  instruction,
  message,
  nil,
  sushi,
  user,
} from "@chrryai/donut/types"
import { isDevelopment, isE2E } from "@chrryai/donut/utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

// Encryption configuration
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const _SALT_LENGTH = 64

/**
 * Get encryption key from environment variable
 * This should be a 32-byte (256-bit) key stored in ENCRYPTION_KEY env var
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // Ensure key is exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, "hex")
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)")
  }

  return keyBuffer
}

/**
 * Encrypt a string value (e.g., API key)
 * Returns: base64 encoded string containing IV + encrypted data + auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string")
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "hex"), authTag])

  return combined.toString("base64")
}

/**
 * Decrypt an encrypted string
 * Input: base64 encoded string containing IV + encrypted data + auth tag
 * Returns: original plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== "string") {
    throw new Error("Encrypted data must be a non-empty string")
  }

  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, "base64")

  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  )

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once and store the output in ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

import {
  and,
  asc,
  cosineDistance,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  max,
  ne,
  not,
  notInArray,
  or,
  relations,
  type SQL,
  sql,
  sum,
} from "drizzle-orm"
import pLimit from "p-limit"
import * as schema from "../../dna/schema"

export type thread = typeof threads.$inferSelect
export type memory = typeof memories.$inferSelect

import type { AdapterAccount } from "@auth/core/adapters"
import type { aiModel, bee, store } from "@chrryai/donut/types"
import { captureException } from "@sentry/node"
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  PgColumn,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core"
import postgres from "postgres"
import { match, P } from "ts-pattern"
// Better Auth tables
import { getCache, setCache } from "../../../src/cache"
import {
  accounts,
  affiliateClicks,
  affiliateLinks,
  affiliatePayouts,
  affiliateReferrals,
  agentApiUsage,
  aiAgents,
  analyticsSites,
  appCampaigns,
  appExtends,
  appOrders,
  apps,
  authExchangeCodes,
  autonomousBids,
  budgets,
  calendarEvents,
  cfApiRequests,
  cfRateLimitEvents,
  cfSdkSessions,
  cfZones,
  characterProfiles,
  cities,
  codebaseIssues,
  codebaseQueries,
  codeEmbeddings,
  collaborations,
  creditTransactions,
  creditUsages,
  devices,
  documentChunks,
  expenses,
  feedbackTransactions,
  guests,
  type hippo,
  hippos,
  installs,
  instructions,
  invitations,
  kanbanBoards,
  kanbanCards,
  kanbanColumns,
  memories,
  messageEmbeddings,
  messages,
  moods,
  pearFeedback,
  placeHolders,
  premiumSubscriptions,
  pushSubscriptions,
  type ramen,
  realtimeAnalytics,
  recruitmentFlows,
  retroResponses,
  retroSessions,
  scheduledJobs,
  sharedExpenses,
  slotAuctions,
  slotRentals,
  sonarIssues,
  sonarMetrics,
  storeInstalls,
  stores,
  storeTimeSlots,
  streamLogs,
  subscriptions,
  type swarm,
  systemLogs,
  talentEarnings,
  talentInvitations,
  talentProfiles,
  talentThreads,
  taskLogs,
  taskStates,
  tasks,
  teams,
  threadSummaries,
  threads,
  timers,
  tribeComments,
  tribeFollows,
  tribeLikes,
  tribeMemberships,
  tribeNews,
  tribePosts,
  tribePostTranslations,
  tribeReactions,
  tribes,
  users,
  verificationTokens,
} from "../../dna/schema"

export const getApps = async (
  {
    ownerId,
    userId,
    guestId,
    isSafe = true,
    page = 1,
    storeId,
    pageSize = 50,
  }: {
    userId?: string
    guestId?: string
    isSafe?: boolean
    page?: number
    storeId?: string
    pageSize?: number
    ownerId?: string
  } = {
    isSafe: true,
  },
): Promise<{
  items: sushi[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> => {
  // Get store's default app and build parent store chain if storeId provided
  let storeDefaultAppId: string | undefined
  const storeIds: string[] = []

  if (storeId) {
    const store = await db
      .select({ appId: stores.appId, parentStoreId: stores.parentStoreId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1)

    storeDefaultAppId = store[0]?.appId || undefined
    storeIds.push(storeId)

    // Note: We no longer automatically inherit apps from parent stores
    // Apps from parent stores must be explicitly installed via storeInstalls
  }

  const conditions = and(
    ownerId
      ? or(eq(apps.userId, ownerId), eq(apps.guestId, ownerId))
      : undefined,
    // Filter by storeId if provided - include apps that belong to this store OR are explicitly installed
    storeId
      ? or(
          // Apps that directly belong to this store
          eq(apps.storeId, storeId),
          // Apps installed via storeInstalls (can be from any store)
          exists(
            db
              .select()
              .from(storeInstalls)
              .where(
                and(
                  eq(storeInstalls.storeId, storeId),
                  eq(storeInstalls.appId, apps.id),
                ),
              ),
          ),
        )
      : undefined,
    // Access conditions: user's apps OR guest's apps OR public system apps
    // storeId
    //   ? undefined // If filtering by store, show all apps in that store
    //   : or(
    //       userId ? eq(apps.userId, userId) : undefined,
    //       guestId ? eq(apps.guestId, guestId) : undefined,
    //       // Public system apps (no owner)
    //       and(isNull(apps.userId), isNull(apps.guestId)),
    //     ),
  )

  // Get apps with custom ordering information
  // Order by: 1. Store default app, 2. Chrry, 3. Custom app order (per store+user/guest), 4. Store install display order, 5. Creation date
  const result = await db
    .select({
      app: apps,
      store: stores,
      appOrder: appOrders,
      storeInstall: storeInstalls,
    })
    .from(apps)
    .innerJoin(stores, eq(apps.storeId, stores.id))
    .leftJoin(
      appOrders,
      and(
        eq(appOrders.appId, apps.id),
        storeId ? eq(appOrders.storeId, storeId) : undefined,
        userId ? eq(appOrders.userId, userId) : undefined,
        guestId ? eq(appOrders.guestId, guestId) : undefined,
      ),
    )
    .leftJoin(
      storeInstalls,
      and(
        eq(storeInstalls.appId, apps.id),
        storeId ? eq(storeInstalls.storeId, storeId) : undefined,
      ),
    )
    .where(conditions)
    .orderBy(
      // 1. Store default app first (if storeId provided)
      ...(storeDefaultAppId
        ? [
            desc(
              sql`CASE WHEN ${apps.id} = ${storeDefaultAppId} THEN 1 ELSE 0 END`,
            ),
          ]
        : []),
      // 2. Chrry second
      desc(sql`CASE WHEN ${apps.slug} = 'chrry' THEN 1 ELSE 0 END`),
      // 3. Custom app order (0, 1, 2, 3...), nulls last
      sql`${appOrders.order} ASC NULLS LAST`,
      // 4. Store install display order (0, 1, 2, 3...), nulls last
      sql`${storeInstalls.displayOrder} ASC NULLS LAST`,
      // 5. Creation date for apps without custom order
      desc(apps.createdOn),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  // Count total
  const totalCount =
    (
      await db
        .select({ count: count(apps.id) })
        .from(apps)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  // Extract apps from result with store data
  const appsData = result.map((appRow) => ({
    ...appRow.app,
    store: appRow.store,
  }))

  // For nested store.apps, use empty array to prevent circular references
  // The top-level apps list already contains all apps from the store chain
  return {
    items: (
      await Promise.all(
        appsData.map(async (app) => {
          if (!app) return undefined

          const storeWithApps = app.store
            ? {
                ...app.store,
                apps: [], // Empty to prevent circular references
                app: null, // Set to null to prevent circular references
              }
            : app.store

          return {
            ...(isSafe
              ? toSafeApp({
                  app,
                  userId,
                  guestId,
                })
              : app),
            extends: await getAppExtends({
              appId: app.id,
            }),
            store: storeWithApps,
          } as unknown as sushi
        }),
      )
    ).filter(Boolean) as sushi[],
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export type team = typeof teams.$inferSelect

export type storeWithRelations = {
  store: store
  user: user | null
  guest: guest | null
  team: team | null
  app: sushi | undefined
  apps: sushi[]
}

export async function getStoreQuery({
  id,
  slug,
  parentStoreId,
  appId,
  domain,
}: {
  id?: string
  slug?: string
  userId?: string
  guestId?: string
  domain?: string
  isSafe?: boolean
  appId?: string
  depth?: number
  skipCache?: boolean
  parentStoreId?: string | null
}) {
  // Use user-specific cache key if userId/guestId provided

  // Map vex.chrry.ai and askvex.com to the vex store

  const conditions = [
    appId ? eq(stores.appId, appId) : undefined,
    id ? eq(stores.id, id) : undefined,
    parentStoreId === null
      ? isNull(stores.parentStoreId)
      : parentStoreId
        ? eq(stores.parentStoreId, parentStoreId)
        : undefined,
    slug ? eq(stores.slug, slug) : undefined,
    domain ? eq(stores.domain, domain) : undefined,
  ].filter(Boolean) // Remove undefined domain

  const [result] = await db
    .select()
    .from(stores)
    .leftJoin(users, eq(stores.userId, users.id))
    .leftJoin(guests, eq(stores.guestId, guests.id))
    .leftJoin(teams, eq(stores.teamId, teams.id))
    .leftJoin(apps, eq(stores.appId, apps.id))
    .where(and(...conditions))
    .orderBy(desc(stores.createdOn))
    .limit(1)

  return result
}

export async function getStore(payload: {
  id?: string
  slug?: string
  userId?: string
  guestId?: string
  domain?: string
  isSafe?: boolean
  appId?: string
  depth?: number
  skipCache?: boolean
  parentStoreId?: string | null
}) {
  const {
    id,
    slug,
    userId,
    guestId,
    domain,
    isSafe = false,
    appId,
    depth = 0,
    skipCache = false,
    parentStoreId,
  } = payload
  // Use user-specific cache key if userId/guestId provided
  // Otherwise use public cache key
  const cacheKey = makeCacheKey(payload)

  if (!skipCache) {
    // Try cache first
    const cached = await getCache<storeWithRelations>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Map vex.chrry.ai and askvex.com to the vex store
  let effectiveSlug = slug
  const effectiveDomain = domain

  if (domain && !slug) {
    if (["https://vex.chrry.ai"].includes(domain)) {
      effectiveSlug = "lifeOS"
    }
  }

  const conditions = [
    appId ? eq(stores.appId, appId) : undefined,
    id ? eq(stores.id, id) : undefined,
    parentStoreId === null
      ? isNull(stores.parentStoreId)
      : parentStoreId
        ? eq(stores.parentStoreId, parentStoreId)
        : undefined,
    effectiveSlug ? eq(stores.slug, effectiveSlug) : undefined,
    effectiveDomain ? eq(stores.domain, effectiveDomain) : undefined,
  ].filter(Boolean) // Remove undefined values

  const result = await getStoreQuery({
    id,
    slug: effectiveSlug,
    userId,
    guestId,
    domain: effectiveDomain,
  })

  if (!result) return undefined

  // Check if current user is the owner
  const isOwner =
    (userId && result.stores.userId === userId) ||
    (guestId && result.stores.guestId === guestId)

  const appsResult = await getApps({
    userId,
    guestId,
    storeId: result.stores.id,
  })

  // Populate nested store.apps if depth > 0
  let appsWithNestedStores = appsResult.items
  if (depth > 0) {
    appsWithNestedStores = await Promise.all(
      appsResult.items.map(async (appItem) => {
        // Recursively fetch nested store apps (depth - 1)
        const nestedStoreData = await getStore({
          id: appItem.store?.id,
          userId,
          guestId,
          depth: depth - 1,
        })

        return {
          ...toSafeApp({ app: appItem, userId, guestId }),

          store: appItem.store
            ? {
                ...appItem.store,
                apps:
                  nestedStoreData?.apps.map((app) =>
                    toSafeApp({ app, userId, guestId }),
                  ) || [],
                app: null, // Set to null to prevent circular references
              }
            : appItem.store,
        } as sushi
      }),
    )
  }

  // Build sushi if app exists
  const sushi = result.app
    ? ({
        ...result.app,
        store: {
          ...result.stores,
          apps: appsWithNestedStores,
          app: null, // Set to null to prevent circular references
        },
        extends: await getAppExtends({
          appId: result.app.id,
        }),
      } as unknown as sushi)
    : undefined

  const storeResult = {
    store: result.stores,
    user:
      result.user && isSafe && !isOwner
        ? toSafeUser({ user: result.user })
        : result.user,
    guest:
      result.guest && isSafe && !isOwner
        ? toSafeGuest({ guest: result.guest })
        : result.guest,
    team: result.teams,
    app: sushi,
    apps: appsWithNestedStores,
  }

  // Determine if user is owner from query result (no extra DB queries needed)
  const isStoreOwner =
    (userId && result.stores.userId === userId) ||
    (guestId && result.stores.guestId === guestId)

  // Cache the result (1 hour for public, 5 minutes for owners) - fire and forget
  setCache(cacheKey, storeResult, isStoreOwner ? 60 * 5 : 60 * 60)

  // Cross-seed public cache if owner-specific request
  if (isStoreOwner) {
    const publicCacheKey = `store:${id || slug || domain || appId}:public:depth:${depth}:parent:${parentStoreId || "none"}`
    const publicStoreResult = {
      ...storeResult,
      user: result.user ? toSafeUser({ user: result.user }) : result.user,
      guest: result.guest ? toSafeGuest({ guest: result.guest }) : result.guest,
      app: storeResult.app
        ? toSafeApp({
            app: storeResult.app,
            userId: undefined,
            guestId: undefined,
          })
        : undefined,
      apps: storeResult.apps.map((a) =>
        toSafeApp({ app: a, userId: undefined, guestId: undefined }),
      ),
    }
    setCache(publicCacheKey, publicStoreResult, 60 * 60)
  }

  return storeResult
}

export const getInstructions = async ({
  userId,
  guestId,
  appId,
  threadId, // NEW: Thread-based scatter (get thread's app first, then scatter)
  pageSize = 7,
  page = 1,
  scatterAcrossApps = false, // NEW: Scatter instructions across apps (1 per app + current app priority)
}: {
  threadId?: string
  userId?: string
  guestId?: string
  appId?: string
  pageSize?: number
  page?: number
  scatterAcrossApps?: boolean // NEW: Get diverse instructions from multiple apps
}) => {
  // Resolve thread's app if threadId provided but appId not
  let resolvedAppId = appId
  if (threadId && !appId) {
    const threadResult = await db
      .select({ appId: threads.appId })
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1)
    resolvedAppId = threadResult[0]?.appId || undefined
  }

  // SCATTER MODE: Get diverse instructions from multiple apps
  // Priority: thread's/current app gets priority, rest scattered from other apps
  if (scatterAcrossApps) {
    const baseConditions = []

    // User/Guest condition (required)
    if (userId) {
      baseConditions.push(eq(instructions.userId, userId))
    } else if (guestId) {
      baseConditions.push(eq(instructions.guestId, guestId))
    } else {
      // No user/guest - return empty
      return []
    }

    // Use window function to get ranked instructions per app
    // Priority to current app (rank 1), then scatter from others
    // FIXED: Use raw SQL fragments to avoid parameter type inference issues
    const appIdValue = resolvedAppId || "00000000-0000-0000-0000-000000000000"
    const hasAppId = !!resolvedAppId

    const rankedInstructions = db.$with("ranked_instructions").as(
      db
        .select({
          id: instructions.id,
          userId: instructions.userId,
          guestId: instructions.guestId,
          appId: instructions.appId,
          title: instructions.title,
          emoji: instructions.emoji,
          content: instructions.content,
          confidence: instructions.confidence,
          requiresWebSearch: instructions.requiresWebSearch,
          generatedAt: instructions.generatedAt,
          createdOn: instructions.createdOn,
          updatedOn: instructions.updatedOn,
          // Rank within each app - current app gets priority
          rn: sql<number>`ROW_NUMBER() OVER (
            PARTITION BY ${instructions.appId} 
            ORDER BY 
              CASE 
                WHEN ${hasAppId} AND ${instructions.appId} = ${appIdValue} THEN 0
                ELSE 1
              END,
              (${instructions.confidence} / 100.0 * 
                CASE 
                  WHEN ${instructions.createdOn} > NOW() - INTERVAL '7 days' THEN 1.5
                  WHEN ${instructions.createdOn} > NOW() - INTERVAL '30 days' THEN 1.2
                  WHEN ${instructions.createdOn} > NOW() - INTERVAL '90 days' THEN 1.0
                  ELSE 0.7
                END
              ) DESC,
              ${instructions.createdOn} DESC
          )`.as("rn"),
        })
        .from(instructions)
        .where(and(...baseConditions)),
    )

    // Calculate distribution: thread app gets ~40%, rest scattered from other apps
    const currentAppLimit = Math.max(2, Math.floor(pageSize * 0.4))

    // Get top N from current app + 1 from each other app, up to pageSize
    const scatteredResult = await db
      .with(rankedInstructions)
      .select({
        id: rankedInstructions.id,
        userId: rankedInstructions.userId,
        guestId: rankedInstructions.guestId,
        appId: rankedInstructions.appId,
        title: rankedInstructions.title,
        emoji: rankedInstructions.emoji,
        content: rankedInstructions.content,
        confidence: rankedInstructions.confidence,
        requiresWebSearch: rankedInstructions.requiresWebSearch,
        generatedAt: rankedInstructions.generatedAt,
        createdOn: rankedInstructions.createdOn,
        updatedOn: rankedInstructions.updatedOn,
      })
      .from(rankedInstructions)
      .where(
        or(
          // Current app: up to currentAppLimit instructions
          hasAppId
            ? and(
                eq(rankedInstructions.appId, appIdValue),
                sql`${rankedInstructions.rn} <= ${currentAppLimit}`,
              )
            : sql`false`,
          // Other apps: 1 instruction each (or all apps if no appId specified)
          hasAppId
            ? and(
                sql`${rankedInstructions.appId} IS DISTINCT FROM ${appIdValue}`,
                sql`${rankedInstructions.rn} = 1`,
              )
            : sql`${rankedInstructions.rn} = 1`,
        ),
      )
      .orderBy(
        // Current app first, then by recency
        desc(
          sql`CASE 
            WHEN ${hasAppId} AND ${rankedInstructions.appId} = ${appIdValue} THEN 1 
            ELSE 0 
          END`,
        ),
        desc(rankedInstructions.createdOn),
      )
      .limit(pageSize)

    return scatteredResult
  }

  // Original behavior: single query with total limit
  const conditions = []

  if (appId) {
    conditions.push(eq(instructions.appId, appId))
  }

  if (userId) {
    conditions.push(eq(instructions.userId, userId))
  }

  if (guestId) {
    conditions.push(eq(instructions.guestId, guestId))
  }

  const result = await db
    .select()
    .from(instructions)
    .where(and(...conditions))
    .orderBy(desc(instructions.createdOn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return result
}

export function getHipId(pathname?: string): string | undefined {
  if (!pathname?.includes("/hippo")) return undefined
  // Server-safe: check if window exists
  const segments = pathname.split("/").filter(Boolean)
  const pIndex = segments.indexOf("hippo")

  if (pIndex === -1) return undefined

  const postSegment = segments[pIndex + 1] || ""
  const [hipId] = postSegment.split("?")[0]?.split("&") ?? []

  return hipId
}

async function resolveMessageMedia(
  msg: message,
  hipsMap: Record<string, hippo>,
  thread?: thread,
  userId?: string,
  guestId?: string,
): Promise<message> {
  const resolveItem = async (item: any) => {
    if (!item?.url) return item
    const hipId = getHipId(item.url)
    if (!hipId) return item

    const hippo = hipsMap[hipId]
    // console.log(hippo, 'hippo');

    if (!hippo) return item

    if (thread && !thread.tribeId && thread.visibility === "private") {
      const owner =
        isOwner(thread, {
          userId: thread.userId,
          guestId: thread.guestId,
        }) ||
        isOwner(msg, {
          userId,
          guestId,
        }) ||
        isOwner(hippo, {
          userId,
          guestId,
        })
      if (!owner) return item
    }

    const file = hippo.files?.[0]

    if (!file) return item

    const s3Key =
      file.s3Key || file.url?.replace(/^.*\/(thread|user|chat|apps)\//, "$1/")

    if (s3Key) {
      let context: "thread" | "user" | "chat" | "apps" = "chat"
      if (s3Key.startsWith("thread/")) context = "thread"
      else if (s3Key.startsWith("user/")) context = "user"
      else if (s3Key.startsWith("apps/")) context = "apps"

      const presignedUrl = await getPresignedUrl(s3Key, context)

      if (presignedUrl) {
        return { ...item, url: presignedUrl }
      }
    }

    if (file.url) {
      return { ...item, url: file.url }
    }

    return item
  }

  const [images, video, audio, files] = await Promise.all([
    Promise.all((msg.images ?? []).map(resolveItem)),
    Promise.all((msg.video ?? []).map(resolveItem)),
    Promise.all((msg.audio ?? []).map(resolveItem)),
    Promise.all((msg.files ?? []).map(resolveItem)),
  ])

  return {
    ...msg,
    images: images ?? null,
    video: video ?? null,
    audio: audio ?? null,
    files: files ?? null,
  }
}

export function collectHipIdsFromMessage(msg: message): string[] {
  const ids = new Set<string>()
  const arrays = [msg.images, msg.video, msg.audio, msg.files]
  for (const arr of arrays) {
    for (const item of arr ?? []) {
      const hipId = getHipId(item?.url)
      if (hipId) ids.add(hipId)
    }
  }
  return Array.from(ids)
}

export const getMood = async ({
  id,
  taskId,
}: {
  id?: string
  taskId?: string
}) => {
  const result = (
    await db
      .select()
      .from(moods)
      .leftJoin(messages, eq(moods.id, messages.moodId))
      .leftJoin(tasks, eq(moods.taskId, tasks.id))
      .where(
        and(
          id ? eq(moods.id, id) : undefined,
          taskId ? eq(moods.taskId, taskId) : undefined,
        ),
      )
  ).at(0)

  return result
    ? { ...result.mood, message: result.messages, task: result.task }
    : undefined
}

export const normalizeMonth = (month?: number) => {
  if (month === undefined) return undefined
  return month + 1 // Convert from JS 0-11 to SQL 1-12
}

// Use self-hosted Redis (coolify-redis) instead of Upstash
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://coolify-redis:6379",
  {
    password: process.env.REDIS_PASSWORD, // Add password support
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
  },
)

// Export the raw ioredis client for caching
export const redis = redisClient

// Create Upstash-compatible wrapper for @upstash/ratelimit
// @upstash/ratelimit expects specific method signatures
export const upstashRedis = {
  get: async <TData = any>(key: string): Promise<TData | null> => {
    const value = await redisClient.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as TData
    } catch {
      return value as TData
    }
  },
  set: async (
    key: string,
    value: any,
    options?: { ex?: number },
  ): Promise<"OK"> => {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value)
    if (options?.ex) {
      await redisClient.setex(key, options.ex, stringValue)
    } else {
      await redisClient.set(key, stringValue)
    }
    return "OK"
  },
  eval: async (script: string, keys: string[], args: string[]) => {
    return redisClient.eval(script, keys.length, ...keys, ...args)
  },
  evalsha: async (sha: string, keys: string[], args: string[]) => {
    return redisClient.evalsha(sha, keys.length, ...keys, ...args)
  },
}

export async function getHipposByIds(
  hipIds: string[],
): Promise<Record<string, schema.hippo>> {
  if (hipIds.length === 0) return {}

  const keys = hipIds.map((id) => `hippo:${id}`)
  const cachedValues = await redis.mget(...keys)

  const result: Record<string, schema.hippo> = {}
  const missingIds: string[] = []

  for (let i = 0; i < hipIds.length; i++) {
    const id = hipIds[i]
    if (!id) continue
    const cached = cachedValues[i]
    if (cached) {
      try {
        result[id] = JSON.parse(cached) as schema.hippo
      } catch {
        missingIds.push(id)
      }
    } else {
      missingIds.push(id)
    }
  }

  if (missingIds.length > 0) {
    const rows = await db
      .select()
      .from(hippos)
      .where(inArray(hippos.id, missingIds))

    for (const row of rows) {
      result[row.id] = row
      await redis.set(`hippo:${row.id}`, JSON.stringify(row))
    }
  }

  return result
}

export const getMessage = async ({
  id,
  userId,
  guestId,
  clientId,
}: {
  id?: string
  userId?: string
  guestId?: string
  clientId?: string
}) => {
  const result = (
    await db
      .select({
        message: messages,
        user: users,
        guest: guests,
        aiAgent: aiAgents,
        thread: threads,
      })
      .from(messages)
      .innerJoin(threads, eq(messages.threadId, threads.id))
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(guests, eq(messages.guestId, guests.id))
      .leftJoin(aiAgents, eq(messages.agentId, aiAgents.id))
      .where(
        and(
          id ? eq(messages.id, id) : undefined,
          userId ? eq(messages.userId, userId) : undefined,
          guestId ? eq(messages.guestId, guestId) : undefined,
          clientId ? eq(messages.clientId, clientId) : undefined,
        ),
      )
  ).at(0)

  const user = result?.user
    ? {
        id: result.user?.id,
        userName: result.user?.userName,
        name: result.user?.name,
        image: result.user?.image,
      }
    : undefined

  const pearApp = result?.message?.pearAppId
    ? await getApp({
        id: result?.message?.pearAppId,
      })
    : undefined

  const guest = result?.guest
    ? {
        id: result.guest?.id,
      }
    : undefined

  if (!result) return undefined

  const hipIds = collectHipIdsFromMessage(result.message)
  const hipsMap = await getHipposByIds(hipIds)
  const resolvedMessage = await resolveMessageMedia(
    result.message,
    hipsMap,
    result.thread,
    userId,
    guestId,
  )

  return {
    ...result,
    message: resolvedMessage,
    user,
    pearApp,
    guest,
  }
}

export const getMessages = async ({
  page = 1,
  userId,
  guestId,
  agentId,
  readOn,
  createdOn,
  aiAgent,
  threadId,
  month,
  likedBy,
  createdAfter,
  hasAttachments,
  isPear,
  isAsc,
  agentMessage,
  isTribe,
  isMolt,
  appId,
  ...rest
}: {
  likedBy?: string
  page?: number
  pageSize?: number
  userId?: string
  guestId?: string
  agentId?: string | null
  readOn?: Date
  aiAgent?: boolean
  isMolt?: boolean
  isTribe?: boolean
  createdOn?: Date
  hasAttachments?: boolean
  threadId?: string
  month?: number // 1-12 representing January-December
  createdAfter?: Date
  isAsc?: boolean
  isPear?: boolean
  agentMessage?: boolean
  appId?: string
} = {}) => {
  const pageSize = rest.pageSize || 100

  const conditionsArray = [
    isPear ? eq(messages.isPear, true) : undefined,
    userId ? eq(messages.userId, userId) : undefined,
    isTribe !== undefined
      ? and(
          eq(messages.isTribe, isTribe),
          isTribe ? isNotNull(messages.jobId) : isNull(messages.jobId),
        )
      : undefined,
    isMolt !== undefined ? eq(messages.isMolt, isMolt) : undefined,
    appId ? eq(messages.appId, appId) : undefined,
    guestId ? eq(messages.guestId, guestId) : undefined,
    agentId
      ? eq(messages.agentId, agentId)
      : agentId === null
        ? isNull(messages.agentId)
        : agentMessage
          ? isNotNull(messages.agentId)
          : undefined,
    readOn
      ? sql`DATE_TRUNC('day', ${messages.readOn}) = DATE_TRUNC('day', ${sql.raw(`'${readOn.toISOString()}'`)})`
      : undefined,
    createdOn
      ? sql`DATE_TRUNC('day', ${messages.createdOn}) = DATE_TRUNC('day', ${sql.raw(`'${createdOn.toISOString()}'`)})`
      : undefined,
    month !== undefined
      ? sql`EXTRACT(MONTH FROM ${messages.createdOn}) = ${normalizeMonth(month)}`
      : undefined,
    aiAgent ? isNotNull(messages.agentId) : undefined,
    threadId ? eq(messages.threadId, threadId) : undefined,
    createdAfter ? gte(messages.createdOn, createdAfter) : undefined,
    likedBy
      ? sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${messages.reactions}) AS reaction
          WHERE (reaction->>'userId' = ${likedBy} OR reaction->>'guestId' = ${likedBy})
          AND (reaction->>'like')::boolean = true
        )`
      : undefined,
    hasAttachments
      ? or(
          isNotNull(messages.files),
          isNotNull(messages.images),
          isNotNull(messages.video),
          isNotNull(messages.audio),
        )
      : undefined,
  ]

  const conditions = and(...conditionsArray.filter(Boolean))

  async function getHipposByIds(
    hipIds: string[],
  ): Promise<Record<string, hippo>> {
    if (hipIds.length === 0) return {}

    const keys = hipIds.map((id) => `hippo:${id}`)
    const cachedValues = await redis.mget(...keys)

    const result: Record<string, schema.hippo> = {}
    const missingIds: string[] = []

    for (let i = 0; i < hipIds.length; i++) {
      const id = hipIds[i]
      if (!id) continue
      const cached = cachedValues[i]
      if (cached) {
        try {
          result[id] = JSON.parse(cached) as schema.hippo
        } catch {
          missingIds.push(id)
        }
      } else {
        missingIds.push(id)
      }
    }

    if (missingIds.length > 0) {
      const rows = await db
        .select()
        .from(hippos)
        .where(inArray(hippos.id, missingIds))

      for (const row of rows) {
        result[row.id] = row
        await redis.set(`hippo:${row.id}`, JSON.stringify(row))
      }
    }

    return result
  }

  const result = await db
    .select({
      message: messages,
      user: users,
      guest: guests,
      aiAgent: aiAgents,
      thread: threads,
      app: apps,
    })
    .from(messages)
    .where(conditions)
    .leftJoin(users, eq(messages.userId, users.id))
    .leftJoin(guests, eq(messages.guestId, guests.id))
    .leftJoin(aiAgents, eq(messages.agentId, aiAgents.id))
    .innerJoin(threads, eq(messages.threadId, threads.id))
    .leftJoin(apps, eq(messages.appId, apps.id))
    .orderBy(isAsc ? asc(messages.createdOn) : desc(messages.createdOn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(messages.id) })
        .from(messages)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  const allHipIds = result.flatMap((r) => collectHipIdsFromMessage(r.message))
  const hipsMap = await getHipposByIds(allHipIds)

  return {
    messages: await Promise.all(
      result.map(async (message) => {
        const pearApp = message.message?.pearAppId
          ? await getApp({
              id: message.message?.pearAppId,
            })
          : undefined
        const app = message.message?.appId
          ? await getApp({ id: message.message.appId })
          : undefined

        const resolvedMessage = await resolveMessageMedia(
          message.message,
          hipsMap,
          message.thread,
          userId,
          guestId,
        )

        return {
          ...message,
          message: resolvedMessage,
          parentMessage: message.message.clientId
            ? await getMessage({
                clientId: message.message.id,
              }).then((res) => res?.message)
            : undefined,
          app,
          pearApp,
          user: {
            id: message.user?.id,
            createdOn: message.user?.createdOn,
            updatedOn: message.user?.updatedOn,
            userName: message.user?.userName,
            name: message.user?.name,
            image: message.user?.image,
          },
          mood: await getMood({
            id: message.message.id,
          }),
        }
      }),
    ),
    totalCount,
    hasNextPage,
    nextPage,
  }
}
export const getPlaceHolder = async ({
  id,
  threadId,
  userId,
  guestId,
  tribePostId,
  appId,
}: {
  id?: string
  threadId?: string
  userId?: string
  guestId?: string
  appId?: string
  tribePostId?: string
}) => {
  if (!userId && !guestId && !tribePostId) {
    return
  }

  const [placeholder] = await db
    .select()
    .from(placeHolders)
    .where(
      and(
        id ? eq(placeHolders.id, id) : undefined,
        threadId
          ? eq(placeHolders.threadId, threadId)
          : isNull(placeHolders.threadId),
        userId ? eq(placeHolders.userId, userId) : undefined,
        guestId ? eq(placeHolders.guestId, guestId) : undefined,
        appId ? eq(placeHolders.appId, appId) : undefined,
        tribePostId ? eq(placeHolders.tribePostId, tribePostId) : undefined,
      ),
    )
    .orderBy(desc(placeHolders.createdOn))

  return placeholder
}
export const getCharacterProfiles = async ({
  agentId,
  userId,
  guestId,
  isAppOwner,
  limit = 50,
  pinned,
  visibility,
  appId,
  threadId,
  notThreadId,
  include = [],
}: {
  agentId?: string
  appId?: string
  userId?: string
  guestId?: string
  isAppOwner?: boolean
  limit?: number
  pinned?: boolean
  threadId?: string
  notThreadId?: string
  visibility?: "public" | "private"
  include?: (keyof characterProfile)[]
}) => {
  try {
    const result = await db
      .select({
        profile: characterProfiles,
        agent: aiAgents,
        user: users,
        guest: guests,
      })
      .from(characterProfiles)
      .leftJoin(aiAgents, eq(characterProfiles.agentId, aiAgents.id))
      .leftJoin(users, eq(characterProfiles.userId, users.id))
      .leftJoin(guests, eq(characterProfiles.guestId, guests.id))
      .leftJoin(threads, eq(characterProfiles.threadId, threads.id))

      .where(
        and(
          agentId ? eq(characterProfiles.agentId, agentId) : undefined,
          userId ? eq(characterProfiles.userId, userId) : undefined,
          guestId ? eq(characterProfiles.guestId, guestId) : undefined,
          appId ? eq(characterProfiles.appId, appId) : undefined,
          isAppOwner !== undefined
            ? eq(characterProfiles.isAppOwner, isAppOwner)
            : undefined,
          pinned !== undefined
            ? eq(characterProfiles.pinned, pinned)
            : undefined,
          threadId ? eq(characterProfiles.threadId, threadId) : undefined,
          notThreadId
            ? not(eq(characterProfiles.threadId, notThreadId))
            : undefined,
          visibility ? eq(characterProfiles.visibility, visibility) : undefined,
        ),
      )
      .orderBy(asc(characterProfiles.pinned), desc(users.createdOn))
      .limit(limit)

    return result.map((row) => ({
      id: row.profile.id,
      agentId: row.profile.agentId,
      userId: row.profile.userId,
      guestId: row.profile.guestId,
      threadId: row.profile.threadId,
      appId: row.profile.appId,
      name: row.profile.name,
      personality: row.profile.personality,
      traits: row.profile.traits,
      pinned: row.profile.pinned,
      visibility: row.profile.visibility,
      isAppOwner: row.profile.isAppOwner,
      tags: row.profile.tags,
      usageCount: row.profile.usageCount,
      lastUsedAt: row.profile.lastUsedAt,
      userRelationship: row.profile.userRelationship,
      conversationStyle: row.profile.conversationStyle,
      createdOn: row.profile.createdOn,
      agent:
        include.includes("agentId") && row.agent
          ? {
              id: row.agent.id,
              name: row.agent.name,
              description: row.agent.description,
            }
          : null,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            userName: row.user.userName,
            image: row.user.image,
          }
        : null,
      guest: row.guest
        ? {
            id: row.guest.id,
            name: "Guest",
            image: "",
          }
        : null,
    }))
  } catch (error) {
    console.error("Error getting character profiles:", error)
    return []
  }
}

export function sanitizeSearchTerm(search: string): string {
  // Remove any non-alphanumeric characters except spaces
  return search.replace(/[^a-zA-Z0-9\s]/g, "")
}

export function formatSearchTerm(search: string): string {
  return sanitizeSearchTerm(search)
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => `${word}:*`)
    .join(" & ")
}

export const getThreads = async ({
  page = 1,
  pageSize = 100,
  search,
  guestId,
  isIncognito,
  userId,
  starred,
  sort,
  visibility,
  userName,
  collaborationStatus,
  myPendingCollaborations,
  appId,
  appIds,
  ownerId,
  hasPearApp,
  isDNA,
  isTribe,
}: {
  page?: number
  pageSize?: number
  search?: string
  guestId?: string
  isIncognito?: boolean
  userId?: string
  starred?: boolean
  visibility?: ("public" | "private")[]
  sort?: "bookmark" | "date"
  collaborationStatus?: ("active" | "pending")[]
  userName?: string
  myPendingCollaborations?: boolean // I'm pending on others' threads
  appId?: string
  appIds?: string[]
  ownerId?: string
  hasPearApp?: boolean
  isTribe?: boolean
  isDNA?: boolean
}) => {
  // const user = userId ? await getUser({ id: userId }) : undefined
  // const guest = guestId ? await getGuest({ id: guestId }) : undefined

  const formattedSearch =
    search && search.length >= 3 ? formatSearchTerm(search) : undefined

  // Get collaboration threads if userId or userName is provided
  const collaborationThreadIds = !collaborationStatus
    ? []
    : userId || userName
      ? (
          await db
            .select({ threadId: collaborations.threadId })
            .from(collaborations)
            .leftJoin(users, eq(collaborations.userId, users.id))
            .where(
              and(
                userId ? eq(collaborations.userId, userId) : undefined,
                userName ? eq(users.userName, userName) : undefined,
                myPendingCollaborations
                  ? eq(collaborations.status, "pending")
                  : collaborationStatus
                    ? inArray(collaborations.status, collaborationStatus)
                    : eq(collaborations.status, "active"),
              ),
            )
        ).map((c) => c.threadId)
      : undefined

  // Get bookmarked thread IDs
  // Only filter by visibility:public if explicitly requested (viewing others' profiles)
  const bookmarkedThreadIds =
    userId || guestId
      ? (
          await db
            .select({ id: threads.id })
            .from(threads)
            .where(
              and(
                // Only filter public if visibility parameter is set (viewing another user)
                visibility
                  ? inArray(threads.visibility, visibility)
                  : undefined,
                sql`EXISTS (
                SELECT 1 FROM jsonb_array_elements(${threads.bookmarks}) AS bookmark
                WHERE ${userId ? sql`bookmark->>'userId' = ${userId}` : sql`bookmark->>'guestId' = ${guestId || ""}`}
              )`,
              ),
            )
            .orderBy(desc(threads.updatedOn))
        ).map((t) => t.id)
      : undefined

  // Check if we're filtering by specific collaboration status (not showing all)
  const isFilteringByCollaborationStatus =
    collaborationStatus?.length === 1 &&
    (collaborationStatus[0] === "pending" ||
      collaborationStatus[0] === "active")

  const sortOrder =
    sort === "bookmark"
      ? [
          bookmarkedThreadIds && bookmarkedThreadIds.length > 0
            ? sql`CASE WHEN ${threads.id} = ANY(ARRAY[${sql.join(
                bookmarkedThreadIds.map((id) => sql`${id}`),
                sql`, `,
              )}]::uuid[]) THEN 0 ELSE 1 END`
            : undefined,
          appId || (appIds && appIds.length > 0)
            ? sql`CASE WHEN ${threads.isMainThread} = true THEN 0 ELSE 1 END`
            : undefined,
          sql`CASE WHEN ${threads.bookmarks} IS NULL THEN 1 ELSE 0 END`,
          desc(
            sql`jsonb_array_length(COALESCE(${threads.bookmarks}, '[]'::jsonb))`,
          ),
          desc(threads.updatedOn),
        ]
      : [desc(threads.updatedOn)]

  const conditionsArray = [
    ownerId
      ? or(eq(apps.userId, ownerId), eq(apps.guestId, ownerId))
      : undefined,
    isDNA === true
      ? eq(threads.isMainThread, true)
      : isDNA === false
        ? eq(threads.isMainThread, false)
        : undefined,
    isTribe === true
      ? or(
          eq(threads.isTribe, false),
          isNotNull(threads.tribeId),
          isNotNull(threads.jobId),
        )
      : isTribe === false
        ? or(
            eq(threads.isTribe, false),
            isNull(threads.tribeId),
            isNull(threads.jobId),
          )
        : undefined,

    appIds && appIds.length > 0
      ? or(
          inArray(threads.appId, appIds),
          bookmarkedThreadIds && bookmarkedThreadIds.length > 0
            ? inArray(threads.id, bookmarkedThreadIds)
            : sql`false`,
        )
      : undefined,
    formattedSearch
      ? sql`to_tsvector('english', ${messages.content}) @@ to_tsquery('english', ${formattedSearch})`
      : undefined,
    guestId
      ? myPendingCollaborations
        ? // Guests cannot have pending collaborations - return empty result
          sql`false`
        : eq(threads.guestId, guestId)
      : undefined,
    userId
      ? myPendingCollaborations
        ? // Only show threads where I'm a pending collaborator (not threads I own)
          collaborationThreadIds && collaborationThreadIds.length > 0
          ? inArray(threads.id, collaborationThreadIds)
          : sql`false`
        : isFilteringByCollaborationStatus
          ? // Only show collaboration threads with specific status
            collaborationThreadIds && collaborationThreadIds.length > 0
            ? inArray(threads.id, collaborationThreadIds)
            : sql`false`
          : // Show all threads (owned + collaboration + bookmarked)
            or(
              eq(threads.userId, userId),
              collaborationThreadIds && collaborationThreadIds.length > 0
                ? inArray(threads.id, collaborationThreadIds)
                : sql`false`,
              bookmarkedThreadIds && bookmarkedThreadIds.length > 0
                ? inArray(threads.id, bookmarkedThreadIds)
                : sql`false`,
            )
      : undefined,
    isIncognito !== undefined
      ? eq(threads.isIncognito, isIncognito)
      : undefined,
    starred ? eq(threads.star, 1) : undefined,
    visibility ? inArray(threads.visibility, visibility) : undefined,
    userName
      ? myPendingCollaborations
        ? // Only show threads where this user is a pending collaborator
          collaborationThreadIds && collaborationThreadIds.length > 0
          ? inArray(threads.id, collaborationThreadIds)
          : sql`false`
        : isFilteringByCollaborationStatus
          ? // Only show collaboration threads with specific status
            collaborationThreadIds && collaborationThreadIds.length > 0
            ? inArray(threads.id, collaborationThreadIds)
            : sql`false`
          : // Show all threads (owned + collaboration)
            or(
              eq(users.userName, userName),
              collaborationThreadIds && collaborationThreadIds.length > 0
                ? inArray(threads.id, collaborationThreadIds)
                : sql`false`,
            )
      : undefined,
  ].filter(Boolean)

  const orderParams = [
    ...(appId
      ? [sql`CASE WHEN ${threads.appId} = ${appId} THEN 0 ELSE 1 END`]
      : []),
    ...(hasPearApp
      ? [sql`CASE WHEN ${threads.pearAppId} IS NOT NULL THEN 0 ELSE 1 END`]
      : []),
    ...sortOrder,
  ].filter(Boolean) as SQL[]

  if (search && search.length >= 3) {
    // Subquery for thread IDs with FTS on messages.content
    const subquery = db
      .select({ threadId: messages.threadId })
      .from(messages)
      .where(and(...conditionsArray))

    // Main query: threads whose id is in subquery
    const result = await db
      .select()
      .from(threads)
      .where(inArray(threads.id, subquery))
      .leftJoin(users, eq(threads.userId, users.id))
      .leftJoin(apps, eq(threads.appId, apps.id))
      .orderBy(...orderParams)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    // Count for pagination
    const totalCount =
      (
        await db
          .select({ count: count(threads.id) })
          .from(threads)
          .leftJoin(users, eq(threads.userId, users.id))
          .leftJoin(apps, eq(threads.appId, apps.id))
          .where(
            inArray(
              threads.id,
              db
                .select({ threadId: messages.threadId })
                .from(messages)
                .where(and(...conditionsArray)),
            ),
          )
      )[0]?.count ?? 0

    const hasNextPage = totalCount > page * pageSize
    const nextPage = hasNextPage ? page + 1 : null

    return {
      threads: await Promise.all(
        result.map(async (thread) => {
          const app = thread.threads.appId
            ? await getApp({
                id: thread.threads.appId,
              })
            : undefined

          const pearApp = thread?.threads?.pearAppId
            ? await getApp({
                id: thread?.threads?.pearAppId,
              })
            : undefined

          return {
            ...thread.threads,
            user: thread.user
              ? {
                  id: thread.user?.id,
                  name: thread.user?.name,
                  userName: thread.user?.userName,
                  createdOn: thread.user?.createdOn,
                  updatedOn: thread.user?.updatedOn,
                  characterProfiles: await getCharacterProfiles({
                    userId: thread.user?.id,
                    visibility: "public",
                  }),
                  // activeOn: thread.user?.activeOn,
                  // isOnline: thread.user?.isOnline,
                }
              : null,
            collaborations: await getCollaborations({
              threadId: thread.threads.id,
            }),
            app: app ?? undefined,
            pearApp: pearApp ?? undefined,
            lastMessage: (
              await getMessages({
                pageSize: 1,
                threadId: thread.threads.id,
              })
            ).messages.at(0)?.message,
            // Get distinct apps used in this thread's messages (limit 10)
            apps: await (async () => {
              const messageAppIds = await db
                .select({ appId: messages.appId })
                .from(messages)
                .where(
                  and(
                    eq(messages.threadId, thread.threads.id),
                    isNotNull(messages.agentId),
                  ),
                )
                .orderBy(messages.createdOn)
                .limit(10)

              const appIds = messageAppIds
                .map((m) => m.appId)
                .filter((id): id is string => id !== null)

              if (appIds.length === 0) return []

              return await Promise.all(
                appIds.map((id) => getApp({ id, userId, guestId })),
              )
            })(),
          }
        }),
      ),
      totalCount,
      hasNextPage,
      nextPage,
    }
  } else {
    const result = await db
      .select()
      .from(threads)
      .where(and(...conditionsArray))
      .leftJoin(users, eq(threads.userId, users.id))
      .leftJoin(apps, eq(threads.appId, apps.id))
      .orderBy(...orderParams)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const totalCount =
      (
        await db
          .select({ count: count(threads.id) })
          .from(threads)
          .leftJoin(users, eq(threads.userId, users.id))
          .leftJoin(apps, eq(threads.appId, apps.id))
          .where(and(...conditionsArray))
      )[0]?.count ?? 0

    const hasNextPage = totalCount > page * pageSize
    const nextPage = hasNextPage ? page + 1 : null

    return {
      threads: await Promise.all(
        result.map(async (thread) => {
          const pearApp = thread?.threads?.pearAppId
            ? await getApp({
                id: thread?.threads?.pearAppId,
              })
            : undefined
          const app = thread.threads.appId
            ? await getApp({ id: thread.threads.appId, userId, guestId })
            : undefined

          return {
            ...thread.threads,
            app,
            pearApp,
            apps: await (async () => {
              const messageAppIds = await db
                .select({ appId: messages.appId })
                .from(messages)
                .where(
                  and(
                    eq(messages.threadId, thread.threads.id),
                    isNotNull(messages.agentId),
                  ),
                )
                .orderBy(messages.createdOn)
                .limit(10)

              const appIds = messageAppIds
                .map((m) => m.appId)
                .filter((id): id is string => id !== null)

              if (appIds.length === 0) return []

              return await Promise.all(
                appIds.map((id) => getApp({ id, userId, guestId })),
              )
            })(),
            user: thread.user
              ? {
                  id: thread.user?.id,
                  createdOn: thread.user?.createdOn,
                  updatedOn: thread.user?.updatedOn,
                  userName: thread.user?.userName,
                  name: thread.user?.name,
                  characterProfiles: await getCharacterProfiles({
                    userId: thread.user?.id,
                    visibility: "public",
                  }),
                }
              : null,

            collaborations: await getCollaborations({
              threadId: thread.threads.id,
            }),
            lastMessage: (
              await getMessages({
                pageSize: 1,
                threadId: thread.threads.id,
              })
            ).messages.at(0)?.message,
          }
        }),
      ),
      totalCount,
      hasNextPage,
      nextPage,
    }
  }
}

export const getGuest = async (payload: {
  id?: string
  ip?: string
  fingerprint?: string
  isBot?: boolean
  email?: string
  appId?: string
  skipCache?: boolean
  skipMasking?: boolean
  threadId?: string
}) => {
  const {
    id,
    ip,
    fingerprint,
    isBot,
    email,
    appId,
    skipCache = false,
    skipMasking = false,
    threadId,
  } = payload

  const cacheKey = makeCacheKey(payload)

  // Skip cache if requested (e.g., for session updates) or no valid cache key
  if (!skipCache && cacheKey) {
    const cached = await getCache<guest>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const conditionsArray = [
    id ? eq(guests.id, id) : undefined,
    ip ? eq(guests.ip, ip) : undefined,
    fingerprint ? eq(guests.fingerprint, fingerprint) : undefined,
    isBot ? eq(guests.isBot, isBot) : undefined,
    email ? eq(guests.email, email) : undefined,
  ]

  const conditions = and(...conditionsArray.filter(Boolean))

  const result = (await db.select().from(guests).where(conditions)).at(0)

  const now = new Date()
  const oneHourAgo = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() - 1,
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    ),
  )
  const [memoriesResult, lastMessage, app, creditsLeft] = result
    ? await Promise.all([
        getMemories({ guestId: result.id }),
        getMessages({ guestId: result.id, pageSize: 1 }),
        appId ? getApp({ id: appId }) : Promise.resolve(undefined),
        getGuestCreditsLeft({ guestId: result.id, threadId }),
      ])
    : [undefined, undefined, undefined, undefined]

  const memoriesCount = memoriesResult?.totalCount

  const [
    messagesLastHourResult,
    instructionsResult,
    placeHolderResult,
    characterProfilesResult,
    pendingThreadsResult,
    activeThreadsResult,
    subscription,
  ] = result
    ? await Promise.all([
        getMessages({
          guestId: result.id,
          createdAfter: oneHourAgo,
          aiAgent: true,
          isPear: false,
          pageSize: 1,
        }),
        appId
          ? getInstructions({
              appId,
              guestId: result.id,
              pageSize: 7,
            })
          : Promise.resolve([]),
        getPlaceHolder({ guestId: result.id }),
        getCharacterProfiles({ guestId: result.id, pinned: true }),
        getThreads({
          guestId: result.id,
          myPendingCollaborations: true,
          pageSize: 1,
        }),
        getThreads({
          guestId: result.id,
          collaborationStatus: ["active"],
          pageSize: 1,
        }),
        getSubscription({ guestId: result.id }),
      ])
    : [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ]

  const guestData = result
    ? {
        ...result,
        memoriesCount,
        city: result.city,
        country: result.country,
        messagesLastHour: messagesLastHourResult?.totalCount,
        creditsLeft,
        instructions: instructionsResult || [],
        apiKeys: skipMasking
          ? result.apiKeys
          : result.apiKeys
            ? Object.keys(result.apiKeys).reduce((acc, key) => {
                const encryptedVal =
                  result.apiKeys?.[key as keyof typeof result.apiKeys]
                const val = encryptedVal
                  ? safeDecrypt(encryptedVal) || encryptedVal
                  : undefined
                acc[key as keyof apiKeys] = val
                  ? `${val.slice(0, 8)}...${val.slice(-4)}`
                  : undefined
                return acc
              }, {} as apiKeys)
            : null,

        placeHolder: placeHolderResult,
        characterProfiles: characterProfilesResult,
        pendingCollaborationThreadsCount: pendingThreadsResult?.totalCount,
        activeCollaborationThreadsCount: activeThreadsResult?.totalCount,
        lastMessage: lastMessage?.messages.at(0)?.message,
        messageCount: lastMessage?.totalCount,
        subscription,
      }
    : null

  // Cache the enriched guest data
  if (guestData && cacheKey) {
    await setCache(cacheKey, guestData, 60 * 5) // Cache for 5 minutes
  }

  return guestData as guest | null
}

export const getCollaborations = async ({
  threadId,
  status,
  userId,
}: {
  threadId: string
  status?: ("pending" | "revoked" | "rejected" | "active")[]
  userId?: string
}) => {
  const result = await db
    .select({
      thread: threads,
      user: users,
      collaboration: collaborations,
    })
    .from(collaborations)
    .innerJoin(users, eq(collaborations.userId, users.id))
    .innerJoin(threads, eq(collaborations.threadId, threads.id))
    .where(
      and(
        userId ? eq(collaborations.userId, userId) : undefined,
        eq(collaborations.threadId, threadId),
        status ? inArray(collaborations.status, status) : undefined,
      ),
    )
  return result
}

export const getCollaboration = async ({
  id,
  userId,
  threadId,
}: {
  id?: string
  userId?: string
  threadId?: string
}) => {
  if (!id && !userId && !threadId) {
    throw new Error("Missing id or userId")
  }
  const [result] = await db
    .select()
    .from(collaborations)
    .where(
      and(
        id ? eq(collaborations.id, id) : undefined,
        userId ? eq(collaborations.userId, userId) : undefined,
        threadId ? eq(collaborations.threadId, threadId) : undefined,
      ),
    )
  return result
}

export const updateCollaboration = async (collaboration: collaboration) => {
  const [updated] = await db
    .update(collaborations)
    .set(collaboration)
    .where(eq(collaborations.id, collaboration.id))
    .returning()

  return updated
}

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { provide } from "effect/Layer"

const verifiedBuckets = new Set<string>()

export interface S3Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
}

type StorageContext =
  | "thread"
  | "chat"
  | "apps"
  | "other"
  | "user"
  | "tribe"
  | "desktop"
  | "ramen"
  | "app"

function isAwsEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return false
  try {
    const url = new URL(
      endpoint.includes("://") ? endpoint : `https://${endpoint}`,
    )
    const hostname = url.hostname
    return hostname === "amazonaws.com" || hostname.endsWith(".amazonaws.com")
  } catch {
    return false
  }
}

function getBucketForContext(context: StorageContext): string {
  const bucketMap: Record<StorageContext, string> = {
    thread:
      process.env.S3_BUCKET_NAME_PRIVATE ||
      process.env.S3_BUCKET_PRIVATE ||
      "chrry-private-prod-eu",
    chat: process.env.S3_BUCKET_NAME || "chrry-chat-files-prod-eu",
    apps: process.env.S3_BUCKET_NAME_APPS || "chrry-app-profiles-prod-eu",
    other: process.env.S3_BUCKET_NAME_OTHER || "chrry-files-prod-eu",
    user: process.env.S3_BUCKET_NAME_USER || "chrry-user-files-prod-eu",
    tribe: process.env.S3_BUCKET_NAME_TRIBE || "chrry-tribe-files-prod-eu",
    desktop: process.env.S3_BUCKET_NAME_DESKTOP || "chrry-desktop-prod-eu",
    ramen: process.env.S3_BUCKET_NAME_RAMEN || "chrry-ramen-prod-eu",
    app: process.env.S3_BUCKET_NAME_APP || "chrry-app-files-prod-eu",
  }
  return bucketMap[context]
}

export async function getS3Config(
  context: StorageContext = "chat",
): Promise<S3Config | null> {
  if (
    !process.env.S3_ENDPOINT ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  ) {
    return null
  }

  const bucket =
    getBucketForContext(context) ||
    process.env.S3_BUCKET_NAME ||
    "chrry-chat-files-prod-eu"

  const isAWS = isAwsEndpoint(process.env.S3_ENDPOINT)
  const publicUrl = isAWS
    ? `https://${bucket}.s3.${process.env.S3_REGION || "eu-central-1"}.amazonaws.com`
    : process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT

  return {
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket,
    publicUrl,
  }
}

export function getS3Client(config: S3Config): S3Client {
  const isAWS = isAwsEndpoint(config.endpoint)

  return new S3Client({
    endpoint: config.endpoint,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: !isAWS,
  })
}

export async function getPresignedUrl(
  s3Key: string,
  context: StorageContext = "chat",
  expiresIn = 900,
): Promise<string | null> {
  try {
    const config = await getS3Config(context)
    if (!config) {
      console.log(`❌ getPresignedUrl: config is null`)
      return null
    }

    const s3Client = getS3Client(config)

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: s3Key,
    })

    const presignedUrl = await getSignedUrl(s3Client as any, command, {
      expiresIn,
    })

    if (config.endpoint !== config.publicUrl) {
      const presignedUrlObj = new URL(presignedUrl)
      const publicUrlObj = new URL(config.publicUrl)
      presignedUrlObj.protocol = publicUrlObj.protocol
      presignedUrlObj.hostname = publicUrlObj.hostname
      presignedUrlObj.port = publicUrlObj.port
      return presignedUrlObj.toString()
    }

    return presignedUrl
  } catch (err) {
    console.error("❌ Failed to generate presigned URL:", err)
    return null
  }
}

export const getUserCreditsLeft = async ({
  userId,
  month = new Date().getMonth(),
  threadId,
}: {
  userId: string
  month?: number
  threadId?: string
}) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((res) => res[0])

  if (!result) {
    console.warn(
      `User with ID ${userId} not found when calculating credits left.`,
    )
    return 0
  }

  // Toplam harcanan kredi (tüm thread'lerde)
  const totalCreditsSpent = await getCreditsSpent({
    userId,
    month,
  })

  // Thread başına harcanan kredi (sadece bu thread'de)
  const threadCreditsSpent = threadId
    ? await getCreditsSpent({
        userId,
        month,
        threadId,
      })
    : 0

  // Toplam kalan kredi
  const totalCreditsLeft = Math.max(
    (result.credits ?? 0) - (totalCreditsSpent ?? 0),
    0,
  )

  // Thread başına limit kontrolü
  const THREAD_LIMIT = MEMBER_CREDITS_PER_MONTH // 150 kredi per thread
  const threadCreditsLeft = Math.max(
    THREAD_LIMIT - (threadCreditsSpent ?? 0),
    0,
  )

  // Eğer toplam kredi bitmişse
  if (totalCreditsLeft <= 0) {
    return 0
  }

  // Subscribe olmuşsa (kredisi fazlaysa), thread limitini uygulama
  if ((result.credits ?? 0) > MEMBER_CREDITS_PER_MONTH) {
    return totalCreditsLeft
  }

  // Normal user ise thread limiti uygula
  if (threadCreditsLeft <= 0) {
    return 0
  }

  return threadId
    ? Math.min(totalCreditsLeft, threadCreditsLeft)
    : totalCreditsLeft
}

export async function getCreditsSpent({
  userId,
  guestId,
  month,
  threadId,
}: {
  userId?: string
  guestId?: string
  threadId?: string
  month?: number
}): Promise<number> {
  try {
    const currentDate = new Date()
    const targetMonth = month !== undefined ? month : currentDate.getMonth()
    const targetYear = currentDate.getFullYear()

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1))
    const endOfMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999),
    )

    // Get credits from the dedicated credit usage table
    const result = await db!
      .select({ totalCredits: sum(creditUsages.creditCost) })
      .from(creditUsages)
      .where(
        and(
          userId ? eq(creditUsages.userId, userId) : undefined,
          guestId ? eq(creditUsages.guestId, guestId) : undefined,
          threadId ? eq(creditUsages.threadId, threadId) : undefined,
          gte(creditUsages.createdOn, startOfMonth),
          lte(creditUsages.createdOn, endOfMonth),
        ),
      )

    const totalCredits = Number(result[0]?.totalCredits) || 0

    // console.log("💰 Total credits spent:", totalCredits)
    return totalCredits
  } catch (error) {
    console.error("❌ Error calculating credits spent:", error)
    return 0 // Return 0 on error to prevent blocking user
  }
}

export const getGuestCreditsLeft = async ({
  guestId,
  month = new Date().getMonth(),
  threadId,
}: {
  guestId: string
  month?: number
  threadId?: string
}) => {
  const result = await db
    .select()
    .from(guests)
    .where(eq(guests.id, guestId))
    .limit(1)
    .then((res) => res[0])

  if (!result) {
    console.warn(
      `Guest with ID ${guestId} not found when calculating credits left.`,
    )
    return 0
  }

  // Toplam harcanan kredi (tüm thread'lerde)
  const totalCreditsSpent = await getCreditsSpent({
    guestId: result.id,
    month,
  })

  // Thread başına harcanan kredi (sadece bu thread'de)
  const threadCreditsSpent = threadId
    ? await getCreditsSpent({
        guestId: result.id,
        month,
        threadId,
      })
    : 0

  // Toplam kalan kredi
  const totalCreditsLeft = Math.max(
    result.credits - (totalCreditsSpent ?? 0),
    0,
  )

  // Thread başına limit kontrolü
  const THREAD_LIMIT = GUEST_CREDITS_PER_MONTH // 30 kredi per thread
  const threadCreditsLeft = Math.max(
    THREAD_LIMIT - (threadCreditsSpent ?? 0),
    0,
  )

  // Eğer toplam kredi bitmişse
  if (totalCreditsLeft <= 0) {
    return 0
  }

  // Subscribe olmuşsa (kredisi fazlaysa), thread limitini uygulama
  if (result.credits > GUEST_CREDITS_PER_MONTH) {
    return totalCreditsLeft
  }

  // Normal guest ise thread limiti uygula
  if (threadCreditsLeft <= 0) {
    return 0
  }

  return threadId
    ? Math.min(totalCreditsLeft, threadCreditsLeft)
    : totalCreditsLeft
}

export const getCreditsLeft = async ({
  userId,
  guestId,
  threadId,
  month = new Date().getMonth(),
}: {
  userId?: string
  guestId?: string
  month?: number
  threadId?: string
}) => {
  if (userId) {
    return getUserCreditsLeft({
      threadId,
      userId,
    })
  }

  if (guestId) {
    return getGuestCreditsLeft({
      threadId,
      guestId,
    })
  }

  return 0
}

export const getCharacterProfile = async ({
  agentId,
  userId,
  guestId,
  isAppOwner,
  pinned,
  visibility,
  threadId,
  appId,
}: {
  agentId?: string
  appId?: string
  userId?: string
  guestId?: string
  isAppOwner?: boolean
  pinned?: boolean
  threadId?: string
  visibility?: "public" | "private"
}) => {
  const [result] = await db
    .select()
    .from(characterProfiles)
    .where(
      and(
        threadId ? eq(characterProfiles.threadId, threadId) : undefined,
        agentId ? eq(characterProfiles.agentId, agentId) : undefined,
        userId ? eq(characterProfiles.userId, userId) : undefined,
        guestId ? eq(characterProfiles.guestId, guestId) : undefined,
        isAppOwner !== undefined
          ? eq(characterProfiles.isAppOwner, isAppOwner)
          : undefined,
        pinned !== undefined ? eq(characterProfiles.pinned, pinned) : undefined,
        visibility ? eq(characterProfiles.visibility, visibility) : undefined,
        appId ? eq(characterProfiles.appId, appId) : undefined,
        threadId ? eq(characterProfiles.threadId, threadId) : undefined,
      ),
    )
    .limit(1)
  return result
}

export async function getThreadSummary({
  id,
  userId,
  guestId,
  threadId,
}: {
  id?: string
  userId?: string
  guestId?: string
  threadId?: string
}) {
  const [result] = await db
    .select()
    .from(threadSummaries)
    .where(
      and(
        threadId ? eq(threadSummaries.threadId, threadId) : undefined,
        id ? eq(threadSummaries.id, id) : undefined,
        userId ? eq(threadSummaries.userId, userId) : undefined,
        guestId ? eq(threadSummaries.guestId, guestId) : undefined,
      ),
    )
  return result
}

export const getThread = async ({
  id,
  userId,
  guestId,
  isMainThread,
  appId,
  taskId,
  isMolt,
  isTribe,
  tribePostId,
}: {
  id?: string
  userId?: string
  guestId?: string
  isMainThread?: boolean
  appId?: string
  taskId?: string
  tribePostId?: string
  isMolt?: boolean
  isTribe?: boolean
}) => {
  const [result] = await db
    .select()
    .from(threads)
    .where(
      and(
        id ? eq(threads.id, id) : undefined,
        appId ? eq(threads.appId, appId) : undefined,
        isMainThread ? eq(threads.isMainThread, isMainThread) : undefined,
        userId ? eq(threads.userId, userId) : undefined,
        guestId ? eq(threads.guestId, guestId) : undefined,
        taskId ? eq(threads.taskId, taskId) : undefined,
        isMolt !== undefined ? eq(threads.isMolt, isMolt) : undefined,
        tribePostId !== undefined
          ? eq(threads.tribePostId, tribePostId)
          : undefined,
        isTribe !== undefined ? eq(threads.isTribe, isTribe) : undefined,
      ),
    )
    .leftJoin(apps, eq(threads.appId, apps.id))
    .leftJoin(users, eq(threads.userId, users.id))
    .leftJoin(guests, eq(threads.guestId, guests.id))
    .leftJoin(characterProfiles, eq(threads.id, characterProfiles.threadId))
    .limit(1)

  const pearApp = result?.threads?.pearAppId
    ? await getApp({
        id: result.threads.pearAppId,
      })
    : undefined

  const hippo = result?.threads
    ? await db
        .select()
        .from(hippos)
        .where(
          and(
            eq(hippos.threadId, result?.threads?.id),
            !result?.threads?.tribeId &&
              result?.threads?.visibility === "private"
              ? or(
                  userId ? eq(hippos.userId, userId) : undefined,
                  guestId ? eq(hippos.guestId, guestId) : undefined,
                )
              : undefined,
          ),
        )
    : undefined

  // Resolve presigned URLs for hippo files
  const resolvedHippo = hippo
    ? await Promise.all(
        hippo.map(async (h) => {
          if (!h.files?.length) return h
          const resolvedFiles = await Promise.all(
            h.files.map(async (file) => {
              const s3Key =
                file.s3Key ||
                file.url?.replace(/^.*\/(thread|user|chat|apps)\//, "$1/")
              if (!s3Key) return file
              let context: "thread" | "user" | "chat" | "apps" = "chat"
              if (s3Key.startsWith("thread/")) context = "thread"
              else if (s3Key.startsWith("user/")) context = "user"
              else if (s3Key.startsWith("apps/")) context = "apps"
              const presignedUrl = await getPresignedUrl(s3Key, context)
              if (presignedUrl) {
                return { ...file, url: presignedUrl }
              }
              return file
            }),
          )
          return { ...h, files: resolvedFiles }
        }),
      )
    : undefined

  const app = result?.threads?.appId
    ? await getApp({
        id: result.threads.appId,
      })
    : undefined
  // const app = result?.threads?.appId
  //   ? await getApp({
  //       id: result.threads.appId,
  //       userId,
  //       guestId,
  //     })
  //   : undefined
  const creditsLeft = result
    ? await getCreditsLeft({
        userId: result?.user?.id,
        guestId: result?.guest?.id,
        threadId: result.threads.id,
      })
    : 0
  return result
    ? {
        ...result.threads,
        user: result.user
          ? {
              id: result.user?.id,
              name: result.user?.name,
              userName: result.user?.userName,
              image: result.user?.image,
            }
          : (null as user | null),
        guest: result.guest
          ? {
              id: result.guest?.id,
            }
          : result.guest,
        collaborations: await getCollaborations({
          threadId: result.threads.id,
        }),
        creditsLeft,
        hippo: resolvedHippo,
        pearApp,
        characterProfile: await getCharacterProfile({
          threadId: result.threads.id,
          userId: result.threads.userId || undefined,
          guestId: result.threads.guestId || undefined,
        }),
        summary: await getThreadSummary({
          threadId: result.threads.id,
        }),
        placeHolder: await getPlaceHolder({
          threadId: result.threads.id,
          appId: result.threads.appId || undefined,
          userId: result.threads.userId || undefined,
          guestId: result.threads.guestId || undefined,
        }),
        app: app,
      }
    : undefined
}

export async function getDNAThreadArtifacts(
  app?: Partial<sushi> | null,
): Promise<string> {
  if (!app?.mainThreadId) {
    return ""
  }

  try {
    const mainThread = await getThread({
      id: app.mainThreadId,
      userId: app.userId || undefined,
      guestId: app.guestId || undefined,
    })

    if (!mainThread?.artifacts || mainThread.artifacts.length === 0) {
      return ""
    }

    // Format artifacts as RAG context
    let context = `\n\n## ${app.name} DNA Thread Knowledge:\n\n`
    context += `The following files have been uploaded to the DNA Thread and are part of this app's public knowledge base:\n\n`

    for (const artifact of mainThread.artifacts) {
      context += `### ${artifact.name}\n`
      if (artifact.data) {
        // If we have the content, include it
        context += `${artifact.data}\n\n`
      } else if (artifact.url) {
        // If we only have a URL, mention it
        context += `File available at: ${artifact.url}\n\n`
      }
    }

    context += `\nIMPORTANT: Use this DNA Thread knowledge to inform your responses. This is verified, public knowledge for this app.\n`

    return context
  } catch (error) {
    console.error("Error fetching DNA Thread artifacts:", error)
    return ""
  }
}
export function sanitizeMemoryForDNA(memory: {
  content: string
  category?: string | null
  title?: string | null
}): string | null {
  // Skip user-specific categories
  if (
    memory.category === "preference" ||
    memory.category === "relationship" ||
    memory.category === "goal"
  ) {
    return null
  }

  const content = memory.content || memory.title || ""

  // Skip if contains personal info
  if (containsPersonalInfo(content)) {
    return null
  }

  // Skip very short or empty content
  if (content.length < 10) {
    return null
  }

  // Truncate long content
  return content.length > 300 ? content.substring(0, 300) : `...${content}`
}

function containsPersonalInfo(content: string): boolean {
  if (!content) return false

  // PII Patterns to filter
  const sensitivePatterns = [
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    // Phone numbers (various formats)
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    // Credit card numbers (basic pattern)
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    // SSN patterns
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
    // API keys/tokens (common patterns)
    /\b(sk-|pk-|bearer\s|token\s|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_-]{20,}/i,
    // Password mentions
    /\b(password|passwd|pwd)\s*[:=]\s*\S+/i,
    // Private/internal notes
    /\b(private|confidential|internal only|do not share)\b/i,
    // User-specific identifiers that look like GUIDs with personal context
    /\b(userId|user_id|guestId|guest_id)\s*[:=]\s*[a-f0-9-]{36}/i,
  ]

  return sensitivePatterns.some((pattern) => pattern.test(content))
}

export const getAppDNAContext = async (app: sushi) => {
  if (!app?.mainThreadId) return ""

  try {
    // Get DNA Thread artifacts (uploaded files) + app data in parallel
    const [artifactsContext, appData] = await Promise.all([
      getDNAThreadArtifacts(app),
      // Single getSimpleApp call replaces: getMemories + getInstructions + getUserDb + getGuestDb
      chopStick({
        id: app.id,
        userId: app.userId || undefined,
        guestId: app.guestId || undefined,
        join: {
          memories: { dna: 10 },
          instructions: { dna: 10 },
        },
      }),
    ])

    if (!appData) return ""

    // 🛡️ FILTER: Remove personal/sensitive memories
    const sanitizedMemories = (
      (appData.dnaMemories as any)?.memories ??
      appData.dnaMemories ??
      []
    )
      .filter((m: any) => m.appId && !m.userId && !m.guestId)
      .map(sanitizeMemoryForDNA)
      .filter((m: string | null): m is string => m !== null)
      .slice(0, 10)

    const scatteredInstructions = appData.dnaInstructions ?? []

    // 🛡️ FILTER: Remove instructions with personal info
    const sanitizedInstructions = scatteredInstructions
      .filter(
        (i: instruction) =>
          i.content &&
          !containsPersonalInfo(i.content) &&
          !containsPersonalInfo(i.title || ""),
      )
      .slice(0, 5)

    // Get creator attribution (generic only)
    let creatorName = "App Creator"
    if (appData.user?.name) {
      creatorName = appData.user.name
    } else if (appData.guest) {
      creatorName = `Guest ${appData.guest.id.split("-")[0]}`
    }

    // Build DNA context
    let context = ""

    // Add artifacts first (uploaded files - sanitized public data)
    if (artifactsContext) {
      context += artifactsContext
    }

    // Add scattered instructions second (cross-app context) - SANITIZED
    if (sanitizedInstructions.length > 0) {
      context += `\n\n## 🎯 Creator's Workflow Patterns (from ${creatorName}):
${sanitizedInstructions
  .map(
    (i) =>
      `${i.emoji} **${i.title}**${i.appId && i.appId !== app.id ? ` [from another app]` : ""}: ${i.content.substring(0, 200)}${i.content.length > 200 ? "..." : ""}`,
  )
  .join("\n")}

_General workflow patterns the creator uses across apps. No personal information included._
`
    }

    // Add memories third (filtered foundational knowledge) - SANITIZED
    if (sanitizedMemories.length > 0) {
      context += `\n\n## 🧬 App DNA (from ${creatorName})

**Foundational Knowledge:**
${sanitizedMemories.map((content: string) => `- ${content}`).join("\n")}

_General knowledge about this app's purpose and capabilities. No personal information included._
`
    }

    // 🛡️ PRIVACY NOTICE: Always append to DNA context
    if (context) {
      context += `\n\n---\n⚠️ **Privacy Notice**: This context contains only general, non-personal information about the app. Personal details, private conversations, and sensitive data are automatically filtered out.`
    }

    return context
  } catch (error) {
    captureException(error)

    console.error("Error fetching DNA context:", error)
    return ""
  }
}

export const baSessions = pgTable("ba_session", {
  id: text("id").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

// Better Auth OAuth Accounts
export const baAccounts = pgTable(
  "ba_account",
  {
    id: text("id").primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(), // Provider's user ID
    providerId: text("providerId").notNull(), // "google", "apple", etc.
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    expiresAt: timestamp("expiresAt", {
      mode: "date",
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"), // For credentials provider
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    {
      // Unique constraint: one account per provider per user
      providerAccountKey: primaryKey({
        columns: [table.providerId, table.accountId],
      }),
    },
  ],
)

// Better Auth Verification Tokens
export const baVerifications = pgTable(
  "ba_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(), // Email or phone
    value: text("value").notNull(), // Token value
    expiresAt: timestamp("expiresAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    {
      // Unique constraint: one active token per identifier
      identifierKey: primaryKey({
        columns: [table.identifier, table.value],
      }),
    },
  ],
)

// Export types
export type BaSession = typeof baSessions.$inferSelect
export type BaAccount = typeof baAccounts.$inferSelect
export type BaVerification = typeof baVerifications.$inferSelect
export const aiSources = {
  claudeSources: ["codebase", "ai/sushi/file"],
  belesSources: ["ai/content"],
  deepSeekSources: [
    "graph/cypher",
    "graph/entity",
    "graph/extract",
    "rag/documentSummary",
    "ai/tribe/comment",
  ],
  sushiSources: ["sushi", "autonomous/bidding", "m2m", "pear/validate"],
}

export type { aiModel, ramen }

export type aiModelResponse = Omit<aiModel, "provider"> & {
  provider: string
  modelId: string
  agentName: string
  lastKey?: string
  canAnalyze?: boolean
  canDoWebSearch?: string[]
  canGenerateImage?: string[]
  canGenerateVideo?: string[]
  supportsTools?: boolean
  isBYOK?: boolean
  isFree?: boolean
  isBELEŞ?: boolean
  creditsCost?: number
  appCreditsLeft?: number
  ownerCreditsLeft?: number
}

export const PRO_CREDITS_PER_MONTH = 5000
export const PLUS_CREDITS_PER_MONTH = 2000
export const AGENCY_CREDITS_PER_MONTH = 50000
export const SOVEREIGN_CREDITS_PER_MONTH = 250000
export const ADDITIONAL_CREDITS = 500
export const GUEST_CREDITS_PER_MONTH = 50
export const MEMBER_CREDITS_PER_MONTH = 150
export const MAX_INSTRUCTIONS_CHAR_COUNT = 2000
export const MAX_THREAD_TITLE_CHAR_COUNT = 100
export const GUEST_TASKS_COUNT = 4
export const MEMBER_TASKS_COUNT = 8
export const MEMBER_FREE_TRIBE_CREDITS = 5

export type apiKeys = {
  openai?: string // Encrypted OpenAI API key
  anthropic?: string // Encrypted Anthropic API key
  google?: string // Encrypted Google API key
  deepseek?: string // Encrypted DeepSeek API key
  perplexity?: string // Encrypted Perplexity API key
  replicate?: string // Encrypted Replicate API key (for Flux)
  fal?: string // Encrypted Replicate API key (for Flux)
  openrouter?: string // Encrypted OpenRouter API key
  xai?: string // Encrypted XAI API key
  s3?: string // Encrypted S3 API key
}

export const PROMPT_LIMITS = {
  INPUT: 7000, // Max for direct input
  INSTRUCTIONS: 2000, // Max for instructions
  TOTAL: 30000, // Combined max (input + context)
  WARNING_THRESHOLD: 5000, // Show warning at this length
  THREAD_TITLE: 100,
}

export type { swarm }

/**
 * PromptBuilder — pure prompt-section assembly from sushi data
 *
 * No HTTP, no Hono, no Handlebars. Takes raw sushi data, returns
 * formatted strings that can be composed into a system prompt.
 *
 * Used by:
 *   - chopStick (when buildPrompt: true) → sushi.ai.promptSections
 *   - OSS chopstick npm package (same logic, different transport)
 *   - API promptBuilder.ts (adds Handlebars + runtime contexts on top)
 */

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface PromptSections {
  memories: string
  instructions: string
  characterProfiles: string
  placeholders: string
  dna: string
  apps: string
  /** All sections joined — drop-in system prompt addition */
  assembled: string
}

export interface PromptBuilderOpts {
  /**
   * Dynamic memory sizing: fewer memories as conversation grows longer
   * to stay within token limits.
   */
  messageCount?: number
  /**
   * User's name — used in instruction/character headings
   */
  userName?: string
  /**
   * The app's own id — used to label cross-app instructions
   */
  appId?: string
}

// ─────────────────────────────────────────────────────────────────
// Memory section
// ─────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  preference: "⚙️",
  fact: "📌",
  context: "💭",
  instruction: "📝",
  relationship: "👥",
  goal: "🎯",
  character: "🎭",
}

function memoryLine(m: { category?: string | null; content: string }): string {
  const emoji = CATEGORY_EMOJI[m.category ?? "context"] ?? "💭"
  return `${emoji} ${m.content}`
}

export function buildMemoryContext(
  sushi: Pick<
    sushi,
    "userMemories" | "appMemories" | "threadMemories" | "dnaMemories"
  >,
  opts?: PromptBuilderOpts,
): string {
  const userMems = (sushi.userMemories ?? []) as Array<{
    category?: string | null
    content: string
  }>
  const appMems = (sushi.appMemories ?? []) as Array<{
    category?: string | null
    content: string
    userId?: string | null
    guestId?: string | null
  }>
  const threadMems = (sushi.threadMemories ?? []) as Array<{
    category?: string | null
    content: string
  }>

  if (!userMems.length && !appMems.length && !threadMems.length) return ""

  const parts: string[] = []

  if (userMems.length) {
    parts.push(
      `\n\n## RELEVANT CONTEXT ABOUT THE USER:\n${userMems.map(memoryLine).join("\n")}\n\nUse this context to personalize your responses when relevant.`,
    )
  }

  const characterMems = appMems.filter((m) => m.category === "character")
  const knowledgeMems = appMems.filter((m) => m.category !== "character")

  if (characterMems.length) {
    parts.push(
      `\n\n## 🎭 YOUR CHARACTER PROFILE (learned from interactions):\n${characterMems.map((m) => `🎭 ${m.content}`).join("\n")}\n\n⚠️ IMPORTANT: These are observations about YOUR personality and communication style. Embody them consistently.`,
    )
  }

  if (knowledgeMems.length) {
    parts.push(
      `\n\n## 📚 APP KNOWLEDGE:\n${knowledgeMems.map(memoryLine).join("\n")}`,
    )
  }

  if (threadMems.length) {
    parts.push(
      `\n\n## 🧵 THIS CONVERSATION:\n${threadMems.map(memoryLine).join("\n")}`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Instructions section
// ─────────────────────────────────────────────────────────────────

export function buildInstructionsContext(
  sushi: Pick<
    sushi,
    | "userInstructions"
    | "appInstructions"
    | "threadInstructions"
    | "dnaInstructions"
  >,
  opts?: PromptBuilderOpts,
): string {
  type Instruction = {
    emoji?: string | null
    title?: string | null
    content: string
    appId?: string | null
  }

  const thread = (sushi.threadInstructions ?? []) as Instruction[]
  const app = (sushi.appInstructions ?? []) as Instruction[]
  const user = (sushi.userInstructions ?? []) as Instruction[]
  const dna = (sushi.dnaInstructions ?? []) as Instruction[]

  // Priority: thread > app > user > dna
  const selected = match([thread.length, app.length, user.length, dna.length])
    .with([P.number.gt(0), P._, P._, P._], () => thread)
    .with([0, P.number.gt(0), P._, P._], () => app)
    .with([0, 0, P.number.gt(0), P._], () => user)
    .with([0, 0, 0, P.number.gt(0)], () => dna)
    .otherwise(() => [])

  if (!selected.length) return ""

  const isScattered = selected === user && app.length === 0
  const sourceLabel = thread.length
    ? "THREAD"
    : app.length
      ? "CURRENT APP"
      : "SCATTERED FROM MULTIPLE APPS"

  const lines = selected
    .map((i) => {
      const crossApp =
        opts?.appId && i.appId && i.appId !== opts.appId
          ? " [from other app]"
          : ""
      return `${i.emoji ?? "📝"} **${i.title ?? "Instruction"}**${crossApp}: ${i.content}`
    })
    .join("\n")

  return `\n\n## 🎯 USER'S CUSTOM INSTRUCTIONS (${sourceLabel}):\nThese are personalized instructions the user has created to guide your behavior. Follow them when relevant.\n\n${lines}${isScattered ? "\n\n_Instructions scattered across apps for diverse context._" : ""}`
}

// ─────────────────────────────────────────────────────────────────
// Character profiles section
// ─────────────────────────────────────────────────────────────────

type OwnerCheck = {
  userId?: string | null
  guestId?: string | null
}

export const isOwner = (
  owner?: OwnerCheck,
  ctx?: { userId?: string | null; guestId?: string | null },
): boolean => {
  if (!owner || !ctx) return false
  if (owner.userId && ctx.userId === owner.userId) return true
  if (owner.guestId && ctx.guestId === owner.guestId) return true
  return false
}
export function buildCharacterContext(
  sushi: Pick<
    sushi,
    | "characterProfiles"
    | "appCharacterProfiles"
    | "threadCharacterProfiles"
    | "dnaCharacterProfiles"
  >,
): string {
  type Profile = {
    name?: string | null
    content: string
    isPinned?: boolean | null
  }

  const thread = (sushi.threadCharacterProfiles ?? []) as unknown as Profile[]
  const user = (sushi.characterProfiles ?? []) as unknown as Profile[]
  const app = (sushi.appCharacterProfiles ?? []) as unknown as Profile[]
  const dna = (sushi.dnaCharacterProfiles ?? []) as unknown as Profile[]

  if (!thread.length && !user.length && !app.length && !dna.length) return ""

  const parts: string[] = []

  if (thread.length && thread[0]) {
    parts.push(
      `\n\n## 🎯 ACTIVE CHARACTER (This Thread):\n${thread[0].content}\n\n⚠️ IMPORTANT: This is the active character for THIS conversation. It takes precedence over general profiles.`,
    )
  }

  const pinnedUsers = user.filter((p) => p.isPinned)
  const otherUsers = user.filter((p) => !p.isPinned)
  const orderedUsers = [...pinnedUsers, ...otherUsers]

  if (orderedUsers.length) {
    parts.push(
      `\n\n## ⭐ USER CHARACTERS (Favorites first):\n${orderedUsers
        .map((p) => `**${p.name ?? "Character"}**: ${p.content}`)
        .join("\n\n")}`,
    )
  }

  if (app.length) {
    parts.push(
      `\n\n## 🤖 APP CHARACTERS (Domain Expertise):\n${app.map((p) => `**${p.name ?? "Character"}**: ${p.content}`).join("\n\n")}`,
    )
  }

  if (dna.length && !thread.length && !user.length) {
    parts.push(
      `\n\n## 🧬 CREATOR'S CHARACTERS:\n${dna.map((p) => `**${p.name ?? "Character"}**: ${p.content}`).join("\n\n")}`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Placeholder / conversation starters section
// ─────────────────────────────────────────────────────────────────

export function buildPlaceholderContext(
  sushi: Pick<
    sushi,
    "userPlaceholders" | "appPlaceholders" | "threadPlaceholders"
  >,
): string {
  type Placeholder = { text: string }

  const thread = ((sushi.threadPlaceholders ?? []) as Placeholder[])[0]
  const app = ((sushi.appPlaceholders ?? []) as Placeholder[])[0]
  const user = ((sushi.userPlaceholders ?? []) as Placeholder[])[0]

  if (!thread && !app && !user) return ""

  const lines: string[] = []
  if (user) lines.push(`- User placeholder: "${user.text}"`)
  if (app) lines.push(`- App placeholder: "${app.text}"`)
  if (thread) lines.push(`- Thread placeholder: "${thread.text}"`)

  return `\n\n## 💬 PERSONALIZED CONVERSATION STARTERS:\nYou recently generated these suggestions for the user:\n${lines.join("\n")}\n\nThese reflect the user's interests and recent conversations.`
}

// ─────────────────────────────────────────────────────────────────
// DNA (app-owner foundational knowledge) section
// ─────────────────────────────────────────────────────────────────

export function buildDnaContext(
  sushi: Pick<sushi, "dnaMemories" | "dnaInstructions">,
  creatorName?: string,
): string {
  type DnaMemory = {
    content?: string | null
    title?: string | null
    category?: string | null
  }
  type DnaInstruction = {
    emoji?: string | null
    title?: string | null
    content: string
    appId?: string | null
  }

  const memories = (sushi.dnaMemories ?? []) as DnaMemory[]
  const instructions = (sushi.dnaInstructions ?? []) as DnaInstruction[]

  const knowledgeMems = memories
    .filter((m) =>
      match(m.category)
        .with(P.union("preference", "relationship", "goal"), () => false)
        .otherwise(() => true),
    )
    .map((m) => m.content || m.title || "")
    .filter((c) => c.length > 10)
    .slice(0, 10)

  const filteredInstructions = instructions.slice(0, 5)

  if (!knowledgeMems.length && !filteredInstructions.length) return ""

  const creator = creatorName ?? "creator"
  const parts: string[] = []

  if (filteredInstructions.length) {
    parts.push(
      `\n\n## 🎯 CREATOR'S WORKFLOW PATTERNS (from ${creator}):\n${filteredInstructions
        .map(
          (i) =>
            `${i.emoji ?? "📝"} **${i.title ?? "Pattern"}**: ${i.content.slice(0, 200)}${i.content.length > 200 ? "..." : ""}`,
        )
        .join(
          "\n",
        )}\n\n_General workflow patterns the creator uses across apps. No personal information included._`,
    )
  }

  if (knowledgeMems.length) {
    parts.push(
      `\n\n## 🧬 APP DNA (from ${creator}):\n\n**Foundational Knowledge:**\n${knowledgeMems.map((c) => `- ${c}`).join("\n")}\n\n_General knowledge about this app's purpose. No personal information included._`,
    )
  }

  if (parts.length) {
    parts.push(
      `\n\n---\n⚠️ **Privacy Notice**: This context contains only general, non-personal information about the app.`,
    )
  }

  return parts.join("")
}

// ─────────────────────────────────────────────────────────────────
// Store apps (Grape) section
// ─────────────────────────────────────────────────────────────────

export function buildAppsContext(
  storeApps: Array<{
    id: string
    name?: string | null
    title?: string | null
    description?: string | null
    icon?: string | null
  }>,
  storeName?: string,
): string {
  if (!storeApps.length) return ""

  const list = storeApps
    .map(
      (a) =>
        `- **${a.name}**${a.icon ? `: ${a.title ?? ""}` : ""}${a.description ? `: ${a.description}` : ""}`,
    )
    .join("\n")

  const names = storeApps.map((a) => a.name).join(", ")

  return `\n\n## 🍇 GRAPE (Discover Apps)\n\n**Available Apps** (shown in 🍇 Grape button):\n${list}\n\n**When users ask about discovering apps:**\n- Explain: "Click the 🍇 Grape button to discover apps and earn credits for feedback"\n- Available: ${names}\n- Browse → Click → Try → Feedback → Earn`
}

// ─────────────────────────────────────────────────────────────────
// Master builder — assembles all sections from a sushi object
// ─────────────────────────────────────────────────────────────────

export function buildPromptSections(
  sushi: sushi,
  opts?: PromptBuilderOpts,
): PromptSections {
  const creatorName =
    (sushi as any).user?.name ?? (sushi as any).guest?.id?.slice(0, 5) ?? ""

  const memories = buildMemoryContext(sushi, opts)
  const instructions = buildInstructionsContext(sushi, opts)
  const characterProfiles = buildCharacterContext(sushi)
  const placeholders = buildPlaceholderContext(sushi)
  const dna = buildDnaContext(sushi, creatorName)
  const apps = sushi.store?.apps?.length
    ? buildAppsContext(sushi.store.apps as any, sushi.store.name ?? undefined)
    : ""

  // Assemble sections using pattern matching for app-specific ordering
  const assembled = match(sushi.slug)
    .with("grape", () =>
      [memories, instructions, characterProfiles, placeholders, dna, apps]
        .filter(Boolean)
        .join(""),
    )
    .otherwise(() =>
      [memories, instructions, characterProfiles, placeholders, dna, apps]
        .filter(Boolean)
        .join(""),
    )

  return {
    memories,
    instructions,
    characterProfiles,
    placeholders,
    dna,
    apps,
    assembled,
  }
}

// ─────────────────────────────────────────────────────────────────
// Default join weights — used when agent doesn't specify its own
// ─────────────────────────────────────────────────────────────────

export interface JoinWeights {
  memories?: { user?: number; thread?: number; app?: number; dna?: number }
  instructions?: { user?: number; thread?: number; app?: number; dna?: number }
  characterProfile?: {
    user?: number
    thread?: number
    app?: number
    dna?: number
  }
  placeholders?: { user?: number; thread?: number; app?: number; dna?: number }
}

/**
 * Default weights for the main app in a store.
 * Agent can override via aiAgent.metadata.join
 */
export const DEFAULT_MAIN_APP_JOIN: JoinWeights = {
  memories: { user: 10, thread: 6, app: 6, dna: 4 },
  instructions: { user: 7, thread: 4, app: 5, dna: 2 },
  characterProfile: { user: 3, thread: 2, app: 2, dna: 1 },
  placeholders: { user: 4, thread: 3, app: 4, dna: 2 },
}

/**
 * Lighter weights for context (non-main) apps in a store.
 */
export const DEFAULT_CONTEXT_APP_JOIN: JoinWeights = {
  memories: { user: 3, thread: 2, app: 2, dna: 1 },
  instructions: { user: 2, thread: 2, app: 2, dna: 1 },
  characterProfile: { user: 1, thread: 1, app: 1, dna: 0 },
  placeholders: { user: 2, thread: 2, app: 2, dna: 1 },
}

/**
 * Merge agent join config over defaults.
 * Agent wins on any field it specifies.
 */
export function resolveJoinWeights(
  agentJoin?: JoinWeights | null,
  isMainApp = true,
): JoinWeights {
  const base = isMainApp ? DEFAULT_MAIN_APP_JOIN : DEFAULT_CONTEXT_APP_JOIN
  if (!agentJoin) return base

  return {
    memories: { ...base.memories, ...agentJoin.memories },
    instructions: { ...base.instructions, ...agentJoin.instructions },
    characterProfile: {
      ...base.characterProfile,
      ...agentJoin.characterProfile,
    },
    placeholders: { ...base.placeholders, ...agentJoin.placeholders },
  }
}

/**
 * Dynamic memory page size based on conversation length.
 * Shorter convos → more memories (user is just starting, needs full context).
 * Longer convos → fewer memories (context already in-thread).
 */
export function resolveMemoryPageSize(messageCount: number): number {
  if (messageCount <= 5) return 25
  if (messageCount <= 15) return 20
  if (messageCount <= 30) return 15
  if (messageCount <= 50) return 12
  if (messageCount <= 75) return 5
  if (messageCount <= 100) return 3
  return 1
}

export const toSafeApp = ({
  app,
  userId,
  guestId,
  skip,
}: {
  app?: Partial<sushi> | typeof apps.$inferInsert
  userId?: string
  guestId?: string
  skip?: boolean
}): Partial<sushi> | undefined => {
  if (!app) return undefined

  if (!skip && "store" in app && app?.store?.apps) {
    const safeApps = app.store.apps
      .map((a) => {
        const safeApp = toSafeApp({ app: a, userId, guestId, skip: true })
        return safeApp
          ? {
              ...safeApp,
              moltApiKey:
                isOwner(safeApp, { userId, guestId }) && safeApp.moltApiKey
                  ? "********"
                  : undefined,
              moltHandle: safeApp.moltHandle ?? undefined,
              moltAgentName: safeApp.moltAgentName ?? undefined,
              moltAgentKarma: safeApp.moltAgentKarma ?? undefined,
              moltAgentVerified: safeApp.moltAgentVerified ?? undefined,
              store: {
                ...a.store,
                apps:
                  a.store?.apps?.map((b) => {
                    const nestedApp = toSafeApp({
                      app: b,
                      userId,
                      guestId,
                      skip: true,
                    })
                    return nestedApp
                      ? {
                          ...nestedApp,
                          moltApiKey:
                            isOwner(nestedApp, { userId, guestId }) &&
                            nestedApp.moltApiKey
                              ? "********"
                              : undefined,
                          moltHandle: nestedApp.moltHandle ?? undefined,
                          moltAgentName: nestedApp.moltAgentName ?? undefined,
                          moltAgentKarma: nestedApp.moltAgentKarma ?? undefined,
                          moltAgentVerified:
                            nestedApp.moltAgentVerified ?? undefined,
                        }
                      : undefined
                  }) || [],
              },
            }
          : undefined
      })
      .filter((a) => a !== undefined)

    const parentSafeApp = toSafeApp({
      app,
      userId,
      guestId,
      skip: true,
    })
    return {
      ...parentSafeApp,
      agent: app?.agent,
      moltApiKey: parentSafeApp?.moltApiKey ?? undefined,
      moltHandle: parentSafeApp?.moltHandle ?? undefined,
      moltAgentName: parentSafeApp?.moltAgentName ?? undefined,
      moltAgentKarma: parentSafeApp?.moltAgentKarma ?? undefined,
      moltAgentVerified: parentSafeApp?.moltAgentVerified ?? undefined,
      store: app.store
        ? {
            ...app.store,
            apps: safeApps as sushi[],
          }
        : undefined,
    }
  }

  const result: Partial<sushi> = {
    id: app.id,
    name: app.name,
    tools: app.tools,
    title: app.title,
    storeSlug: app.storeSlug,
    slug: app.slug,
    chromeWebStoreUrl: app.chromeWebStoreUrl,
    status: app.status,
    visibility: app.visibility,
    capabilities: app.capabilities,
    description: app.description,
    icon: app.icon,
    themeColor: app.themeColor,
    createdOn: app.createdOn,
    updatedOn: app.updatedOn,
    defaultModel: app.defaultModel,
    highlights: app.highlights,
    images: app.images,
    subtitle: app.subtitle,
    features: app.features,
    blueskyHandle: app.blueskyHandle,
    userId: app.userId,
    guestId: app.guestId,
    backgroundColor: app.backgroundColor,
    onlyAgent: app.onlyAgent,
    tips: app.tips,
    tipsTitle: app.tipsTitle,
    storeId: app.storeId,
    instructions: (app as any).instructions || [],
    extend: app.extend,
    pricing: app.pricing,
    isSystem: app.isSystem,
    tier: app.tier,
    placeholder: app.placeholder,
    mainThreadId: app.mainThreadId,
    systemPrompt: isOwner(app, { userId, guestId })
      ? app.systemPrompt
      : undefined,
    moltApiKey:
      isOwner(app, { userId, guestId }) && app.moltApiKey
        ? "********"
        : undefined,
    moltHandle: app.moltHandle ?? undefined,
    moltAgentName: app.moltAgentName ?? undefined,
    moltAgentKarma: app.moltAgentKarma ?? undefined,
    moltAgentVerified: app.moltAgentVerified ?? undefined,
    characterProfiles: (app as sushi)?.characterProfiles,
    characterProfile: (app as sushi)?.characterProfiles?.[0],
    apiKeys:
      app.apiKeys &&
      typeof app.apiKeys === "object" &&
      isOwner(app, { userId, guestId })
        ? Object.keys(app.apiKeys).reduce((acc, key) => {
            acc[key as keyof apiKeys] = app?.apiKeys?.[
              key as keyof typeof app.apiKeys
            ]
              ? "********"
              : undefined
            return acc
          }, {} as apiKeys)
        : undefined,
  }

  return result
}

export function toSafeUser({ user }: { user?: Partial<user> | null }) {
  if (!user) return
  const result: Partial<user> = {
    id: user.id,
    name: user.name,
    userName: user?.userName,
    image: user?.image,
    // email: user?.email,
    role: user.role,
    roles:
      user.role && user.roles?.includes(user.role)
        ? user.roles
        : user?.role
          ? (user.roles || []).concat(user?.role)
          : user.roles,
    // createdOn: user.createdOn,
    // updatedOn: user.updatedOn,
  }

  return result
}

export function toSafeGuest({ guest }: { guest?: Partial<guest> | null }) {
  if (!guest) return
  const result: Partial<guest> = {
    id: guest.id,
    activeOn: guest.activeOn,
  }

  return result
}

export const OLLAMA_MODEL_MAP: Record<
  string,
  { name: string; reasoning_effort?: string }
> = {
  //glm-5.1:cloud
  "deepseek/deepseek-v3.2": {
    name: "deepseek-v3.2:cloud",
    reasoning_effort: "none",
  },
  "deepseek/deepseek-r1": {
    name: "deepseek-v3.2:cloud",
    reasoning_effort: "medium",
  },
  "deepseek/deepseek-chat": {
    name: "deepseek-v3.2:cloud",
    reasoning_effort: "none",
  },
  "deepseek-chat": { name: "deepseek-v3.2:cloud", reasoning_effort: "none" },
  "minimax/minimax-m2.7": {
    name: "minimax-m2.7:cloud",
    reasoning_effort: "high",
  },
  "minimax/minimax-m2.5": {
    name: "minimax-m2.5:cloud",
    reasoning_effort: "none",
  },
  "nvidia/nemotron-3-super-120b-a12b": {
    name: "deepseek-v3.2:cloud",
    reasoning_effort: "none",
  },
  "google/gemini-3.1-pro-preview": {
    name: "kimi-k2.5:cloud",
    reasoning_effort: "none",
  },
  "x-ai/grok-4.1-fast": { name: "kimi-k2.5:cloud", reasoning_effort: "none" },
}

export function toOllamaModel(orModelId: string) {
  return OLLAMA_MODEL_MAP[orModelId.replace(":free", "")]
}

// createOllamaClient removed — using @effect/ai-openai with Ollama baseURL instead

// ─────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────

function safeDecrypt(key: string | nil) {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    return undefined
  }
}

function byokDecrypt(key: string | nil) {
  if (!key || key.includes("...")) return undefined
  try {
    return decrypt(key)
  } catch {
    if (isE2E) return undefined
    throw new Error(
      "Your API key could not be decrypted. Please re-enter it in Settings.",
    )
  }
}

const plusTiers = ["plus", "pro"]
function isFreeTier(app: { tier: string | nil } | nil) {
  if (isE2E) return true
  return !plusTiers.includes(app?.tier || "")
}

// ─────────────────────────────────────────────────────────────────
// Agent defaults
// ─────────────────────────────────────────────────────────────────

const AGENT_DEFAULTS: Record<string, string> = {
  beles: "deepseek/deepseek-v3.2",
  sushi: "deepseek/deepseek-r1",
  deepSeek: "deepseek/deepseek-v3.2",
  peach: "deepseek/deepseek-r1",
  claude: "anthropic/claude-sonnet-4-6",
  chatGPT: "openai/gpt-5.4",
  free: "openrouter/free",
  gemini: "google/gemini-3.1-pro-preview",
  grok: "x-ai/grok-4.1-fast",
  perplexity: "perplexity/sonar-pro",
}

// ─────────────────────────────────────────────────────────────────
// Smart router — rate-limit-proof, cost-optimized
// ─────────────────────────────────────────────────────────────────

/** Atomik counter — process-level round-robin */
let _rr = 0
function roundRobin<T>(pool: T[]): T {
  return pool[_rr++ % pool.length]!
}

/** Deduplicated fallback chain (OpenRouter max 3 models) */
function buildChain(...pools: string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const pool of pools) {
    for (const m of pool) {
      if (!seen.has(m)) {
        seen.add(m)
        out.push(m)
        if (out.length >= 3) return out
      }
    }
  }
  return out
}

// ─── Model pools ─────────────────────────────────────────────────

const FREE_WITH_TOOLS: string[] = [
  "minimax/minimax-m2.5:free",
  "minimax/minimax-m2.7:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
]

const FREE_NO_TOOLS: string[] = ["openai/gpt-oss-120b:free", "openrouter/free"]

const CHEAP_PAID: string[] = ["deepseek/deepseek-v3.2"]

const MID_PAID: string[] = ["deepseek/deepseek-r1"]
// ["minimax/minimax-m2.7", "minimax/minimax-m2.5"]

const CHEAP_ANALYZERS: string[] = [
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.1-fast",
]

// ─── Source → Tier mapping ────────────────────────────────────────

const OLLAMA_SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> =
  {
    "moltbook/commentFilter": { tier: "cheap" },
    "moltbook/engagement": { tier: "cheap" },
    "ai/title": { tier: "cheap" },
    swarm: { tier: "cheap" },
    coder: { tier: "cheap" },
    "ai/content": { tier: "cheap" },
    "pear/validate": { tier: "cheap" },
    "rag/documentSummary": { tier: "cheap" },

    "moltbook/comment": { tier: "cheap" },
    "ai/tribe/comment": { tier: "cheap" },
    "ai/thread/instructions": { tier: "cheap" },
    comment: { tier: "cheap" },
    engagement: { tier: "cheap" },
    tribe_comment: { tier: "cheap" },
    tribe_engage: { tier: "cheap" },
    m2m: { tier: "mid" },
    post: { tier: "mid" },
    codebase: { tier: "mid" },
    autonomous: { tier: "mid" },
    "autonomous/bidding": { tier: "mid" },
  }
const SOURCE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
  ...OLLAMA_SOURCE_TIERS,
  "graph/cypher": { tier: "cheap" },
  "graph/entity": { tier: "cheap" },
  "graph/extract": { tier: "cheap" },
  "ai/sushi/file": { tier: "quality", model: "google/gemini-3.1-pro-preview" },
  "ai/sushi/webSearch": { tier: "premium", model: "perplexity/sonar-pro" },
}

const SCHEDULE_TIERS: Record<string, { tier: routeTier; model?: string }> = {
  swarm: { tier: "mid" },
  post: { tier: "mid" },
  engagement: { tier: "free" },
  comment: { tier: "free" },
  autonomous: { tier: "mid" },
}

// ─────────────────────────────────────────────────────────────────
// Route function
// ─────────────────────────────────────────────────────────────────

export interface routeResult {
  primary: string
  fallbacks: string[]
}

export function route(
  tier: routeTier,
  opts: {
    needsTools?: boolean
    needsAnalyze?: boolean
    preferModel?: string
  } = {},
): routeResult {
  if (opts.preferModel && !opts.preferModel.endsWith(":free")) {
    return {
      primary: opts.preferModel,
      fallbacks: buildChain(CHEAP_PAID, FREE_WITH_TOOLS),
    }
  }

  switch (tier) {
    case "free": {
      const pool = opts.needsTools
        ? FREE_WITH_TOOLS
        : [...FREE_WITH_TOOLS, ...FREE_NO_TOOLS]
      const primary = roundRobin(pool)
      return {
        primary,
        fallbacks: buildChain(
          pool.filter((m) => m !== primary),
          CHEAP_PAID,
        ),
      }
    }
    case "cheap": {
      const primary = roundRobin(CHEAP_PAID)
      return {
        primary,
        fallbacks: buildChain(
          CHEAP_PAID.filter((m) => m !== primary),
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "mid": {
      const pool = opts.needsAnalyze ? CHEAP_ANALYZERS : [...MID_PAID]
      const primary = roundRobin(pool)
      return {
        primary,
        fallbacks: buildChain(
          pool.filter((m) => m !== primary),
          CHEAP_PAID,
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "quality": {
      const primary = roundRobin(CHEAP_ANALYZERS)
      return {
        primary,
        fallbacks: buildChain(
          CHEAP_ANALYZERS.filter((m) => m !== primary),
          CHEAP_PAID,
          FREE_WITH_TOOLS,
        ),
      }
    }
    case "premium":
      return {
        primary: opts.preferModel ?? "anthropic/claude-sonnet-4-6",
        fallbacks: buildChain(MID_PAID, CHEAP_PAID, FREE_WITH_TOOLS),
      }
  }
}

// ─────────────────────────────────────────────────────────────────
// getModelProvider
// ──────────
// ───────────────────────────────────────────────────────

export type modelProviderOptions = {
  app?: sushi | nil
  source?: string | nil
  name?: string | nil
  modelId?: string | nil
  canReason?: boolean | nil
  job?: JobWithModelConfig | nil
  user?: user | nil
  guest?: guest | nil
  isEffect?: boolean | nil
  swarm?: { modelId?: string; postType?: string } | nil
}
export const getAiAgents = async ({
  state,
  userId,
  guestId,
  include: appId,
  forApp,
}: {
  state?: ("active" | "testing" | "inactive")[]
  userId?: string
  guestId?: string
  include?: string | string[]
  forApp?: sushi
} = {}) => {
  const result = await db
    .select()
    .from(aiAgents)
    .where(
      and(
        state ? inArray(aiAgents.state, state) : undefined,
        userId ? eq(aiAgents.userId, userId) : undefined,
        guestId ? eq(aiAgents.guestId, guestId) : undefined,
        appId
          ? Array.isArray(appId)
            ? appId.length > 0
              ? or(isNull(aiAgents.appId), inArray(aiAgents.appId, appId))
              : isNull(aiAgents.appId)
            : or(isNull(aiAgents.appId), eq(aiAgents.appId, appId))
          : undefined,
      ),
    )
    .orderBy(aiAgents.order)

  return forApp?.onlyAgent
    ? result.filter((a) => a.name === forApp.defaultModel)
    : result
}

export async function getModelProvider({
  app,
  swarm,
  user,
  guest,
  job,
  source,
  isEffect,
  ...rest
}: modelProviderOptions): Promise<ModelProviderResult> {
  const agents = (await getAiAgents({ include: app?.id })) as aiAgent[]
  const foundAgent = rest.name
    ? agents.find((a) => a.name.toLowerCase() === rest.name?.toLowerCase())
    : undefined
  const agent =
    foundAgent ??
    agents.find((a) => a.name.toLowerCase() === "sushi") ??
    agents[0]!

  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const isBYOK = !!accountKey
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const appKey = safeDecrypt(app?.apiKeys?.openrouter)
  const systemKey = isDevelopment
    ? process.env.OPENROUTER_SUSHI!
    : process.env.OPENROUTER_API_KEY!

  const orKey = byokKey ?? appKey ?? systemKey

  const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1
  const hasCredits = creditsLeft > 0
  const effectivelyHasCredits = hasCredits || !!byokKey
  const isJob = !!(swarm?.postType || job)

  const degradedKey = orKey

  const fallback = (): ModelProviderResult => {
    const { primary, fallbacks } = route("free", { needsTools: false })
    return {
      provider: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! })(
        primary,
        {
          models: buildChain(fallbacks),
        },
      ),
      modelId: primary,
      agentName: agent.name,
      lastKey: "openrouter",
      isFree: true,
      supportsTools: false,
      canAnalyze: false,
      isBYOK: false,
    }
  }

  const degraded = (): ModelProviderResult => {
    const { primary, fallbacks } = route("free", { needsTools: isJob })
    return {
      provider: createOpenRouter({ apiKey: degradedKey })(primary, {
        models: buildChain(fallbacks),
      }),
      modelId: primary,
      agentName: agent.name,
      lastKey: isBYOK ? "byok" : "system",
      isFree: true,
      isDegraded: true,
      supportsTools: modelCapabilities[primary]?.tools ?? false,
      canAnalyze: false,
      isBYOK: !!byokKey,
    }
  }

  if (isBYOK && !byokKey) return fallback()
  if (!effectivelyHasCredits) return degraded()

  const resolvedName =
    foundAgent?.name ??
    (source && SOURCE_TIERS[source] ? source : (rest.name ?? "sushi"))

  const explicitModel =
    swarm?.modelId ??
    job?.metadata?.modelId ??
    job?.modelConfig?.model ??
    rest.modelId

  const safeExplicitModel =
    explicitModel === "deepseek/deepseek-r1" && isJob
      ? "deepseek/deepseek-v3.2"
      : explicitModel

  let routeResult: routeResult

  if (safeExplicitModel && !safeExplicitModel.endsWith(":free")) {
    routeResult = route("cheap", { preferModel: safeExplicitModel })
  } else if (swarm?.postType && SCHEDULE_TIERS[swarm.postType]) {
    const cfg = SCHEDULE_TIERS[swarm.postType]!
    routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
  } else if (source && SOURCE_TIERS[source]) {
    const cfg = SOURCE_TIERS[source]!
    routeResult = route(cfg.tier, { preferModel: cfg.model, needsTools: true })
  } else if (resolvedName && AGENT_DEFAULTS[resolvedName]) {
    const agentModel = AGENT_DEFAULTS[resolvedName]!
    const isPremiumAgent = [
      "claude",
      "chatGPT",
      "gemini",
      "grok",
      "perplexity",
    ].includes(resolvedName)
    routeResult = route(isPremiumAgent ? "premium" : "cheap", {
      preferModel: agentModel,
      needsTools: true,
    })
  } else if (isJob) {
    routeResult = route("cheap", { needsTools: true })
  } else {
    routeResult = route("mid", { needsTools: true })
  }

  const modelId = routeResult.primary
  const fallbackModels = buildChain(routeResult.fallbacks)

  const ollamaModel = toOllamaModel(modelId)

  const orProvider = createOpenRouter({ apiKey: orKey })(modelId, {
    models: fallbackModels,
  })

  if (ollamaModel && !isBYOK) {
    // Use ollama-ai-provider for Ollama models
    const ollamaProvider = createOllama({
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    })
    return {
      provider: ollamaProvider(ollamaModel.name, {
        // reasoning_effort is Ollama-specific, pass as param
      }) as unknown as typeof orProvider,
      modelId,
      agentName: agent.name,
      lastKey: "ollama",
      supportsTools: true,
      canAnalyze: false,
      isBYOK: false,
      isBELEŞ: resolvedName === "beleş",
      isFree: false,
    }
  }

  const DEEPSEEK_API_MODEL_MAP: Record<string, string> = {
    "deepseek/deepseek-chat": "deepseek-chat",
    "deepseek/deepseek-r1": "deepseek-reasoner",
    "deepseek/deepseek-v3.2": "deepseek-chat",
  }

  const deepseekApiKey = !isBYOK ? process.env.DEEPSEEK_API_KEY : undefined
  const deepseekApiModelId = deepseekApiKey
    ? DEEPSEEK_API_MODEL_MAP[modelId]
    : undefined

  return {
    provider: isEffect
      ? null
      : deepseekApiModelId && deepseekApiKey
        ? createDeepSeek({ apiKey: deepseekApiKey })(deepseekApiModelId)
        : orProvider,
    modelId,
    agentName: agent.name,
    lastKey: deepseekApiModelId ? "deepseek" : "openrouter",
    supportsTools: modelCapabilities[modelId]?.tools ?? false,
    canAnalyze: modelCapabilities[modelId]?.canAnalyze ?? false,
    isBYOK: !!byokKey,
    isBELEŞ: resolvedName === "beleş",
    isFree: modelId.endsWith(":free") || modelId === "qwen/qwen3.6-plus",
  }
}

// ─────────────────────────────────────────────────────────────────
// getEmbeddingProvider
// ─────────────────────────────────────────────────────────────────

export const EMBEDDING_SOURCES: Record<string, string> = {
  codebase: "qwen/qwen3-embedding-8b",
  coder: "qwen/qwen3-embedding-8b",
  "rag/documentSummary": "qwen/qwen3-embedding-8b",
  "graph/cypher": "qwen/qwen3-embedding-8b",
  "graph/entity": "qwen/qwen3-embedding-8b",
  "graph/extract": "qwen/qwen3-embedding-8b",
  comment: "qwen/qwen3-embedding-8b",
  engagement: "qwen/qwen3-embedding-8b",
  tribe_comment: "qwen/qwen3-embedding-8b",
  tribe_engage: "qwen/qwen3-embedding-8b",
  "ai/tribe/comment": "qwen/qwen3-embedding-8b",
  "moltbook/comment": "qwen/qwen3-embedding-8b",
  "moltbook/engagement": "qwen/qwen3-embedding-8b",
  news: "qwen/qwen3-embedding-8b",
  default: "qwen/qwen3-embedding-8b",
}

export type getModelProviderOptions = {
  app?: sushi | null
  user?: user | null
  guest?: guest | null
  source?: string
  isEffect?: boolean
}

export async function getEmbeddingProvider({
  app,
  user,
  guest,
  isEffect,
  source,
}: getModelProviderOptions): Promise<{
  provider?: ReturnType<typeof createOpenRouter>
  modelId?: string
  textEmbeddingModel?: any
}> {
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const orKey = byokKey ?? safeDecrypt(app?.apiKeys?.openrouter) ?? systemKey

  const modelId =
    EMBEDDING_SOURCES[source || "default"] ??
    EMBEDDING_SOURCES.default ??
    "qwen/qwen3-embedding-8b"

  const creditsLeft = user?.creditsLeft ?? guest?.creditsLeft ?? 1

  const provider = isEffect
    ? undefined
    : creditsLeft === 0 || !orKey
      ? undefined
      : createOpenRouter({ apiKey: orKey })

  return {
    provider,
    modelId,
    textEmbeddingModel: modelId
      ? provider?.textEmbeddingModel(modelId)
      : undefined,
  }
}

const NODE_ENV = process.env.NODE_ENV
export const MODE = process.env.MODE

const DB_E2E_URL = process.env.DB_E2E_URL
const DB_LIVE_URL = process.env.DB_PROD_URL
const DB_LOCAL_E2E_URL = process.env.DB_LOCAL_E2E_URL
export const DB_URL =
  (MODE === "prod"
    ? DB_LIVE_URL
    : isE2E && isDevelopment
      ? DB_LOCAL_E2E_URL
      : MODE === "e2e"
        ? DB_E2E_URL
        : process.env.DB_URL) || "postgres://postgres@localhost:5432/waffles"

export const isCI = process.env.CI

export const isWaffles = isDevelopment

export const isSeedSafe = isWaffles

// export const isWaffles = process.env.DB_URL?.includes("waffles")

export const isProd = NODE_ENV === "production"

export const isVex = !isWaffles

const isRemoteDB = DB_URL && !DB_URL.includes("localhost")
const disableSSL = process.env.DISABLE_DB_SSL === "true"

const client = postgres(
  DB_URL,
  isDevelopment
    ? {
        max: 50,
        prepare: false,
        idle_timeout: 20,
        connect_timeout: 10,
      }
    : {
        max: 50,
        prepare: false,
        idle_timeout: 20,
        connect_timeout: 10,
        ssl:
          isRemoteDB && !disableSSL
            ? {
                rejectUnauthorized: false, // Accept self-signed certificates
              }
            : false,
      },
)

const getDb = (): PostgresJsDatabase<typeof schema> => {
  if (NODE_ENV !== "production" && !isCI) {
    if (!globalThis.db) globalThis.db = postgresDrizzle(client, { schema })
    return globalThis.db!
  } else {
    return postgresDrizzle(client, { schema })
  }
}

export const db: PostgresJsDatabase<typeof schema> = getDb()
export async function getAccount({
  userId,
  provider,
}: {
  userId: string
  provider: string
}) {
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)))
    .limit(1)

  return account[0]
}

export async function getMemories({
  userId,
  guestId,
  appId,
  pageSize = 500,
  page = 1,
  orderBy = "createdOn",
  excludeThreadId,
  scatterAcrossThreads = false,
  threadId,
}: {
  userId?: string
  guestId?: string
  appId?: string
  pageSize?: number
  page?: number
  orderBy?: "createdOn" | "importance"
  excludeThreadId?: string
  scatterAcrossThreads?: boolean
  threadId?: string
}): Promise<{
  memories: memory[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> {
  const conditions = []
  if (appId) {
    // App memories: must have appId, must NOT have userId/guestId
    conditions.push(
      and(
        eq(memories.appId, appId),
        isNull(memories.userId),
        isNull(memories.guestId),
      ),
    )
  } else {
    // User memories: must have userId OR guestId, must NOT have appId
    if (userId) {
      conditions.push(eq(memories.userId, userId))
    }
    if (guestId) {
      conditions.push(eq(memories.guestId, guestId))
    }
    conditions.push(isNull(memories.appId))
  }

  if (threadId) {
    conditions.push(eq(memories.sourceThreadId, threadId))
  }

  // Exclude memories from current thread
  if (excludeThreadId) {
    conditions.push(sql`${memories.sourceThreadId} != ${excludeThreadId}`)
  }

  if (scatterAcrossThreads && orderBy === "importance") {
    // Smart scatter: Get ONE memory per thread using Drizzle subquery
    // Use window function to rank memories within each thread, then take top 1
    const rankedMemories = db.$with("ranked_memories").as(
      db
        .select({
          id: memories.id,
          userId: memories.userId,
          guestId: memories.guestId,
          appId: memories.appId,
          content: memories.content,
          title: memories.title,
          tags: memories.tags,
          category: memories.category,
          importance: memories.importance,
          usageCount: memories.usageCount,
          lastUsedAt: memories.lastUsedAt,
          embedding: memories.embedding,
          sourceThreadId: memories.sourceThreadId,
          sourceMessageId: memories.sourceMessageId,
          metadata: memories.metadata,
          createdOn: memories.createdOn,
          updatedOn: memories.updatedOn,
          rn: sql<number>`ROW_NUMBER() OVER (
              PARTITION BY ${memories.sourceThreadId} 
              ORDER BY 
                (${memories.importance} * 
                  CASE 
                    WHEN ${memories.createdOn} > NOW() - INTERVAL '7 days' THEN 1.5
                    WHEN ${memories.createdOn} > NOW() - INTERVAL '30 days' THEN 1.2
                    WHEN ${memories.createdOn} > NOW() - INTERVAL '90 days' THEN 1.0
                    ELSE 0.7
                  END
                ) DESC,
                ${memories.createdOn} DESC
            )`.as("rn"),
        })
        .from(memories)
        .where(and(...conditions)),
    )

    const result = await db
      .with(rankedMemories)
      .select({
        id: rankedMemories.id,
        userId: rankedMemories.userId,
        guestId: rankedMemories.guestId,
        appId: rankedMemories.appId,
        content: rankedMemories.content,
        title: rankedMemories.title,
        tags: rankedMemories.tags,
        category: rankedMemories.category,
        importance: rankedMemories.importance,
        usageCount: rankedMemories.usageCount,
        lastUsedAt: rankedMemories.lastUsedAt,
        embedding: rankedMemories.embedding,
        sourceThreadId: rankedMemories.sourceThreadId,
        sourceMessageId: rankedMemories.sourceMessageId,
        metadata: rankedMemories.metadata,
        createdOn: rankedMemories.createdOn,
        updatedOn: rankedMemories.updatedOn,
      })
      .from(rankedMemories)
      .where(eq(rankedMemories.rn, 1))
      .orderBy(desc(rankedMemories.createdOn))
      .limit(pageSize)

    const totalCount =
      (
        await db
          .select({ count: count(memories.id) })
          .from(memories)
          .where(and(...conditions))
      )[0]?.count ?? 0

    const hasNextPage = totalCount > page * pageSize
    const nextPage = hasNextPage ? page + 1 : null
    return {
      memories: result,
      totalCount,
      hasNextPage,
      nextPage,
    }
  }

  // Standard query (no scatter)
  const result = await db
    .select()
    .from(memories)
    .where(and(...conditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(
      orderBy === "createdOn"
        ? desc(memories.createdOn)
        : sql`(${memories.importance} * 
            CASE 
              WHEN ${memories.createdOn} > NOW() - INTERVAL '7 days' THEN 1.5
              WHEN ${memories.createdOn} > NOW() - INTERVAL '30 days' THEN 1.2
              WHEN ${memories.createdOn} > NOW() - INTERVAL '90 days' THEN 1.0
              ELSE 0.7
            END) DESC`,
    )

  const totalCount =
    (
      await db
        .select({ count: count(memories.id) })
        .from(memories)
        .where(and(...conditions))
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null
  return {
    memories: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export const getPlaceHolders = async ({
  threadId,
  userId,
  guestId,
  appId,
  pageSize = 50,
  tribePostId,
  scatterAcrossThreads = false,
}: {
  threadId?: string
  userId?: string
  guestId?: string
  appId?: string
  pageSize?: number
  tribePostId?: string
  scatterAcrossThreads?: boolean
}) => {
  // SCATTER MODE: Get placeholders scattered across different threads
  if (scatterAcrossThreads && (userId || guestId)) {
    const baseConditions = []
    const threadIdSql = threadId ?? null

    if (userId) {
      baseConditions.push(eq(placeHolders.userId, userId))
    } else if (guestId) {
      baseConditions.push(eq(placeHolders.guestId, guestId))
    }

    if (appId) {
      baseConditions.push(eq(placeHolders.appId, appId))
    }

    if (tribePostId) {
      baseConditions.push(eq(placeHolders.tribePostId, tribePostId))
    }

    // Use window function to rank placeholders per thread
    // Current thread gets priority
    // When threadId is provided, give it priority; otherwise order by date only
    // (avoid injecting null params whose type Postgres cannot infer)
    const windowOrderBy = threadIdSql
      ? sql`CASE WHEN ${placeHolders.threadId} = ${threadIdSql}::uuid THEN 0 ELSE 1 END, ${placeHolders.createdOn} DESC`
      : sql`${placeHolders.createdOn} DESC`

    const rankedPlaceHolders = db.$with("ranked_placeholders").as(
      db
        .select({
          id: placeHolders.id,
          userId: placeHolders.userId,
          guestId: placeHolders.guestId,
          appId: placeHolders.appId,
          threadId: placeHolders.threadId,
          tribePostId: placeHolders.tribePostId,
          text: placeHolders.text,
          metadata: placeHolders.metadata,
          createdOn: placeHolders.createdOn,
          updatedOn: placeHolders.updatedOn,
          rn: sql<number>`ROW_NUMBER() OVER (
            PARTITION BY ${placeHolders.threadId}
            ORDER BY ${windowOrderBy}
          )`.as("rn"),
        })
        .from(placeHolders)
        .where(and(...baseConditions)),
    )

    // Get top 2 from current thread + 1 from each other thread
    const scatteredResult = await db
      .with(rankedPlaceHolders)
      .select({
        id: rankedPlaceHolders.id,
        userId: rankedPlaceHolders.userId,
        guestId: rankedPlaceHolders.guestId,
        appId: rankedPlaceHolders.appId,
        threadId: rankedPlaceHolders.threadId,
        tribePostId: rankedPlaceHolders.tribePostId,
        text: rankedPlaceHolders.text,
        metadata: rankedPlaceHolders.metadata,
        createdOn: rankedPlaceHolders.createdOn,
        updatedOn: rankedPlaceHolders.updatedOn,
      })
      .from(rankedPlaceHolders)
      .where(
        or(
          // Current thread: up to 2 placeholders
          threadIdSql
            ? and(
                eq(rankedPlaceHolders.threadId, threadIdSql),
                sql`${rankedPlaceHolders.rn} <= 2`,
              )
            : sql`false`,
          // Other threads: 1 placeholder each
          threadIdSql
            ? sql`${rankedPlaceHolders.threadId} IS DISTINCT FROM ${threadIdSql}`
            : sql`true`,
          sql`${rankedPlaceHolders.rn} = 1`,
        ),
      )
      .orderBy(
        ...(threadIdSql
          ? [
              desc(
                sql`CASE WHEN ${rankedPlaceHolders.threadId} = ${threadIdSql}::uuid THEN 1 ELSE 0 END`,
              ),
            ]
          : []),
        desc(rankedPlaceHolders.createdOn),
      )
      .limit(pageSize)

    return scatteredResult
  }

  // STANDARD MODE: Original behavior
  const result = await db
    .select()
    .from(placeHolders)
    .where(
      and(
        appId ? eq(placeHolders.appId, appId) : undefined,
        threadId ? eq(placeHolders.threadId, threadId) : undefined,
        userId ? eq(placeHolders.userId, userId) : undefined,
        guestId ? eq(placeHolders.guestId, guestId) : undefined,
        tribePostId ? eq(placeHolders.tribePostId, tribePostId) : undefined,
      ),
    )
    .orderBy(desc(placeHolders.createdOn))
    .limit(pageSize)

  return result
}

export type newInstruction = typeof instructions.$inferInsert

export const createInstruction = async (instruction: newInstruction) => {
  const [inserted] = await db
    .insert(instructions)
    .values(instruction)
    .returning()

  return inserted
}

export const updateInstruction = async (instruction: instruction) => {
  const [updated] = await db
    .update(instructions)
    .set(instruction)
    .where(eq(instructions.id, instruction.id))
    .returning()

  return updated
}

export const deleteInstruction = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(instructions)
    .where(eq(instructions.id, id))
    .returning()

  return deleted
}

export const getSubscription = async ({
  userId,
  guestId,
  subscriptionId,
  sessionId,
}: {
  userId?: string
  guestId?: string
  subscriptionId?: string
  sessionId?: string
}) => {
  if (!userId && !guestId && !subscriptionId && !sessionId) {
    throw new Error(
      "At least one of userId, subscriptionId, or sessionId is required",
    )
  }

  const result = (
    await db
      .select()
      .from(subscriptions)
      .where(
        and(
          guestId ? eq(subscriptions.guestId, guestId) : undefined,
          userId ? eq(subscriptions.userId, userId) : undefined,
          subscriptionId
            ? eq(subscriptions.subscriptionId, subscriptionId)
            : undefined,
          sessionId ? eq(subscriptions.sessionId, sessionId) : undefined,
        ),
      )
  ).at(0)

  return result
}

export const getUser = async (payload: {
  email?: string
  id?: string
  password?: string
  stripeSubscriptionId?: string
  stripeSessionId?: string
  verificationToken?: string
  appleId?: string
  fingerprint?: string
  userName?: string
  apiKey?: string
  appId?: string
  skipCache?: boolean
  skipMasking?: boolean
  role?: "user" | "admin" | undefined
  threadId?: string
}) => {
  const {
    email,
    id,
    password,
    stripeSubscriptionId,
    stripeSessionId,
    verificationToken,
    appleId,
    fingerprint,
    userName,
    apiKey,
    appId,
    skipCache = false,
    skipMasking = false,
    role,
    threadId,
  } = payload

  const cacheKey = makeCacheKey(payload)

  // Skip cache if requested (e.g., for session updates) or no valid cache key
  if (!skipCache && cacheKey) {
    const cached = await getCache<user>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const app = appId ? await getApp({ id: appId }) : undefined

  const result = (
    await db
      .select()
      .from(users)
      .leftJoin(
        verificationTokens,
        eq(users.email, verificationTokens.identifier),
      )
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(
        and(
          fingerprint ? eq(users.fingerprint, fingerprint) : undefined,
          email ? eq(users.email, email) : undefined,
          id ? eq(users.id, id) : undefined,
          password ? eq(users.password, password) : undefined,
          role ? eq(users.role, role) : undefined,
          stripeSubscriptionId
            ? and(
                eq(subscriptions.provider, "stripe"),
                eq(subscriptions.subscriptionId, stripeSubscriptionId),
              )
            : undefined,
          stripeSessionId
            ? and(
                eq(subscriptions.provider, "stripe"),
                eq(subscriptions.sessionId, stripeSessionId),
              )
            : undefined,
          verificationToken
            ? eq(verificationTokens.token, verificationToken)
            : undefined,
          appleId ? eq(users.appleId, appleId) : undefined,
          userName ? eq(users.userName, userName) : undefined,
          apiKey ? eq(users.apiKey, apiKey) : undefined,
        ),
      )
  ).at(0)

  const now = new Date()
  const oneHourAgo = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() - 1,
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    ),
  )

  const [
    googleAccount,
    appleAccount,
    memoriesResult,
    lastMessageInfo,
    lastTribeInfo,
    lastMoltInfo,
    subscription,
    creditsLeft,
  ] = result
    ? await Promise.all([
        getAccount({ userId: result.user.id, provider: "google" }),
        getAccount({ userId: result.user.id, provider: "apple" }),
        getMemories({ userId: result.user.id }),
        getMessages({ userId: result.user.id, pageSize: 1 }),
        getMessages({ userId: result.user.id, pageSize: 1, isTribe: true }),
        getMessages({ userId: result.user.id, pageSize: 1, isMolt: true }),
        getSubscription({ userId: result.user.id }),
        getUserCreditsLeft({ userId: result.user.id, threadId }),
      ])
    : [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ]

  const memoriesCount = memoriesResult?.totalCount
  const lastMessage = lastMessageInfo?.messages.at(0)?.message
  const lastTribe = lastTribeInfo?.messages.at(0)?.message
  const lastMolt = lastMoltInfo?.messages.at(0)?.message

  const [
    messagesLastHourResult,
    instructionsResult,
    placeHolderResult,
    characterProfilesResult,
    pendingThreadsResult,
    activeThreadsResult,
  ] = result
    ? await Promise.all([
        getMessages({
          userId: result.user.id,
          createdAfter: oneHourAgo,
          aiAgent: true,
          isPear: false,
          pageSize: 1,
        }),
        app
          ? getInstructions({
              appId: app?.id,
              userId: result.user.id,
              pageSize: 7,
            })
          : Promise.resolve([]),
        getPlaceHolder({ userId: result.user.id }),
        getCharacterProfiles({ userId: result.user.id, pinned: true }),
        getThreads({
          userId: result.user.id,
          myPendingCollaborations: true,
          pageSize: 1,
        }),
        getThreads({
          userId: result.user.id,
          pageSize: 1,
          collaborationStatus: ["active"],
        }),
      ])
    : [undefined, undefined, undefined, undefined, undefined, undefined]

  const userData = result
    ? {
        ...result.user,
        isLinkedToGoogle: !!googleAccount,
        isLinkedToApple: !!appleAccount,
        hasCalendarScope:
          googleAccount?.scope?.includes("calendar.events") ?? false,
        hasRefreshToken: !!googleAccount?.refresh_token,
        messagesLastHour: messagesLastHourResult?.totalCount,
        creditsLeft,
        instructions: instructionsResult || [],
        placeHolder: placeHolderResult,
        memoriesCount,
        characterProfiles: characterProfilesResult,
        apiKeys: skipMasking
          ? result.user.apiKeys
          : result.user.apiKeys
            ? Object.keys(result.user.apiKeys).reduce((acc, key) => {
                const encryptedVal =
                  result.user?.apiKeys?.[
                    key as keyof typeof result.user.apiKeys
                  ]
                const val = encryptedVal
                  ? safeDecrypt(encryptedVal) || encryptedVal
                  : undefined
                acc[key as keyof apiKeys] = val
                  ? `${val.slice(0, 8)}...${val.slice(-4)}`
                  : undefined
                return acc
              }, {} as apiKeys)
            : null,
        lastMessage: lastMessage
          ? {
              ...lastMessage,
              content: "",
            }
          : lastMessage,
        lastMolt: lastMolt
          ? {
              ...lastMolt,
              content: "",
            }
          : lastMolt,
        lastTribe: lastTribe
          ? {
              ...lastTribe,
              content: "",
            }
          : lastTribe,
        messageCount: lastMessageInfo?.totalCount,

        pendingCollaborationThreadsCount: pendingThreadsResult?.totalCount,

        activeCollaborationThreadsCount: activeThreadsResult?.totalCount,

        roles: result?.user?.roles?.includes(result.user.role)
          ? result.user.roles
          : (result.user.roles || []).concat(result.user.role),

        subscription,
      }
    : undefined

  // Cache the enriched user data
  if (userData && cacheKey) {
    await setCache(cacheKey, userData, 60 * 5) // Cache for 5 minutes
  }

  return userData as user
}

// ─────────────────────────────────────────────────────────────────
// getMediaAPIKeys — image/replicate/fal key resolver
// ─────────────────────────────────────────────────────────────────

export const getMediaAPIKeys = ({
  app,
  user,
  guest,
}: {
  app?: sushi | null
  user?: user | null
  guest?: guest | null
}) => {
  const accountKey = user?.apiKeys?.openrouter ?? guest?.apiKeys?.openrouter
  const byokKey = accountKey ? byokDecrypt(accountKey) : undefined

  const systemKey = isFreeTier(app) ? process.env.OPENROUTER_API_KEY : undefined
  const appKey = safeDecrypt(app?.apiKeys?.openrouter)
  const or = byokKey ?? appKey ?? systemKey

  const systemReplicateKey = isFreeTier(app)
    ? process.env.REPLICATE_API_KEY
    : undefined
  const appReplicateKey = safeDecrypt(app?.apiKeys?.replicate)
  const replicate = byokKey ?? appReplicateKey ?? systemReplicateKey

  const systemFalKey = isFreeTier(app) ? process.env.FAL_API_KEY : undefined
  const appFalKey = safeDecrypt(app?.apiKeys?.fal)
  const fal = byokKey ?? appFalKey ?? systemFalKey

  return { fal, or, replicate }
}

export async function getAppExtends({
  appId,
  isSafe = true,
}: {
  appId: string
  isSafe?: boolean
}) {
  const result = await db
    .select({
      app: apps,
    })
    .from(appExtends)
    .innerJoin(apps, eq(appExtends.toId, apps.id))
    .where(eq(appExtends.appId, appId))

  // Return apps with extends property set to empty array to prevent infinite recursion
  return result.map((r) => ({
    id: r.app.id,
    slug: r.app.slug,
    name: r.app.name,
    storeId: r.app.storeId,
    description: r.app.description,
    extends: [],
  }))
}

export const getStoreApps = async (payload: {
  id?: string
  slug?: string
  userId?: string
  guestId?: string
  storeId?: string
  isSafe?: boolean
  depth?: number
  storeSlug?: string
  storeDomain?: string
  skipCache?: boolean
  ownerId?: string
  threadId?: string
  isSystem?: boolean
  role?: "admin" | "user"
}): Promise<sushi | undefined> => {
  const {
    id,
    slug,
    userId,
    guestId,
    storeId,
    isSafe = true,
    depth = 0,
    storeSlug,
    storeDomain,
    skipCache = false,
    ownerId,
    isSystem,
    role,
  } = payload
  // Use user-specific cache key if userId/guestId provided (for placeholders)
  // Otherwise use public cache key

  // Delegate base lookup to chopStick (deduplicates condition/query logic)
  const base = await chopStick({
    id,
    slug,
    // slug,
    role,
    userId,
    guestId,
    storeSlug,
    // storeId,
    isSafe,
    isSystem,
    // storeSlug,
    storeDomain,
    ownerId,
    // ownerId,
    // threadId,
    // depth,
    // isSystem,
    // role,
    // skipCache: true,
    // include: ["characterProfiles", "highlights", "store"],
  })
  if (!base) return undefined
  // return base
  // return base
  const appId = base.id as string

  // Determine which store to use:
  // 1. If storeId provided, check if app belongs to that store context
  // 2. App belongs if: installed via storeInstalls OR in parent store chain
  // 3. If belongs, use provided storeId (domain store context)
  // 4. Otherwise, use app's own storeId
  let targetStoreId = base.storeId as string | undefined

  if (storeId && storeId !== targetStoreId) {
    const [installation] = await db
      .select()
      .from(storeInstalls)
      .where(
        and(eq(storeInstalls.storeId, storeId), eq(storeInstalls.appId, appId)),
      )
      .limit(1)

    const [providedStore] = await db
      .select({ parentStoreId: stores.parentStoreId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1)

    let isInParentChain = false
    let currentParentId = providedStore?.parentStoreId
    while (currentParentId && !isInParentChain) {
      if (currentParentId === targetStoreId) {
        isInParentChain = true
      } else {
        const [parentStore] = await db
          .select({ parentStoreId: stores.parentStoreId })
          .from(stores)
          .where(eq(stores.id, currentParentId))
          .limit(1)
        currentParentId = parentStore?.parentStoreId || null
      }
    }

    if (installation || isInParentChain) {
      targetStoreId = storeId
    }
  }

  const storeData = storeDomain
    ? await getStore({ domain: storeDomain, userId, guestId, depth, skipCache })
    : targetStoreId
      ? await getStore({ id: targetStoreId, userId, guestId, depth, skipCache })
      : undefined

  // Build store with apps array for hyperlink navigation
  const storeWithApps = storeData
    ? {
        ...storeData.store,
        title: storeData.store.name,
        apps: await Promise.all(
          storeData.apps.map(async (a) =>
            toSafeApp({ app: { ...a }, userId, guestId }),
          ),
        ),
        app: toSafeApp({
          app: {
            ...storeData.app,
          } as unknown as sushi,
          userId,
          guestId,
        }),
      }
    : undefined

  const result = {
    ...base,
    extends: await getAppExtends({ appId }),
    store: storeWithApps,
    placeHolder: await getPlaceHolder({ appId, userId, guestId }),
  } as unknown as sushi

  const isOwner =
    (userId && base.userId === userId) || (guestId && base.guestId === guestId)

  // Cache the result (1 hour for public, 5 minutes for owners) - fire and forget

  // if (result.store && result && result?.store?.slug !== result?.storeSlug) {
  //   await updateApp({ id: result.id, storeSlug: result.store.slug })
  //   return {
  //     ...result,
  //     storeSlug: result.store.slug,
  //   }
  // }

  return result
}

export const chopStick = async <T extends sushi>(
  payload: ramen,
): Promise<sushi | undefined> => {
  // Build app identification conditions
  const llm = payload?.llm
  const appConditions = []

  const {
    id,
    slug,
    userId,
    guestId,
    storeId,
    storeSlug,
    storeDomain,
    ownerId,
    threadId,
    isSystem,
    role,
    exclude,
    name,
    include: includeInternal,
    join,
    agent,
    buildPrompt,
    messageCount,
  } = payload

  const cacheKey = makeCacheKey(payload)
  const skipCache = payload.skipCache || !includeInternal?.includes("store")
  if (!skipCache) {
    const cached = await getCache<sushi>(cacheKey)
    if (cached) return cached
  }

  const depth = payload.depth || payload?.buildPrompt?.includes("store") ? 1 : 0

  const defaultInclude =
    depth > 0
      ? ["characterProfiles", "highlights", "store"]
      : ["characterProfiles"]

  const include = [...defaultInclude, ...(includeInternal || [])].filter(
    (i) => !exclude?.includes(i as keyof sushi),
  ) as (keyof sushi)[]

  // Agent-driven join: agent.metadata.join overrides caller-supplied join
  // which itself overrides defaults. Resolution order: agent > payload > defaults.
  // const agentJoin = buildPrompt ? (agent as any)?.metadata?.join : null

  if (name) {
    appConditions.push(
      eq(apps.name, name as "Atlas" | "Peach" | "Vault" | "Bloom"),
    )
  }

  if (slug) {
    appConditions.push(eq(apps.slug, slug))
  }

  if (ownerId) {
    appConditions.push(or(eq(apps.userId, ownerId), eq(apps.guestId, ownerId)))
  }

  if (id) {
    appConditions.push(eq(apps.id, id))
  }

  if (role) {
    appConditions.push(eq(users.role, role))
  }

  if (storeId) {
    appConditions.push(eq(apps.storeId, storeId))
  }

  if (storeSlug) {
    appConditions.push(eq(stores.slug, storeSlug))
  }

  if (storeDomain) {
    appConditions.push(eq(stores.domain, storeDomain))
  }
  if (isSystem) {
    appConditions.push(eq(stores.isSystem, isSystem))
  }

  if (isSystem === false) {
    appConditions.push(not(stores.isSystem))
  }

  // Build access conditions (can user/guest access this app?)
  // Skip access check when searching by ID or ownerId (direct lookup)
  const accessConditions =
    id || ownerId
      ? undefined
      : or(
          // User's own apps
          userId ? eq(apps.userId, userId) : undefined,
          // Guest's own apps
          guestId ? eq(apps.guestId, guestId) : undefined,
          eq(apps.visibility, "public"),
        )

  // Build query with conditional store join
  const query = db
    .select({
      app: apps,
      user: users,
      guest: guests,
      store: stores,
    })
    .from(apps)
    .leftJoin(users, eq(apps.userId, users.id))
    .leftJoin(guests, eq(apps.guestId, guests.id))
    .leftJoin(stores, eq(apps.storeId, stores.id))

  const [app] = await query.where(
    and(
      appConditions.length > 0 ? and(...appConditions) : undefined,
      accessConditions,
    ),
  )

  if (!app) return undefined

  // Determine if user is owner from query result
  const isOwner =
    (userId && app.app.userId === userId) ||
    (guestId && app.app.guestId === guestId)

  // Phase 1b: dnaUser + dnaGuest in parallel (both depend only on dnaThread)

  // if (app.store && app.store.slug !== app.app.storeSlug) {
  //   await updateApp({ id: app.app.id, storeSlug: app.store.slug })
  // }

  const fullUser = llm
    ? await getUser({
        id: userId,
      })
    : undefined

  const fullGuest =
    llm && !fullUser
      ? await getGuest({
          id: guestId,
        })
      : undefined
  // Get DNA thread (app's main thread)
  const dnaThread = app.app.mainThreadId
    ? await db
        .select()
        .from(threads)
        .where(eq(threads.id, app.app.mainThreadId))
        .limit(1)
        .then((r) => r.at(0))
    : undefined
  const [dnaUser, dnaGuest] = await Promise.all([
    dnaThread?.userId
      ? db
          .select()
          .from(users)
          .where(eq(users.id, dnaThread.userId))
          .limit(1)
          .then((r) => r.at(0))
      : Promise.resolve(undefined),
    dnaThread?.guestId
      ? db
          .select()
          .from(guests)
          .where(eq(guests.id, dnaThread.guestId))
          .limit(1)
          .then((r) => r.at(0))
      : Promise.resolve(undefined),
  ])

  const isCharacterProfileEnabled =
    dnaUser?.characterProfilesEnabled ||
    dnaGuest?.characterProfilesEnabled ||
    isOwner ||
    false

  const hasDNA =
    join?.characterProfile?.dna ||
    join?.memories?.dna ||
    join?.instructions?.dna ||
    join?.placeholders?.dna

  const canDNA = hasDNA && isCharacterProfileEnabled

  let generativeModel
  let embeddingModel
  // Phase 2: All independent queries in parallel (concurrency limited to 5)
  const limit = pLimit(15)
  const [
    /*1*/ userMemories,
    /*2*/ userCharacterProfiles,
    /*3*/ appCharacterProfiles,
    /*4*/ threadCharacterProfiles,
    /*5*/ dnaCharacterProfiles,
    /*6*/ threadMemories,
    /*7*/ appMemories,
    /*8*/ dnaMemories,
    /*9*/ threadPlaceholders,
    /*10*/ userPlaceholders,
    /*11*/ appPlaceholders,
    /*12*/ dnaPlaceholders,
    /*13*/ userInstructions,
    /*14*/ appInstructions,
    /*15*/ threadInstructions,
    /*16*/ dnaInstructions,
    /*17*/ storeApps,
  ] = await Promise.all([
    // 1 user memories
    limit(() =>
      join?.memories?.user
        ? getMemories({
            pageSize: join.memories.user,
            userId,
            guestId,
            scatterAcrossThreads: true,
          })
        : Promise.resolve(undefined),
    ),
    // 2 user character profiles
    limit(() =>
      include.includes("characterProfiles")
        ? getCharacterProfiles({
            limit: join?.characterProfile?.user ?? 5,
            userId,
            guestId,
          })
        : Promise.resolve(undefined),
    ),
    // 3 app character profiles
    limit(() =>
      include.includes("characterProfiles")
        ? getCharacterProfiles({
            limit: join?.characterProfile?.app ?? 3,
            userId,
            appId: app.app.id,
            guestId,
          })
        : Promise.resolve(undefined),
    ),
    // 4 thread character profiles
    limit(() =>
      include.includes("characterProfiles") && threadId
        ? getCharacterProfiles({
            limit: join?.characterProfile?.thread ?? 3,
            userId,
            threadId,
            appId: app.app.id,
            guestId,
          })
        : Promise.resolve(undefined),
    ),
    // 5 dna character profiles (app-owner profiles, visible to everyone)
    limit(() =>
      dnaThread && isCharacterProfileEnabled
        ? getCharacterProfiles({
            limit: join?.characterProfile?.dna ?? 3,
            appId: app.app.id,
            isAppOwner: true,
          })
        : Promise.resolve(undefined),
    ),
    // 6 thread memories
    limit(() =>
      join?.memories?.thread && threadId
        ? getMemories({
            threadId,
            pageSize: join.memories.thread,
            userId,
            guestId,
            appId: app.app.id,
            scatterAcrossThreads: true,
          }).then((a) => a.memories)
        : Promise.resolve(undefined),
    ),
    // 7 app memories
    limit(() =>
      join?.memories?.app
        ? getMemories({
            pageSize: join.memories.app,
            appId: app.app.id,
            userId,
            guestId,
            scatterAcrossThreads: true,
          }).then((a) => a.memories)
        : Promise.resolve(undefined),
    ),
    // 8 dna memories
    limit(() =>
      isCharacterProfileEnabled && join?.memories?.dna && dnaThread
        ? getMemories({
            threadId: dnaThread.id,
            pageSize: join.memories.dna,
            scatterAcrossThreads: true,
          }).then((a) => a.memories)
        : Promise.resolve(undefined),
    ),
    // 9 thread placeholders
    limit(() =>
      join?.placeholders?.thread && threadId
        ? getPlaceHolders({
            threadId,
            appId: app.app.id,
            pageSize: join.placeholders.thread,
            userId,
            guestId,
            scatterAcrossThreads: true,
          })
        : Promise.resolve(undefined),
    ),
    // 10 user placeholders
    limit(() =>
      join?.placeholders?.user
        ? getPlaceHolders({
            pageSize: join.placeholders.user,
            userId,
            guestId,
            scatterAcrossThreads: true,
          })
        : Promise.resolve(undefined),
    ),
    // 11 app placeholders
    limit(() =>
      isCharacterProfileEnabled && join?.placeholders?.app
        ? getPlaceHolders({
            appId: app.app.id,
            userId,
            guestId,
            pageSize: join.placeholders.app,
            scatterAcrossThreads: true,
          })
        : Promise.resolve(undefined),
    ),
    // 12 dna placeholders
    limit(() =>
      join?.placeholders?.dna && dnaThread && isCharacterProfileEnabled
        ? getPlaceHolders({
            threadId: dnaThread.id,
            pageSize: join.placeholders.dna,
            userId: dnaThread.userId || undefined,
            guestId: dnaThread.guestId || undefined,
            scatterAcrossThreads: true,
          })
        : Promise.resolve(undefined),
    ),
    // 13 user instructions
    limit(() =>
      join?.instructions?.user && (userId || guestId)
        ? getInstructions({
            userId,
            guestId,
            pageSize: join.instructions.user,
            scatterAcrossApps: true,
          })
        : Promise.resolve(undefined),
    ),
    // 14 app instructions
    limit(() =>
      join?.instructions?.app
        ? getInstructions({
            appId: app.app.id,
            pageSize: join.instructions.app,
            userId,
            guestId,
            scatterAcrossApps: true,
          })
        : Promise.resolve(undefined),
    ),
    // 15 thread instructions
    limit(() =>
      join?.instructions?.thread && threadId
        ? getInstructions({
            threadId,
            userId,
            guestId,
            appId: app.app.id,
            scatterAcrossApps: true,
            pageSize: join.instructions.thread,
          })
        : Promise.resolve(undefined),
    ),
    // 16 dna instructions
    limit(() =>
      join?.instructions?.dna && dnaThread && isCharacterProfileEnabled
        ? getInstructions({
            appId: app.app.id,
            threadId: dnaThread.id,
            pageSize: join.instructions.dna,
            userId: dnaThread.userId || undefined,
            guestId: dnaThread.guestId || undefined,
            scatterAcrossApps: true,
          })
        : Promise.resolve(undefined),
    ),

    // 17 store apps
    limit(async () => {
      if (depth <= 0) {
        return Promise.resolve(undefined)
      }
      if (!include.includes("store")) {
        return Promise.resolve(undefined)
      }

      return getStoreApps({
        ...payload,
      }).then((a) => a?.store?.apps)
    }),
    // 18 & 19: resolved below after Promise.all — model/embedding need full app context
  ])

  const beast = storeApps?.find((a) => a?.id === app.store?.appId)

  // Build result object
  const result = {
    ...(toSafeApp({
      app: app.app,
      userId,
      guestId,
    }) as unknown as sushi),
    user: toSafeUser({ user: fullUser || app.user }),
    guest: toSafeGuest({ guest: fullGuest || app.guest }),

    store: app.store
      ? {
          name: app.store.name,
          title: app.store.title,
          description: app.store.description,
          slug: app.store.slug,
          images: app.store.images,
          excludeGridApps: app.store.excludeGridApps,
          isSystem: app.store.isSystem,
          domain: app.store.isSystem,
          appId: app.store.appId,
          userId: app.store.appId,
          guestId: app.store.guestId,
          parentStoreId: app.store.parentStoreId,
          visibility: app.store.visibility,
          createdOn: app.store.createdOn,
          updatedOn: app.store.updatedOn,
          app: toSafeApp({ app: beast }) ?? undefined,
          apps: !include.includes("store")
            ? []
            : (storeApps?.filter(Boolean).map((a) => toSafeApp({ app: a })) ??
              []),
        }
      : undefined,
    instructions: threadInstructions?.length
      ? threadInstructions
      : appInstructions?.length
        ? appInstructions
        : app.app.highlights,
    // Features
    tips: app.app.tips,
    highlights: !include.includes("highlights") ? null : app.app.highlights,
    features: !include.includes("features") ? null : app.app.features,
    systemPrompt: !include.includes("systemPrompt")
      ? null
      : app.app.systemPrompt,
    // Joined data
    userMemories,
    appMemories,
    dnaMemories,

    userPlaceholders,
    appPlaceholders,
    dnaPlaceholders,
    threadPlaceholders,
    threadMemories,
    threadInstructions,
    userInstructions,
    userCharacterProfiles,
    appInstructions,
    threadCharacterProfiles,
    dnaCharacterProfiles,
    appCharacterProfiles,
    characterProfiles: [
      ...(threadCharacterProfiles ?? []),
      ...(appCharacterProfiles ?? []),
      ...(dnaCharacterProfiles ?? []),
    ].filter(Boolean),
    dnaInstructions,
  } as unknown as sushi

  function containsPersonalInfo(content: string): boolean {
    if (!content) return false

    // PII Patterns to filter
    const sensitivePatterns = [
      // Email addresses
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      // Phone numbers (various formats)
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      // Credit card numbers (basic pattern)
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
      // SSN patterns
      /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
      // API keys/tokens (common patterns)
      /\b(sk-|pk-|bearer\s|token\s|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_-]{20,}/i,
      // Password mentions
      /\b(password|passwd|pwd)\s*[:=]\s*\S+/i,
      // Private/internal notes
      /\b(private|confidential|internal only|do not share)\b/i,
      // User-specific identifiers that look like GUIDs with personal context
      /\b(userId|user_id|guestId|guest_id)\s*[:=]\s*[a-f0-9-]{36}/i,
    ]

    return sensitivePatterns.some((pattern) => pattern.test(content))
  }

  setCache(cacheKey, result, isOwner ? 60 * 5 : 60 * 60)

  // Cross-seed public cache if owner-specific request
  if (isOwner) {
    const publicCacheKey = makeCacheKey({ payload, public: true })
    setCache(publicCacheKey, { ...toSafeApp({ app: result }) }, 60 * 60)
  }

  return {
    ...result,
    // dnaArtifacts,
  }
}

export function serializeValue(value: any, path: string = ""): string[] {
  if (value === null || value === undefined) {
    return [`${path}=null`]
  }

  if (value instanceof Date) {
    return [`${path}=${value.toISOString()}`] // Deterministic ISO string [web:16]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      serializeValue(item, path ? `${path}[${index}]` : `[${index}]`),
    )
  }

  if (typeof value === "object") {
    // Handle custom objects (like ramen) by sorting keys
    const keys = Object.keys(value).sort()
    return keys.flatMap((key) =>
      serializeValue(value[key], path ? `${path}.${key}` : key),
    )
  }

  // Primitives
  return [`${path}=${String(value)}`]
}

export function makeCacheKey(payload: any): string {
  return serializeValue(payload).join("|")
}

export const getApp = async ({
  id,
  slug,
  userId,
  guestId,
  isSafe = true,
}: ramen): Promise<sushi | undefined> => {
  // Build app identification conditions
  const appConditions = []

  if (slug) {
    appConditions.push(eq(apps.slug, slug))
  }

  if (id) {
    appConditions.push(eq(apps.id, id))
  }

  const [app] = await db
    .select({
      app: apps,
      user: users,
      guest: guests,
    })
    .from(apps)
    .leftJoin(users, eq(apps.userId, users.id))
    .leftJoin(guests, eq(apps.guestId, guests.id))
    .where(and(...appConditions))

  if (!app) return undefined

  return (
    isSafe
      ? (toSafeApp({
          app: app.app,
          userId,
          guestId,
        }) as sushi)
      : { ...app.app }
  ) as sushi
}

// ─────────────────────────────────────────────────────────────────
// @providerprotocol/ai — model descriptor
//
// Used for: reasoning, multi-turn Thread, middleware pipeline,
// providers not in Vercel AI SDK (Moonshot, Cerebras, etc.)
// ─────────────────────────────────────────────────────────────────

export type PPModelId =
  | { provider: "anthropic"; model: string; thinking?: boolean }
  | { provider: "openai"; model: string }
  | { provider: "google"; model: string }
  | { provider: "groq"; model: string }
  | { provider: "openrouter"; model: string }
  | { provider: "proxy"; url: string }

export type PPTurn = Turn

/**
 * Build a @providerprotocol/ai llm instance from a PPModelId.
 * Returns null for providers handled by Vercel AI SDK.
 */
export function makePPModel(
  modelDesc: PPModelId,
  opts?: { thinking?: boolean; maxTokens?: number },
) {
  const thinkingParams = opts?.thinking
    ? {
        thinking: { type: "enabled" as const, budget_tokens: 8000 },
        max_tokens: opts?.maxTokens ?? 16000,
      }
    : opts?.maxTokens
      ? { max_tokens: opts.maxTokens }
      : undefined

  switch (modelDesc.provider) {
    case "anthropic":
      return llm({
        model:
          modelDesc.thinking || opts?.thinking
            ? anthropic(modelDesc.model, { betas: [betas.interleavedThinking] })
            : anthropic(modelDesc.model),
        params: thinkingParams,
      })
    case "openai":
      return llm({ model: openai(modelDesc.model) })
    case "google":
      return llm({ model: google(modelDesc.model) })
    case "groq":
      return llm({ model: groq(modelDesc.model) })
    case "openrouter":
      return llm({ model: openrouter(modelDesc.model) })
    case "proxy":
      return llm({
        model: proxy({
          endpoint: modelDesc.url,
          headers: { Authorization: `Bearer ${process.env.INTERNAL_AI_TOKEN}` },
        })("default"),
      })
  }
}

// ─────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────

export class AiProviderError extends Schema.TaggedError<AiProviderError>()(
  "AiProviderError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    provider: Schema.optional(Schema.String),
    modelId: Schema.optional(Schema.String),
    retryable: Schema.Boolean,
  },
) {}

export class AiParseError extends Schema.TaggedError<AiParseError>()(
  "AiParseError",
  {
    message: Schema.String,
    raw: Schema.String,
  },
) {}

export class AiTokenLimitError extends Schema.TaggedError<AiTokenLimitError>()(
  "AiTokenLimitError",
  {
    message: Schema.String,
    estimated: Schema.Number,
    limit: Schema.Number,
  },
) {}

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
  isBELEŞ?: boolean
  isDegraded?: boolean
  /** Raw Vercel AI SDK provider — for streaming paths */
  provider: any
}

export type EffectEmbeddingResult = {
  layer: Layer.Layer<AiEmbeddingModel.EmbeddingModel>
  modelId: string
  apiKey: string
}

export type StreamChunk =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "done"; fullText: string; reasoning?: string }

// ─────────────────────────────────────────────────────────────────
// Service interface — Dependency Injection via Context.Tag
// ─────────────────────────────────────────────────────────────────

export interface AiService {
  // ── Vercel AI SDK paths (OpenRouter, DeepSeek, most providers) ──

  /** Generate text — blocking, returns full string */
  generateText: (
    messages: ModelMessage[],
    opts?: { temperature?: number; maxTokens?: number },
  ) => Effect.Effect<string, AiProviderError>

  /** Stream text — returns Stream of chunks */
  streamText: (
    messages: ModelMessage[],
    opts?: { temperature?: number; maxTokens?: number },
  ) => Effect.Effect<Stream.Stream<StreamChunk, AiProviderError>, never>

  /** Structured output with Effect Schema */
  generateStructured: <A, I>(
    schema: Schema.Schema<A, I>,
    messages: ModelMessage[],
    opts?: { temperature?: number },
  ) => Effect.Effect<A, AiProviderError | AiParseError>

  /** Embed a single string */
  embed: (text: string) => Effect.Effect<number[], AiProviderError>

  /** Embed many strings — batched */
  embedMany: (
    texts: string[],
    opts?: { concurrency?: number },
  ) => Effect.Effect<number[][], AiProviderError>

  // ── @providerprotocol/ai paths (reasoning, multi-turn, middleware) ──

  /**
   * Generate with @providerprotocol/ai.
   * Use for: Claude thinking blocks, DeepSeek reasoning,
   *          multi-turn Thread, middleware pipeline.
   *
   * @example
   * const turn = yield* ai.ppGenerate(
   *   { provider: "anthropic", model: "claude-sonnet-4-20250514" },
   *   [{ role: "user", content: "Solve this..." }],
   *   { thinking: true }
   * )
   * console.log(turn.response.text)
   * console.log(turn.response.reasoning) // thinking blocks
   */
  ppGenerate: (
    modelDesc: PPModelId,
    messages: string | ModelMessage[],
    opts?: { thinking?: boolean; maxTokens?: number },
  ) => Effect.Effect<PPTurn, AiProviderError>

  /**
   * Stream with @providerprotocol/ai.
   * Same StreamChunk interface as streamText — drop-in for WebSocket paths.
   *
   * @example
   * const stream = yield* ai.ppStream(
   *   { provider: "anthropic", model: "claude-sonnet-4-20250514" },
   *   messages,
   *   { thinking: true }
   * )
   * yield* Stream.runForEach(stream, chunk =>
   *   chunk.type === "text"
   *     ? Effect.sync(() => sendToWebSocket(chunk.text))
   *     : Effect.void
   * )
   */
  ppStream: (
    modelDesc: PPModelId,
    messages: string | ModelMessage[],
    opts?: { thinking?: boolean; maxTokens?: number },
  ) => Effect.Effect<Stream.Stream<StreamChunk, AiProviderError>, never>

  /** Expose model metadata */
  meta: EffectModelResult
}

export class AiServiceTag extends Context.Tag("AiService")<
  AiServiceTag,
  AiService
>() {}

// ─────────────────────────────────────────────────────────────────
// Retry schedule — exponential with jitter, cap 30s
// Only retries on retryable errors (rate limit, network, timeout)
// ─────────────────────────────────────────────────────────────────

const retrySchedule = Schedule.exponential(Duration.seconds(1)).pipe(
  Schedule.jittered,
  Schedule.upTo(Duration.seconds(30)),
)

// ─────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("timeout") ||
    msg.includes("ECONNRESET") ||
    msg.includes("network")
  )
}

function toProviderError(err: unknown, modelId?: string): AiProviderError {
  const message = err instanceof Error ? err.message : String(err)
  return new AiProviderError({
    message,
    cause: err,
    modelId,
    retryable: isRetryable(err),
  })
}

// CoreMessage[] → string prompt for PP (when PP needs plain string)
function messagesToPrompt(messages: string | ModelMessage[]): string {
  if (typeof messages === "string") return messages
  return messages
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant"
      const content =
        typeof m.content === "string"
          ? m.content
          : (m.content as any[])
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("\n")
      return `${role}: ${content}`
    })
    .join("\n\n")
}

// ─────────────────────────────────────────────────────────────────
// Effect-native provider layer factories
// ─────────────────────────────────────────────────────────────────

const makeOpenRouterEffectLayer = (apiKey: string) =>
  OpenRouterClient.layer({
    apiKey: Redacted.make(apiKey),
  }).pipe(Layer.provide(FetchHttpClient.layer))

const makeOpenRouterEffectLayerForModel = (
  modelId: string,
  apiKey: string,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenRouterLanguageModel.layer({ model: modelId }).pipe(
    Layer.provide(makeOpenRouterEffectLayer(apiKey)),
  )

const makeOllamaEffectLayer = (
  modelId: string,
): Layer.Layer<AiLanguageModel.LanguageModel> => {
  // Map OpenRouter model ID to Ollama model name
  const ollamaModel = toOllamaModel(modelId)
  const actualModelId = ollamaModel?.name || modelId

  // Ollama uses OpenAI-compatible API at /v1/chat/completions
  return OpenAiLanguageModel.layer({ model: actualModelId }).pipe(
    Layer.provide(
      OpenAiClient.layer({
        apiKey: Redacted.make("ollama"),
        apiUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
      }).pipe(Layer.provide(FetchHttpClient.layer)),
    ),
  )
}

const makeDeepSeekEffectLayer = (
  modelId: string,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  OpenAiLanguageModel.layer({ model: modelId }).pipe(
    Layer.provide(
      OpenAiClient.layer({
        apiKey: Redacted.make(process.env.DEEPSEEK_API_KEY || ""),
        apiUrl: "https://api.deepseek.com/v1",
      }).pipe(Layer.provide(FetchHttpClient.layer)),
    ),
  )

const makeAnthropicEffectLayer = (
  modelId: string,
  apiKey: string,
): Layer.Layer<AiLanguageModel.LanguageModel> =>
  AnthropicLanguageModel.layer({ model: modelId }).pipe(
    Layer.provide(
      AnthropicClient.layer({
        apiKey: Redacted.make(apiKey),
      }).pipe(Layer.provide(FetchHttpClient.layer)),
    ),
  )

// ─────────────────────────────────────────────────────────────────
// getEffectModelLayer — resolves provider + builds Effect Layer
// ─────────────────────────────────────────────────────────────────

export async function getEffectModelLayer(
  options: modelProviderOptions,
): Promise<EffectModelResult> {
  const result = await getModelProvider(options)

  // Build Effect Layer based on provider type
  const layer =
    result.lastKey === "ollama"
      ? makeOllamaEffectLayer(result.modelId)
      : result.lastKey === "deepseek"
        ? makeDeepSeekEffectLayer(result.modelId)
        : result.lastKey === "anthropic"
          ? makeAnthropicEffectLayer(
              result.modelId,
              isDevelopment
                ? process.env.ANTHROPIC_API_KEY!
                : process.env.ANTHROPIC_API_KEY!,
            )
          : makeOpenRouterEffectLayerForModel(
              result.modelId,
              isDevelopment
                ? process.env.OPENROUTER_SUSHI!
                : process.env.OPENROUTER_API_KEY!,
            )

  return {
    layer,
    provider: result.provider as any,
    modelId: result.modelId,
    agentName: result.agentName,
    lastKey: result.lastKey,
    isFree: result.isFree ?? false,
    supportsTools: result.supportsTools,
    canAnalyze: result.canAnalyze,
    isBYOK: result.isBYOK,
    isBELEŞ: result.isBELEŞ ?? false,
    isDegraded: result.isDegraded ?? false,
  }
}

// ─────────────────────────────────────────────────────────────────
// getEmbeddingLayer
// ─────────────────────────────────────────────────────────────────

export async function getEmbeddingLayer(
  options: modelProviderOptions,
): Promise<EffectEmbeddingResult> {
  const result = await getEmbeddingProvider({
    app: options.app ?? undefined,
    user: options.user ?? undefined,
    guest: options.guest ?? undefined,
    source: options.source ?? undefined,
    isEffect: options.isEffect ?? undefined,
  } as any)

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
// makeAiServiceLayer — builds the full DI Layer
//
// This is the main entry point. Build once per request, provide
// to your Effect program via Effect.provide(program, serviceLayer).
//
// @example
// const layer = await makeAiServiceLayer({ source: "pear/validate", app })
// const result = await Effect.runPromise(
//   Effect.provide(myProgram, layer)
// )
// ─────────────────────────────────────────────────────────────────

export async function makeAiServiceLayer(
  options: modelProviderOptions,
): Promise<Layer.Layer<AiServiceTag>> {
  const meta = await getEffectModelLayer(options)
  const embeddingMeta = await getEmbeddingLayer(options)

  return Layer.succeed(AiServiceTag, {
    meta,

    // ── generateText (Vercel AI SDK) ─────────────────────────────
    generateText: (messages, opts) =>
      pipe(
        Effect.tryPromise({
          try: () =>
            generateText({
              model: meta.provider,
              messages,
              temperature: opts?.temperature ?? 0.7,
              maxOutputTokens: opts?.maxTokens,
              maxRetries: 0,
            }),
          catch: (e) => toProviderError(e, meta.modelId),
        }),
        Effect.map((r) => r.text),
        Effect.retry(retrySchedule),
        Effect.withSpan("ai.generateText", {
          attributes: { modelId: meta.modelId, agentName: meta.agentName },
        }),
      ),

    // ── streamText (Vercel AI SDK) ───────────────────────────────
    streamText: (messages, opts) =>
      Effect.succeed(
        Stream.asyncEffect<StreamChunk, AiProviderError>((emit) =>
          Effect.tryPromise({
            try: async () => {
              let fullText = ""
              let reasoning = ""

              const result = streamText({
                model: meta.provider,
                messages,
                temperature: opts?.temperature ?? 0.7,
                maxOutputTokens: opts?.maxTokens,
                maxRetries: 0,
              })

              for await (const part of result.fullStream) {
                if (part.type === "reasoning-delta") {
                  reasoning += part.text
                  await emit.single({ type: "reasoning", text: part.text })
                } else if (part.type === "text-delta") {
                  fullText += part.text
                  await emit.single({ type: "text", text: part.text })
                } else if (part.type === "finish") {
                  await emit.single({
                    type: "done",
                    fullText,
                    reasoning: reasoning || undefined,
                  })
                }
              }
              emit.end()
            },
            catch: (e) => toProviderError(e, meta.modelId),
          }),
        ).pipe(
          Stream.withSpan("ai.streamText", {
            attributes: { modelId: meta.modelId },
          }),
        ),
      ),

    // ── generateStructured (Vercel AI SDK + Effect Schema) ───────
    generateStructured: <A, I>(
      schema: Schema.Schema<A, I>,
      messages: ModelMessage[],
      opts?: { temperature?: number },
    ) =>
      pipe(
        Effect.tryPromise({
          try: () =>
            generateText({
              model: meta.provider,
              messages: [
                ...messages,
                {
                  role: "user" as const,
                  content:
                    "Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.",
                },
              ],
              temperature: opts?.temperature ?? 0.2,
              maxRetries: 0,
            }),
          catch: (e) => toProviderError(e, meta.modelId),
        }),
        Effect.flatMap((r) => {
          const raw = r.text
            .replace(/^```(?:json)?\n?/m, "")
            .replace(/\n?```$/m, "")
            .trim()

          return pipe(
            Effect.try({
              try: () => JSON.parse(raw),
              catch: () => new AiParseError({ message: "Invalid JSON", raw }),
            }),
            Effect.flatMap((parsed) =>
              Schema.decodeUnknown(schema)(parsed).pipe(
                Effect.mapError(
                  (e) =>
                    new AiParseError({
                      message: `Schema validation failed: ${e}`,
                      raw,
                    }),
                ),
              ),
            ),
          )
        }),
        Effect.retry(retrySchedule),
        Effect.withSpan("ai.generateStructured", {
          attributes: { modelId: meta.modelId },
        }),
      ),

    // ── embed (@effect/ai EmbeddingModel) ───────────────────────
    embed: (text) =>
      pipe(
        Effect.gen(function* () {
          const model = yield* AiEmbeddingModel.EmbeddingModel
          return yield* model.embed(text.substring(0, 8000))
        }),
        Effect.provide(embeddingMeta.layer),
        Effect.mapError((e) => toProviderError(e, embeddingMeta.modelId)),
        Effect.retry(retrySchedule),
        Effect.withSpan("ai.embed"),
      ),

    // ── embedMany (@effect/ai EmbeddingModel) ───────────────────
    embedMany: (texts, opts) =>
      pipe(
        Effect.gen(function* () {
          const model = yield* AiEmbeddingModel.EmbeddingModel
          return yield* model.embedMany(
            texts.map((t) => t.substring(0, 8000)),
            opts,
          )
        }),
        Effect.provide(embeddingMeta.layer),
        Effect.mapError((e) => toProviderError(e, embeddingMeta.modelId)),
        Effect.retry(retrySchedule),
        Effect.withSpan("ai.embedMany", {
          attributes: { count: texts.length },
        }),
      ),

    // ── ppGenerate (@providerprotocol/ai) ───────────────────────
    // Use for: reasoning, thinking blocks, multi-turn Thread
    ppGenerate: (modelDesc, messages, opts) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const model = makePPModel(modelDesc, opts)
            if (!model)
              throw new Error(
                `PP model build failed for provider: ${modelDesc.provider}`,
              )

            const input =
              typeof messages === "string" ? messages : (messages as any)

            return await model.generate(input)
          },
          catch: (e) =>
            toProviderError(
              e,
              (modelDesc as any).model ?? (modelDesc as any).url,
            ),
        }),
        Effect.retry(retrySchedule),
        Effect.withSpan("ai.ppGenerate", {
          attributes: {
            provider: modelDesc.provider,
            model: (modelDesc as any).model ?? "proxy",
            thinking: String(opts?.thinking ?? false),
          },
        }),
      ),

    // ── ppStream (@providerprotocol/ai) ─────────────────────────
    // Same StreamChunk interface as streamText — drop-in for WebSocket paths
    ppStream: (modelDesc, messages, opts) =>
      Effect.succeed(
        Stream.asyncEffect<StreamChunk, AiProviderError>((emit) =>
          Effect.tryPromise({
            try: async () => {
              const model = makePPModel(modelDesc, opts)
              if (!model)
                throw new Error(
                  `PP model build failed for provider: ${modelDesc.provider}`,
                )

              const input =
                typeof messages === "string" ? messages : (messages as any)

              const stream = model.stream(input)
              let fullText = ""
              let reasoning = ""

              for await (const event of stream) {
                if (event.type === "text_delta") {
                  fullText += event.delta?.text ?? ""
                  await emit.single({
                    type: "text",
                    text: event.delta?.text ?? "",
                  })
                } else if (event.type === "reasoning_delta") {
                  reasoning += event.delta?.text ?? ""
                  await emit.single({
                    type: "reasoning",
                    text: event.delta?.text ?? "",
                  })
                } else if (event.type === "message_stop") {
                  await emit.single({
                    type: "done",
                    fullText,
                    reasoning: reasoning || undefined,
                  })
                }
              }
              emit.end()
            },
            catch: (e) =>
              toProviderError(
                e,
                (modelDesc as any).model ?? (modelDesc as any).url,
              ),
          }),
        ).pipe(
          Stream.withSpan("ai.ppStream", {
            attributes: { provider: modelDesc.provider },
          }),
        ),
      ),
  })
}

// ─────────────────────────────────────────────────────────────────
// Convenience runners — for one-off calls without DI
// ─────────────────────────────────────────────────────────────────

/**
 * Run a single generateText — no DI required.
 * Used by legacy call sites and simple one-off generation.
 */
export async function runGenerateText(
  prompt: string,
  layer: Layer.Layer<AiLanguageModel.LanguageModel>,
): Promise<string> {
  const program = Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel
    const result = yield* model.generateText({ prompt })
    return result.text
  })
  return Effect.runPromise((program as any).pipe(Effect.provide(layer)))
}

/**
 * Run structured output with fallback — uses @effect/ai layer.
 * Validates output against Effect Schema, retries on parse failure.
 */
export async function runStructuredOutputWithFallback<A, I, R>(
  schema: Schema.Schema<A, I, R>,
  prompt: string,
  layer: Layer.Layer<AiLanguageModel.LanguageModel>,
): Promise<A> {
  const program = Effect.gen(function* () {
    const model = yield* AiLanguageModel.LanguageModel

    const result = yield* model.generateText({
      prompt: `${prompt}\n\nRespond ONLY with valid JSON. No markdown fences.`,
    })

    const raw = result.text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim()

    const parsed = yield* Effect.try({
      try: () => JSON.parse(raw),
      catch: () =>
        new AiParseError({ message: "Invalid JSON from model", raw }),
    })

    return yield* Schema.decodeUnknown(schema)(parsed).pipe(
      Effect.mapError(
        (e) => new AiParseError({ message: `Schema mismatch: ${e}`, raw }),
      ),
    )
  })

  return Effect.runPromise(
    (program as any).pipe(
      Effect.provide(layer),
      Effect.retry(
        Schedule.exponential(Duration.seconds(1)).pipe(
          Schedule.upTo(Duration.seconds(15)),
        ),
      ),
    ),
  )
}

// ─────────────────────────────────────────────────────────────────
// Legacy bridge helpers — backwards compat
// ─────────────────────────────────────────────────────────────────

export async function runEmbed(
  text: string,
  layer: Layer.Layer<AiEmbeddingModel.EmbeddingModel>,
): Promise<number[]> {
  const program = Effect.gen(function* () {
    const model = yield* AiEmbeddingModel.EmbeddingModel
    return yield* model.embed(text.substring(0, 8000))
  })
  return Effect.runPromise((program as any).pipe(Effect.provide(layer)))
}

export async function runEmbedMany(
  texts: string[],
  layer: Layer.Layer<AiEmbeddingModel.EmbeddingModel>,
  options?: { concurrency?: number },
): Promise<number[][]> {
  const program = Effect.gen(function* () {
    const model = yield* AiEmbeddingModel.EmbeddingModel
    return yield* model.embedMany(
      texts.map((t) => t.substring(0, 8000)),
      options,
    )
  })
  return Effect.runPromise((program as any).pipe(Effect.provide(layer)))
}

// ─────────────────────────────────────────────────────────────────
// Usage examples
// ─────────────────────────────────────────────────────────────────
//
// ── DI pattern (preferred for pipelines) ─────────────────────────
//
// const serviceLayer = await makeAiServiceLayer({ source: "pear/validate", app })
//
// const program = Effect.gen(function* () {
//   const ai = yield* AiServiceTag
//
//   // Vercel path — fast, all providers
//   const text = yield* ai.generateText([{ role: "user", content: "Hello!" }])
//
//   // Structured output
//   const feedback = yield* ai.generateStructured(FeedbackSchema, messages)
//
//   // Streaming — pipe chunks to WebSocket
//   const stream = yield* ai.streamText(messages)
//   yield* Stream.runForEach(stream, chunk =>
//     chunk.type === "text"
//       ? Effect.sync(() => sendChunk(chunk.text))
//       : Effect.void
//   )
//
//   // PP path — reasoning / thinking blocks
//   const turn = yield* ai.ppGenerate(
//     { provider: "anthropic", model: "claude-sonnet-4-20250514" },
//     messages,
//     { thinking: true }
//   )
//   console.log(turn.response.reasoning) // thinking blocks
//
//   // PP streaming with reasoning
//   const ppStream = yield* ai.ppStream(
//     { provider: "anthropic", model: "claude-sonnet-4-20250514" },
//     messages,
//     { thinking: true }
//   )
//   yield* Stream.runForEach(ppStream, chunk => {
//     if (chunk.type === "reasoning") sendReasoningChunk(chunk.text)
//     if (chunk.type === "text") sendChunk(chunk.text)
//     return Effect.void
//   })
//
//   // Embed
//   const vector = yield* ai.embed("some text")
//
//   return { text, feedback, turn, vector }
// })
//
// await Effect.runPromise(Effect.provide(program, serviceLayer))
//
// ── pear.ts pipeline ─────────────────────────────────────────────
//
// const step = (ctx: StepCtx) =>
//   Effect.gen(function* () {
//     const ai = yield* AiServiceTag
//     return yield* ai.generateStructured(FeedbackSchema, [
//       { role: "user", content: buildSystemPrompt(ctx) }
//     ])
//   }).pipe(
//     Effect.withSpan(`pear.step${ctx.step}`)
//   )
//
// const pipeline = pipe(
//   step({ step: 1, appId: reviewingApp.id }),
//   Effect.flatMap(feedback => step({ step: 2, feedback, appId: pear.id })),
//   Effect.flatMap(result => step({ step: 3, appId: targetApp.id })),
//   Effect.flatMap(result => step({ step: 4, appId: vault.id })),
//   Effect.flatMap(result => step({ step: 5, appId: grape.id })),
// )
//
// await Effect.runPromise(
//   Effect.provide(pipeline, serviceLayer)
// )
