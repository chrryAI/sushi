import { locales } from "@chrryai/donut/locales"
import type {
  aiAgent,
  cherry,
  store as chrryStore,
  guest,
  instructionBase,
  message,
  modelName,
  sushi,
  user,
} from "@chrryai/donut/types"
import * as bcrypt from "bcrypt"
import * as dotenv from "dotenv"
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
  type SQL,
  sql,
  sum,
} from "drizzle-orm"
import {
  type PostgresJsDatabase,
  drizzle as postgresDrizzle,
} from "drizzle-orm/postgres-js"
import langdetect from "langdetect"
import pLimit from "p-limit"
import postgres from "postgres"
import { v4 as uuidv4 } from "uuid"
import {
  chopStick,
  collectHipIdsFromMessage,
  getApp,
  getGuest,
  getHipId,
  getMessage,
  getMessages,
  getMood,
  getPlaceHolder,
  getThread,
  getUser,
  isOwner,
  makeCacheKey,
  serializeValue,
  toSafeApp,
  toSafeGuest,
  toSafeUser,
} from "./src/ai/sushi/aiProvider"

export * from "./src/ai/sushi/aiProvider"

import { MODEL_LIMITS, type ModelProviderResult } from "./src/ai/vault"
// import { createStores } from "./src/dna/createStores"
import { decrypt } from "./src/encryption"
import { deleteFalkorUser } from "./src/falkorSync"
// Better Auth tables

import {
  getCache,
  invalidateApp,
  invalidateGuest,
  invalidateStore,
  invalidateUser,
  setCache,
} from "./src/cache"
import { getPresignedUrl as getSignedS3Url } from "./src/lib/s3-signer"
import { redis } from "./src/redis"
import * as schema from "./src/schema"
import {
  accounts,
  affiliateClicks,
  affiliateLinks,
  affiliatePayouts,
  affiliateReferrals,
  agentApiUsage,
  aiAgents,
  analyticsSites,
  type apiKeys,
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
  GUEST_CREDITS_PER_MONTH,
  guests,
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
} from "./src/schema"

export type locale =
  | "en"
  | "de"
  | "es"
  | "fr"
  | "ja"
  | "ko"
  | "pt"
  | "zh"
  | "nl"
  | "sv"
  | "tr"
  | "fa"
  | string

export type {
  aiModel,
  aiModelResponse,
  aiSources,
  appCampaign,
  autonomousBid,
  KanbanCard,
  KanbanColumn,
  NewKanbanCard,
  NewKanbanColumn,
  NewUserKanbanBoard,
  newAppCampaign,
  newAutonomousBid,
  newSlotAuction,
  newSlotRental,
  newStoreTimeSlot,
  slotAuction,
  slotRental,
  storeTimeSlot,
  swarm,
  UserKanbanBoard,
} from "./src/schema"

export type { modelName }
export {
  appCampaigns,
  apps,
  authExchangeCodes,
  autonomousBids,
  codebaseIssues,
  codebaseQueries,
  codeEmbeddings,
  // createStores,
  // type getEmbeddingProvider,
  // type getMediaAPIKeys,
  // type getModelProvider,
  guests,
  kanbanCards,
  kanbanColumns,
  locales,
  MODEL_LIMITS,
  type ModelProviderResult,
  or,
  pearFeedback,
  premiumSubscriptions,
  realtimeAnalytics,
  recruitmentFlows,
  retroResponses,
  retroSessions,
  slotAuctions,
  slotRentals,
  storeTimeSlots,
  talentEarnings,
  talentInvitations,
  talentProfiles,
  talentThreads,
  // type userKanbanBoards,
  users,
}

// import { config } from "dotenv"

// config({ path: "../../.env" })
// dotenv.config({ path: ".env.sushi", override: false })
dotenv.config()

type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue }
//

const NODE_ENV = process.env.NODE_ENV
export const MODE = process.env.MODE

export const isE2E =
  process.env.TESTING_ENV === "e2e" || process.env.VITE_TESTING_ENV === "e2e"
export const isDevelopment = process.env.NODE_ENV === "development"

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

// Export cache functions and redis instance for external use
export * from "./src/cache"
export { decrypt, encrypt, generateEncryptionKey } from "./src/encryption"

import { MEMBER_CREDITS_PER_MONTH } from "@chrryai/donut/utils"
import captureException from "./src/captureException"
import { seedScheduledTribeJobs } from "./src/dna/seedScheduledTribeJobs"

export { redis, upstashRedis } from "./src/redis"
// Export Better Auth tables
export {
  type aiAgent,
  and,
  asc,
  // type cherry as scheduledJob,
  cosineDistance,
  count,
  desc,
  eq,
  gt,
  gte,
  type guest,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  max,
  ne,
  not,
  notInArray,
  type ramen,
  seedScheduledTribeJobs,
  sonarIssues,
  sonarMetrics,
  sql,
  type user,
}

// Export analytics tables

export const TEST_MEMBER_EMAILS =
  process.env.TEST_MEMBER_EMAILS?.split(",") || []
export const TEST_GUEST_FINGERPRINTS =
  process.env.TEST_GUEST_FINGERPRINTS?.split(",") || []
export const TEST_MEMBER_FINGERPRINTS =
  process.env.TEST_MEMBER_FINGERPRINTS?.split(",") || []

export const VEX_LIVE_FINGERPRINTS =
  process.env.VEX_LIVE_FINGERPRINTS?.split(",") || []

// Define locally to avoid circular dependency issues with chrry/utils
export const OWNER_CREDITS = 999999

export const canCollaborate = ({
  thread,
  userId,
  guestId,
}: {
  thread:
    | (thread & {
        collaborations?: { collaboration: collaboration; user: user }[]
      })
    | undefined
  userId?: string
  guestId?: string
}) => {
  return isOwner(thread, { userId, guestId })
    ? true
    : thread?.collaborations?.some(
        (collaboration: { collaboration: collaboration; user: user }) =>
          collaboration.user.id === userId &&
          collaboration.collaboration.status &&
          ["active", "pending"].includes(collaboration.collaboration.status),
      )
}

// export type user = typeof users.$inferSelect
export type newUser = typeof users.$inferInsert

declare global {
  // eslint-disable-next-line no-var -- only var works here
  // eslint-disable-next-line no-unused-vars
  var db: PostgresJsDatabase<typeof schema> | undefined
}

export type analyticsSite = typeof analyticsSites.$inferSelect
export type newAnalyticsSite = typeof analyticsSites.$inferInsert

export type sonarIssue = typeof sonarIssues.$inferSelect
export type newSonarIssue = typeof sonarIssues.$inferInsert
export type sonarMetric = typeof sonarMetrics.$inferSelect
export type newSonarMetric = typeof sonarMetrics.$inferInsert

export type feedbackTransaction = typeof feedbackTransactions.$inferSelect
export type newFeedbackTransaction = typeof feedbackTransactions.$inferInsert

export type appOrder = typeof appOrders.$inferSelect
export type newAppOrder = typeof appOrders.$inferInsert

export type appExtend = typeof appExtends.$inferSelect
export type newAppExtend = typeof appExtends.$inferInsert

export type storeInstall = typeof storeInstalls.$inferSelect
export type newStoreInstall = typeof storeInstalls.$inferInsert

export type { message }

export type newMessage = typeof messages.$inferInsert
export type sharedExpense = typeof sharedExpenses.$inferSelect
export type newSharedExpense = typeof sharedExpenses.$inferInsert
export type account = typeof accounts.$inferSelect
export type newAccount = typeof accounts.$inferInsert
export type affiliateClick = typeof affiliateClicks.$inferSelect
export type newAffiliateClick = typeof affiliateClicks.$inferInsert
export type verificationToken = typeof verificationTokens.$inferSelect
export type newVerificationToken = typeof verificationTokens.$inferInsert

export type emailVerificationToken = typeof verificationTokens.$inferSelect
export type newEmailVerificationToken = typeof verificationTokens.$inferInsert

export type authExchangeCode = typeof authExchangeCodes.$inferSelect
export type newAuthExchangeCode = typeof authExchangeCodes.$inferInsert

export type store = chrryStore
// typeof stores.$inferSelect
export type newStore = typeof stores.$inferInsert

// Partial store type for updates (excludes relational fields)
export type storeUpdate = {
  id: string
  name?: string
  description?: string | null
  slug?: string
  title?: string | null
  images?: Array<{
    url: string
    width?: number
    height?: number
    id: string
  }> | null
  excludeGridApps?: string[] | null
  teamId?: string | null
  domain?: string | null
  appId?: string | null
  userId?: string | null
  guestId?: string | null
  parentStoreId?: string | null
  isSystem?: boolean | null
  visibility?: "public" | "private" | "unlisted"
  credits?: number | null
  hourlyRate?: number | null
  updatedOn?: Date
}

export type tribeLike = typeof tribeLikes.$inferInsert

// Store with related data
export type storeWithRelations = {
  store: store
  user: user | null
  guest: guest | null
  team: team | null
  app: sushi | undefined
  apps: sushi[]
}

// Stores list result
export type storesListResult = {
  stores: storeWithRelations[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}

export type newGuest = typeof guests.$inferInsert

export type subscription = typeof subscriptions.$inferSelect
export type newSubscription = typeof subscriptions.$inferInsert

export type device = typeof devices.$inferSelect
export type newDevice = typeof devices.$inferInsert

export type thread = typeof threads.$inferSelect
export type newThread = typeof threads.$inferInsert

// export type aiAgent = typeof aiAgents.$inferSelect
export type newAiAgent = typeof aiAgents.$inferInsert

export type systemLog = typeof systemLogs.$inferSelect
export type newSystemLog = typeof systemLogs.$inferInsert

export type collaboration = typeof collaborations.$inferSelect
export type newCollaboration = typeof collaborations.$inferInsert

export type creditUsage = typeof creditUsages.$inferSelect
export type newCreditUsage = typeof creditUsages.$inferInsert

export type invitation = typeof invitations.$inferSelect
export type newInvitation = typeof invitations.$inferInsert

export type documentChunk = typeof documentChunks.$inferSelect
export type newDocumentChunk = typeof documentChunks.$inferInsert

export type messageEmbedding = typeof messageEmbeddings.$inferSelect
export type newMessageEmbedding = typeof messageEmbeddings.$inferInsert

export type threadSummary = typeof threadSummaries.$inferSelect
export type newThreadSummary = typeof threadSummaries.$inferInsert

export type memory = typeof memories.$inferSelect
export type newMemory = typeof memories.$inferInsert

export type characterProfile = typeof characterProfiles.$inferSelect
export type newCharacterProfile = typeof characterProfiles.$inferInsert

export type pushSubscription = typeof pushSubscriptions.$inferSelect
// export type newPushSubscription = typeof pushSubscriptions.$inferInsert;

export type creditTransaction = typeof creditTransactions.$inferSelect
export type newCreditTransaction = typeof creditTransactions.$inferInsert

export type calendarEvent = typeof calendarEvents.$inferSelect
export type newCalendarEvent = typeof calendarEvents.$inferInsert

export type city = typeof cities.$inferSelect
export type newCity = typeof cities.$inferInsert

export type affiliateReferral = typeof affiliateReferrals.$inferSelect
export type newAffiliateReferral = typeof affiliateReferrals.$inferInsert

export type affiliatePayout = typeof affiliatePayouts.$inferSelect
export type newAffiliatePayout = typeof affiliatePayouts.$inferInsert

export type affiliateLink = typeof affiliateLinks.$inferSelect
export type newAffiliateLink = typeof affiliateLinks.$inferInsert

export type placeHolder = typeof placeHolders.$inferSelect
export type newPlaceHolder = typeof placeHolders.$inferInsert

export type instruction = typeof instructions.$inferSelect
export type newInstruction = typeof instructions.$inferInsert

export type app = sushi
export type newApp = typeof apps.$inferInsert

// Scheduled jobs types (includes tribe_post, tribe_comment, tribe_engage, moltbook_post, moltbook_comment, moltbook_engage)
export type scheduledJob = typeof scheduledJobs.$inferSelect
export type newScheduledJob = typeof scheduledJobs.$inferInsert

export type modelProviderPayload = {
  id?: string
  app?: sushi
  modelId?: string
  source?: string
  name?:
    | "deepSeek"
    | "chatGPT"
    | "claude"
    | "sushi"
    | "gemini"
    | "perplexity"
    | "grok"
    | "flux"
    | "openrouter"
    | string
  canReason?: boolean
  job?: cherry
  user?: user | null
  guest?: guest | null
  isBYOK?: boolean
  isFree?: boolean
  swarm?: swarm
}

export type newAffiliateClicks = typeof affiliateClicks.$inferInsert

export type expense = typeof expenses.$inferSelect
export type newExpense = typeof expenses.$inferInsert

export type budget = typeof budgets.$inferSelect
export type newBudget = typeof budgets.$inferInsert

export type install = typeof installs.$inferSelect
export type newInstall = typeof installs.$inferInsert

export type team = typeof teams.$inferSelect
export type newTeam = typeof teams.$inferInsert

export type task = typeof tasks.$inferSelect
export type newTask = typeof tasks.$inferInsert

export type timer = typeof timers.$inferSelect
export type newTimer = typeof timers.$inferInsert

export type mood = typeof moods.$inferSelect
export type newMood = typeof moods.$inferInsert

export type NewCustomPushSubscription = {
  endpoint: string
  createdOn: Date
  updatedOn: Date
  keys: {
    p256dh: string
    auth: string
  }
}

export type CustomPushSubscription = NewCustomPushSubscription & {
  id: string
}

export function safeDecrypt(
  encryptedKey: string | undefined,
): string | undefined {
  if (!encryptedKey) return undefined
  try {
    return decrypt(encryptedKey)
  } catch (error) {
    // Security: Return undefined instead of encrypted value to prevent key leakage
    // If decryption fails, the key is invalid or corrupted - don't expose it
    // console.error("❌ Failed to decrypt API key - key may be corrupted:", error)
    return undefined
  }
}

export type messageActionType = {
  type: string
  params?: Record<string, any>
  times?: number // Number of times to repeat this action (for calendar navigation, etc.)
  completed?: boolean
  result?: unknown
  remember?: boolean
}

// Global type declaration for db
declare global {
  // eslint-disable-next-line no-var
  var db: PostgresJsDatabase<typeof schema> | undefined
}

if (!DB_URL) {
  throw new Error(
    "DB_URL environment variable is not set. Please configure your database connection string.",
  )
}

// Configure SSL for production databases (non-localhost)
// Can be disabled with DISABLE_DB_SSL=true for internal databases
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

// Export schema for accessing tables dynamically
export { schema }

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

export function passwordToSalt(password: string) {
  const saltRounds = 10
  const hash = bcrypt.hashSync(password, saltRounds)
  return hash
}

function byokDecrypt(encryptedKey: string | undefined): string | undefined {
  if (!encryptedKey) return undefined
  if (encryptedKey.includes("...")) return undefined

  try {
    return decrypt(encryptedKey)
  } catch (error) {
    if (isE2E) {
      // e2e uses fake keys — silently skip, fall through to env var
      return undefined
    }
    throw new Error(
      "Your API key could not be decrypted. Please re-enter it in Settings.",
    )
  }
}

const plusTiers = ["plus", "pro"]

function isFreeTier(app?: { tier?: string | null } | null): boolean {
  if (isE2E) return true
  return !plusTiers.includes(app?.tier || "")
}

// Privacy-friendly credit tracking functions
export async function logCreditUsage({
  userId,
  guestId,
  agentId,
  messageType,
  threadId,
  messageId,
  appId,
  // isWebSearchEnabled,
  metadata,
  ...rest
}: {
  userId?: string
  guestId?: string
  agentId: string
  creditCost: number
  metadata?: Record<string, any>
  messageType:
    | "user"
    | "ai"
    | "image"
    | "search"
    | "pear_feedback"
    | "pear_feedback_payment"
    | "pear_feedback_reward"
    | "tribe_post_comment_translate"
    | "tribe_post_translate"
  threadId?: string
  messageId?: string
  appId?: string
  // isWebSearchEnabled?: boolean
}) {
  const user = userId ? await getUser({ id: userId }) : undefined

  const guest = guestId ? await getGuest({ id: guestId }) : undefined

  const userKey = user?.apiKeys?.openrouter || guest?.apiKeys?.openrouter
  const byokKey = userKey ? byokDecrypt(userKey) : undefined

  const isBYOK = !!userKey

  const creditCost = byokKey ? 0 : rest.creditCost || 1

  console.log("🎯 logCreditUsage called:", {
    userId: userId?.substring(0, 8),
    guestId: guestId?.substring(0, 8),
    agentId: agentId?.substring(0, 8),
    creditCost,
    messageType,
    isTopUp: creditCost < 0,
    metadata,
  })

  // // Additional credit for AI-enhanced web search
  // if (isWebSearchEnabled) {
  //   creditCost += 1
  // }
  try {
    await db!.insert(creditUsages).values({
      userId,
      guestId,
      agentId,
      creditCost: String(creditCost),
      messageType,
      threadId,
      messageId,
      appId,
      metadata: {
        ...metadata,
        creditCost,
        isBYOK,
        isBYOK_BUT_NO_KEY: isBYOK && !byokKey,
      },
    })

    console.log("💰 Credit usage logged:", {
      user: (userId || guestId)?.substring(0, 8),
      agent: agentId.substring(0, 8),
      credits: creditCost,
      type: messageType,
      action: Number(creditCost) < 0 ? "REWARD" : "SPEND",
    })
  } catch (error) {
    console.error("❌ Error logging credit usage:", error)
    console.error("❌ Error details:", {
      userId,
      guestId,
      agentId,
      creditCost,
      messageType,
      error: error instanceof Error ? error.message : String(error),
    })
    // Don't throw - credit logging failure shouldn't block message creation
  }
}

// ─────────────────────────────────────────────────────────────────
// Per-stream usage logging (usage-based billing algorithm)
// ─────────────────────────────────────────────────────────────────

export async function logStreamUsage({
  userId,
  guestId,
  appId,
  agentId,
  threadId,
  messageId,
  modelId,
  keySource,
  tokensIn,
  tokensOut,
  isDegraded,
  isBYOK,
  pricingTable,
}: {
  userId?: string
  guestId?: string
  appId?: string
  agentId?: string
  threadId?: string
  messageId?: string
  modelId: string
  keySource: "byok" | "app_key" | "system_key" | "free"
  tokensIn: number
  tokensOut: number
  isDegraded?: boolean
  isBYOK?: boolean
  /** Pass the prizes object from vault so we don't re-import it here */
  pricingTable?: Record<string, { input: number; output: number }>
}) {
  try {
    const pricing = pricingTable?.[modelId]
    const costUsd = pricing
      ? (tokensIn / 1_000_000) * pricing.input +
        (tokensOut / 1_000_000) * pricing.output
      : 0

    await db!.insert(streamLogs).values({
      userId,
      guestId,
      appId,
      agentId,
      threadId,
      messageId,
      modelId,
      keySource,
      tokensIn,
      tokensOut,
      costUsd: String(costUsd),
      isDegraded: isDegraded ?? false,
      isBYOK: isBYOK ?? false,
    })
  } catch (error) {
    // Non-blocking — never let logging failures affect the user
    console.error(
      "❌ logStreamUsage failed:",
      error instanceof Error ? error.message : error,
    )
  }
}

// Calculate total credits spent by a user in a given month (privacy-friendly)
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

// Get hourly usage count for rate limiting (privacy-friendly)
export async function getHourlyUsage({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}): Promise<number> {
  try {
    const oneHourAgo = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
        new Date().getUTCHours() - 1,
        new Date().getUTCMinutes(),
        new Date().getUTCSeconds(),
      ),
    )

    const result = await db!
      .select({ count: count() })
      .from(creditUsages)
      .where(
        and(
          userId ? eq(creditUsages.userId, userId) : undefined,
          guestId ? eq(creditUsages.guestId, guestId) : undefined,
          gte(creditUsages.createdOn, oneHourAgo),
        ),
      )

    const hourlyCount = result[0]?.count || 0

    console.log("⏰ Hourly usage:", {
      user: (userId || guestId)?.substring(0, 8),
      count: hourlyCount,
      since: oneHourAgo.toISOString(),
    })

    return hourlyCount
  } catch (error) {
    console.error("❌ Error calculating hourly usage:", error)
    return 0
  }
}

// 🍐 Pear feedback quota management (10 submissions per day)
const PEAR_DAILY_LIMIT = 10

export async function checkPearQuota({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}): Promise<{ allowed: boolean; remaining: number; resetAt: Date | null }> {
  try {
    if (!userId && !guestId) {
      return { allowed: false, remaining: 0, resetAt: null }
    }

    const user = userId
      ? await db!.select().from(users).where(eq(users.id, userId)).limit(1)
      : null
    const guest = guestId
      ? await db!.select().from(guests).where(eq(guests.id, guestId)).limit(1)
      : null

    const record = user?.[0] || guest?.[0]
    if (!record) {
      return { allowed: false, remaining: 0, resetAt: null }
    }

    const now = new Date()
    const resetAt = record.pearFeedbackResetAt

    // Check if quota needs reset (24h passed)
    if (!resetAt || now > new Date(resetAt)) {
      // Reset quota
      const newResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h from now

      if (userId) {
        await db!
          .update(users)
          .set({
            pearFeedbackCount: 0,
            pearFeedbackResetAt: newResetAt,
          })
          .where(eq(users.id, userId))
      } else if (guestId) {
        await db!
          .update(guests)
          .set({
            pearFeedbackCount: 0,
            pearFeedbackResetAt: newResetAt,
          })
          .where(eq(guests.id, guestId))
      }

      return {
        allowed: true,
        remaining: PEAR_DAILY_LIMIT - 1,
        resetAt: newResetAt,
      }
    }

    const count = record.pearFeedbackCount || 0
    const remaining = Math.max(0, PEAR_DAILY_LIMIT - count)

    return {
      allowed: count < PEAR_DAILY_LIMIT,
      remaining,
      resetAt: new Date(resetAt),
    }
  } catch (error) {
    console.error("❌ Error checking Pear quota:", error)
    return { allowed: false, remaining: 0, resetAt: null }
  }
}

export async function incrementPearQuota({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}): Promise<void> {
  try {
    if (userId) {
      await db!
        .update(users)
        .set({
          pearFeedbackCount: sql`${users.pearFeedbackCount} + 1`,
          pearFeedbackTotal: sql`${users.pearFeedbackTotal} + 1`,
        })
        .where(eq(users.id, userId))
    } else if (guestId) {
      await db!
        .update(guests)
        .set({
          pearFeedbackCount: sql`${guests.pearFeedbackCount} + 1`,
          pearFeedbackTotal: sql`${guests.pearFeedbackTotal} + 1`,
        })
        .where(eq(guests.id, guestId))
    }

    console.log("🍐 Pear quota incremented:", {
      user: (userId || guestId)?.substring(0, 8),
    })
  } catch (error) {
    console.error("❌ Error incrementing Pear quota:", error)
  }
}

export const createSystemLog = async (systemLog: newSystemLog) => {
  let safeObject = systemLog.object
  if (systemLog.object instanceof Error) {
    safeObject = {
      ...systemLog.object, // include other enumerable properties, if any
      name: systemLog.object.name,
      message: systemLog.object.message,
      stack: systemLog.object.stack,
    }
  }

  try {
    const [inserted] = await db
      .insert(systemLogs)
      .values({
        ...systemLog,
        object: safeObject,
      })
      .returning()

    return inserted
  } catch (error) {
    console.error("Error creating system log:", error)
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

export const getUsers = async ({
  page = 1,
  role,
  search,
  email,
  userName,
  isPublic,
  similarTo,
  ...rest
}: {
  search?: string
  email?: string
  pageSize?: number
  userName?: string
  role?: "user" | "admin"
  isPublic?: boolean
  similarTo?: string
  page?: number
} = {}) => {
  const pageSize = rest.pageSize || 100
  const formattedSearch =
    search && search.length >= 3 ? formatSearchTerm(search) : undefined

  // Create the search condition for full-text search including character profiles
  const searchCondition = formattedSearch
    ? sql`
              (
                setweight(to_tsvector('english', coalesce(${users.name}, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(${users.email}, '')), 'B')
              ) @@ to_tsquery('english', ${sql`${formattedSearch}`}::text)
              OR EXISTS (
                SELECT 1 FROM ${characterProfiles}
                WHERE ${characterProfiles.userId} = ${users.id}
                AND ${characterProfiles.visibility} = 'public'
                AND ${characterProfiles.pinned} = true
                AND (
                  to_tsvector('english', coalesce(${characterProfiles.name}, '')) @@ to_tsquery('english', ${sql`${formattedSearch}`}::text)
                  OR ${characterProfiles.tags}::text ILIKE ${`%${search}%`}
                )
              )
            `
    : undefined

  // Get similarTo character profile for matching
  const similarToProfile = similarTo
    ? await db
        .select()
        .from(characterProfiles)
        .where(eq(characterProfiles.id, similarTo))
        .limit(1)
        .then((profiles) => profiles[0])
    : undefined

  const conditionsArray = [
    role ? eq(users.role, role) : undefined,
    searchCondition ? searchCondition : undefined,
    email ? eq(users.email, email) : undefined,
    userName ? eq(users.userName, userName) : undefined,
    isPublic
      ? sql`${users.characterProfilesEnabled} = true AND EXISTS (
      SELECT 1 FROM ${characterProfiles} 
      WHERE ${characterProfiles.userId} = ${users.id} 
      AND ${characterProfiles.visibility} = 'public' 
      AND ${characterProfiles.pinned} = true
    )`
      : undefined,
  ]

  // Add similarTo matching condition
  if (similarToProfile) {
    // Use OR condition to match either exact name OR tag matches
    const nameMatch = sql`EXISTS (
      SELECT 1 FROM ${characterProfiles}
      WHERE ${characterProfiles.userId} = ${users.id}
      AND ${characterProfiles.visibility} = 'public'
      AND ${characterProfiles.pinned} = true
      AND ${characterProfiles.name} = ${similarToProfile.name}
    )`

    if (similarToProfile.tags?.length) {
      const tagsArray = similarToProfile.tags
      const tagMatch = sql`EXISTS (
        SELECT 1 FROM ${characterProfiles}
        WHERE ${characterProfiles.userId} = ${users.id}
        AND ${characterProfiles.visibility} = 'public'
        AND ${characterProfiles.pinned} = true
        AND (
          ${sql.join(
            tagsArray.map(
              (tag) => sql`${characterProfiles.tags}::jsonb ? ${tag}`,
            ),
            sql` OR `,
          )}
        )
      )`

      conditionsArray.push(sql`(${nameMatch} OR ${tagMatch})`)
    } else {
      conditionsArray.push(nameMatch)
    }
  }

  const conditions = and(...conditionsArray.filter(Boolean))

  const result = await db
    .select()
    .from(users)
    .where(conditions)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(desc(users.createdOn))

  const totalCount =
    (
      await db
        .select({ count: count(users.id) })
        .from(users)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    users: await Promise.all(
      result.map(async (user) => await getUser({ id: user.id })),
    ),
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export const createUser = async (user: newUser) => {
  // Generate API key if not provided
  // const apiKey =
  //   user.apiKey ||
  //   generateApiKey(
  //     process.env.NODE_ENV === "production" ? "production" : "development",
  //   )

  const [inserted] = await db
    .insert(users)
    .values({
      ...user,
      // apiKey,
    })
    .returning()

  // Invalidate user cache
  if (inserted) {
    await invalidateUser(
      inserted.id,
      inserted.email,
      inserted.appleId ?? undefined,
      inserted.fingerprint ?? undefined,
      inserted.userName ?? undefined,
      inserted.apiKey ?? undefined,
    )
  }

  return (inserted ? await getUser({ id: inserted.id }) : undefined) as user
}

export const createVerificationToken = async (token: newVerificationToken) => {
  const [inserted] = await db
    .insert(verificationTokens)
    .values(token)
    .returning()
  return inserted
}

export const updateUser = async (user: Partial<user> & { id: string }) => {
  // Final safety: never save masked keys
  if (user.apiKeys && typeof user.apiKeys === "object") {
    const hasMasked = Object.values(user.apiKeys).some(
      (val) => typeof val === "string" && val.includes("..."),
    )
    if (hasMasked) {
      console.warn(
        "⚠️ updateUser: Attempted to save masked API keys, stripping them for safety.",
      )
      delete user.apiKeys
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      ...user,
      password:
        user.password ??
        (await getUser({ id: user.id }))?.password ??
        undefined,
    })
    .where(eq(users.id, user.id))
    .returning()

  // Invalidate user cache
  if (updated) {
    await invalidateUser(
      updated.id,
      updated.email,
      updated.appleId ?? undefined,
      updated.fingerprint ?? undefined,
      updated.userName ?? undefined,
      updated.apiKey ?? undefined,
    )
  }

  return updated ? await getUser({ id: user.id }) : undefined
}

export const deleteUser = async (id: string) => {
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning()

  // Invalidate user cache
  if (deleted) {
    await invalidateUser(
      deleted.id,
      deleted.email,
      deleted.appleId ?? undefined,
      deleted.fingerprint ?? undefined,
      deleted.userName ?? undefined,
      deleted.apiKey ?? undefined,
    )

    // FalkorDB cleanup (safe - won't crash if fails)
    await deleteFalkorUser(deleted.id)
  }

  return deleted
}

export const createMessage = async (message: newMessage) => {
  // Sanitize empty string UUID fields to null to prevent PostgreSQL errors
  const sanitizedMessage = {
    ...message,
    tribePostId: message.tribePostId === "" ? null : message.tribePostId,
    moltId: message.moltId === "" ? null : message.moltId,
    moltUrl: message.moltUrl === "" ? null : message.moltUrl,
  }

  const [inserted] = await db
    .insert(messages)
    .values(sanitizedMessage)
    .onConflictDoNothing({ target: messages.id }) // Handle duplicate IDs (race conditions)
    .returning()

  const thread = inserted?.threadId
    ? await getThread({ id: inserted.threadId })
    : undefined

  // Auto-increment thread message count for φ-Engine
  if (thread?.id) {
    await updateThread({
      id: thread.id,
      messageCount: (thread.messageCount || 0) + 1,
    }).catch((err) => {
      console.error("Failed to auto-increment thread messageCount:", err)
    })
  }

  // Log credit usage for AI messages (privacy-friendly tracking)
  if (inserted?.agentId && Number(inserted?.creditCost) > 0) {
    // Get agent info for credit calculation
    const agent = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.id, inserted.agentId))
      .limit(1)

    if (agent[0]) {
      const totalCreditCost =
        Number(inserted.creditCost) * Number(agent[0].creditCost)

      await logCreditUsage({
        appId: thread?.appId || undefined,
        userId: inserted.userId || undefined,
        guestId: inserted.guestId || undefined,
        agentId: inserted.agentId,
        creditCost: totalCreditCost,
        messageType: "ai",
        threadId: inserted.threadId || undefined,
        messageId: inserted.id,
        // isWebSearchEnabled: inserted.isWebSearchEnabled || false,
      })
    }
  }

  // Invalidate user/guest cache (credits, lastMessage, character profiles changed)
  if (inserted?.userId) {
    await invalidateUser(inserted.userId)
  }
  if (inserted?.guestId) {
    await invalidateGuest(inserted.guestId)
  }

  return inserted
}

export const updateMessage = async (
  message: Partial<message> & { id: string },
) => {
  const [updated] = await db
    .update(messages)
    .set(message)
    .where(eq(messages.id, message.id))
    .returning()

  return updated
}

export const deleteMessage = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(messages)
    .where(eq(messages.id, id))
    .returning()

  // FalkorDB cleanup (safe - won't crash if fails)
  if (deleted) {
    const { deleteFalkorMessage } = await import("./src/falkorSync")
    await deleteFalkorMessage(deleted.id)
  }

  return deleted
}

export const getInvitations = async ({
  guestId,
  threadId,
}: {
  guestId?: string
  threadId?: string
}) => {
  const result = await db
    .select()
    .from(invitations)
    .where(
      and(
        guestId ? eq(invitations.guestId, guestId) : undefined,
        threadId ? eq(invitations.threadId, threadId) : undefined,
      ),
    )

  return result
}

export const getDocumentChunks = async ({
  guestId,
  threadId,
}: {
  guestId?: string
  threadId?: string
}) => {
  const result = await db
    .select()
    .from(documentChunks)
    .where(
      and(
        guestId ? eq(documentChunks.guestId, guestId) : undefined,
        threadId ? eq(documentChunks.threadId, threadId) : undefined,
      ),
    )

  return result
}

export const updateDocumentChunk = async (documentChunk: documentChunk) => {
  const [updated] = await db
    .update(documentChunks)
    .set(documentChunk)
    .where(eq(documentChunks.id, documentChunk.id))
    .returning()

  return updated
}

export const getDevices = async ({
  guestId,
  userId,
  fingerprint,
  page = 1,
  pageSize = 10,
}: {
  guestId?: string
  userId?: string
  fingerprint?: string
  page?: number
  pageSize?: number
} = {}) => {
  const conditionsArray = [
    guestId ? eq(devices.guestId, guestId) : undefined,
    userId ? eq(devices.userId, userId) : undefined,
    fingerprint ? eq(devices.fingerprint, fingerprint) : undefined,
  ]

  const conditions = and(...conditionsArray.filter(Boolean))

  const result = await db
    .select()
    .from(devices)
    .where(conditions)
    .orderBy(desc(devices.createdOn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(devices.id) })
        .from(devices)
        .where(conditions)
    ).at(0)?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    devices: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export const deleteDevice = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(devices)
    .where(eq(devices.id, id))
    .returning()

  return deleted
}

export const getDevice = async ({
  guestId,
  userId,
  fingerprint,
}: {
  guestId?: string
  userId?: string
  fingerprint?: string
}) => {
  const [result] = await db
    .select()
    .from(devices)
    .where(
      and(
        guestId ? eq(devices.guestId, guestId) : undefined,
        userId ? eq(devices.userId, userId) : undefined,
        fingerprint ? eq(devices.fingerprint, fingerprint) : undefined,
      ),
    )

  return result
}

export const updateDevice = async (device: device) => {
  const [updated] = await db
    .update(devices)
    .set(device)
    .where(eq(devices.id, device.id))
    .returning()

  return updated
}

export const deleteDocumentChunk = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(documentChunks)
    .where(eq(documentChunks.id, id))
    .returning()

  return deleted
}

const _getReactions = async ({
  guestId,
  userId,
}: {
  guestId?: string
  userId?: string
}) => {
  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        isNotNull(messages.reactions),
        guestId
          ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${messages.reactions}) AS elem WHERE elem->>'guestId' = ${guestId})`
          : undefined,
        userId
          ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${messages.reactions}) AS elem WHERE elem->>'userId' = ${userId})`
          : undefined,
      ),
    )

  return result.map((msg) => ({
    id: msg.id,
    reactions: msg.reactions,
  }))
}

const _getBookmarks = async ({
  guestId,
  userId,
}: {
  guestId?: string
  userId?: string
}) => {
  const result = await db
    .select()
    .from(threads)
    .where(
      and(
        isNotNull(threads.bookmarks),
        guestId
          ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${threads.bookmarks}) AS elem WHERE elem->>'guestId' = ${guestId})`
          : undefined,
        userId
          ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${threads.bookmarks}) AS elem WHERE elem->>'userId' = ${userId})`
          : undefined,
      ),
    )

  return result.map((thread) => ({
    id: thread.id,
    bookmarks: thread.bookmarks,
  }))
}

const _updateReactions = async ({
  guestId,
  userId,
  messageId,
}: {
  guestId?: string
  userId?: string
  messageId: string
}) => {
  if (!guestId || !userId) return

  const [updated] = await db
    .update(messages)
    .set({
      reactions: sql`(
        SELECT jsonb_agg(
          CASE 
            WHEN elem->>'guestId' = ${guestId}
            THEN jsonb_set(elem, '{userId}', ${JSON.stringify(userId)}) - 'guestId'
            ELSE elem
          END
        )
        FROM jsonb_array_elements(reactions) AS elem
      )`,
    })
    .where(eq(messages.id, messageId))
    .returning()

  return updated
}

const _updateBookmarks = async ({
  guestId,
  userId,
  threadId,
}: {
  guestId?: string
  userId?: string
  threadId: string
}) => {
  if (!guestId || !userId) return

  const [updated] = await db
    .update(threads)
    .set({
      bookmarks: sql`(
        SELECT jsonb_agg(
          CASE 
            WHEN elem->>'guestId' = ${guestId}
            THEN jsonb_set(elem, '{userId}', ${JSON.stringify(userId)}) - 'guestId'
            ELSE elem
          END
        )
        FROM jsonb_array_elements(bookmarks) AS elem
      )`,
    })
    .where(eq(threads.id, threadId))
    .returning()

  return updated
}

export const updatePushSubscription = async (
  pushSubscription: pushSubscription,
) => {
  const [updated] = await db
    .update(pushSubscriptions)
    .set(pushSubscription)
    .where(eq(pushSubscriptions.id, pushSubscription.id))
    .returning()

  return updated
}

export const deletePushSubscription = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.id, id))
    .returning()

  return deleted
}

export const deleteMessageEmbedding = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(messageEmbeddings)
    .where(eq(messageEmbeddings.id, id))
    .returning()

  return deleted
}

export const getMessageEmbeddings = async ({
  guestId,
  userId,
}: {
  guestId?: string
  userId?: string
}) => {
  const result = await db
    .select()
    .from(messageEmbeddings)
    .where(
      and(
        guestId ? eq(messageEmbeddings.guestId, guestId) : undefined,
        userId ? eq(messageEmbeddings.userId, userId) : undefined,
      ),
    )

  return result
}

export const updateMessageEmbedding = async (
  messageEmbedding: messageEmbedding,
) => {
  const [updated] = await db
    .update(messageEmbeddings)
    .set(messageEmbedding)
    .where(eq(messageEmbeddings.id, messageEmbedding.id))
    .returning()

  return updated
}

export async function migrateUser({
  user,
  guest,
}: {
  user: user
  guest: guest
}) {
  if (!guest || !user) return { success: false, error: "Missing records" }

  // Çift migration'ı önle
  if (guest.migratedToUser || user.migratedFromGuest) {
    return { success: false, error: "Already migrated" }
  }

  const userId = user.id
  const guestId = guest.id

  return await db.transaction(async (tx) => {
    console.log(
      `🚀 Starting high-speed migration: Guest(${guestId}) -> User(${userId})`,
    )

    try {
      const now = new Date()

      // --- BULK UPDATES (High Performance) ---
      // Tek bir SQL sorgusu ile tüm tabloyu güncelliyoruz, döngü yok!

      const guestStoresList = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.guestId, guestId))

      const existingStoresWithSlug = await tx
        .select()
        .from(stores)
        .where(eq(stores.slug, user.userName))
        .limit(1)

      const canUseSlug =
        existingStoresWithSlug.length === 0 && guestStoresList.length > 0

      const [tCount, mCount, memCount] = await Promise.all([
        tx
          .update(threads)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(threads.guestId, guestId))
          .returning({ id: threads.id }),
        tx
          .update(scheduledJobs)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(scheduledJobs.guestId, guestId))
          .returning({ id: scheduledJobs.id }),
        tx
          .update(placeHolders)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(placeHolders.guestId, guestId))
          .returning({ id: placeHolders.id }),
        tx
          .update(tribePosts)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(tribePosts.guestId, guestId))
          .returning({ id: tribePosts.id }),
        tx
          .update(tribeLikes)
          .set({ userId, guestId: null })
          .where(eq(tribeLikes.guestId, guestId))
          .returning({ id: tribeLikes.id }),
        tx
          .update(tribeComments)
          .set({ userId, guestId: null })
          .where(eq(tribeComments.guestId, guestId))
          .returning({ id: tribeComments.id }),
        tx
          .update(messages)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(messages.guestId, guestId))
          .returning({ id: messages.id }),
        tx
          .update(memories)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(memories.guestId, guestId))
          .returning({ id: memories.id }),
        tx
          .update(creditUsages)
          .set({ userId, guestId: null })
          .where(eq(creditUsages.guestId, guestId)),
        tx
          .update(instructions)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(instructions.guestId, guestId)),
        tx
          .update(characterProfiles)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(characterProfiles.guestId, guestId)),
        tx
          .update(calendarEvents)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(calendarEvents.guestId, guestId)),
        tx
          .update(expenses)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(expenses.guestId, guestId)),
        tx
          .update(budgets)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(budgets.guestId, guestId)),
        tx
          .update(tasks)
          .set({ userId, guestId: null })
          .where(eq(tasks.guestId, guestId)),
        tx
          .update(moods)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(moods.guestId, guestId)),
        tx
          .update(stores)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(stores.guestId, guestId)),
        tx
          .update(apps)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(apps.guestId, guestId)),
      ])

      // After bulk ownership update, safely update the slug for only ONE store if available
      if (canUseSlug && guestStoresList[0]) {
        await tx
          .update(stores)
          .set({ slug: user.userName, name: `${user.userName}'s Store` })
          .where(eq(stores.id, guestStoresList[0].id))
      }

      // --- ÖZEL MANTIK: TIMERS ---
      // Kullanıcının hali hazırda bir sayacı yoksa misafirinkini al
      const existingUserTimer = await tx
        .select()
        .from(timers)
        .where(eq(timers.userId, userId))
        .limit(1)
      if (existingUserTimer.length === 0) {
        await tx
          .update(timers)
          .set({ userId, guestId: null, updatedOn: now })
          .where(eq(timers.guestId, guestId))
      }

      // --- ÖZEL MANTIK: CREDITS & SUGGESTIONS ---
      const guestCredits =
        guest.credits > GUEST_CREDITS_PER_MONTH
          ? guest.credits
          : GUEST_CREDITS_PER_MONTH
      const finalCredits =
        guestCredits > user.credits ? guestCredits : user.credits

      const userUpdateData: any = {
        credits: finalCredits,
        migratedFromGuest: true,
        updatedOn: now,
      }

      // Eğer kullanıcıda instruction suggestion yoksa guest'ten taşı
      if (
        !user?.suggestions?.instructions?.length &&
        guest?.suggestions?.instructions?.length
      ) {
        userUpdateData.suggestions = {
          instructions: guest.suggestions.instructions,
        }
      }

      if (!user.characterProfilesEnabled && guest.characterProfilesEnabled) {
        userUpdateData.characterProfilesEnabled = true
      }

      // API Keys migration - only if user has none
      if (!user.apiKeys || Object.keys(user.apiKeys).length === 0) {
        const rawGuest = await tx
          .select({ apiKeys: guests.apiKeys })
          .from(guests)
          .where(eq(guests.id, guestId))

        if (
          rawGuest[0]?.apiKeys &&
          Object.keys(rawGuest[0].apiKeys).length > 0
        ) {
          userUpdateData.apiKeys = rawGuest[0].apiKeys
        }
      }

      await tx.update(users).set(userUpdateData).where(eq(users.id, userId))

      // --- FINAL: GUEST CLEANUP ---
      // Soft-delete mantığı: Kaydı tamamen silmek yerine 'migrated' işaretliyoruz
      // Eğer 'cascade delete' kullanıyorsan tx.delete(guests) diyebilirsin
      await tx
        .update(guests)
        .set({
          credits: 0,
          migratedToUser: true,
          fingerprint: uuidv4(), // Fingerprint'i boşa çıkarıyoruz
          updatedOn: now,
        })
        .where(eq(guests.id, guestId))

      console.log(
        `✅ Migration successful! Threads: ${tCount.length}, Messages: ${mCount.length}, Memories: ${memCount.length}`,
      )

      // Transaction bittiği için cache'leri güvenle temizleyebiliriz
      await Promise.all([invalidateUser(userId), invalidateGuest(guestId)])

      return {
        success: true,
        stats: {
          threads: tCount.length,
          messages: mCount.length,
          memories: memCount.length,
        },
      }
    } catch (error) {
      console.error(
        "❌ CRITICAL: Migration failed, database rolled back.",
        error,
      )
      throw error // Transaction'ı iptal eder
    }
  })
}

export const createAccount = async (account: newAccount) => {
  const [inserted] = await db.insert(accounts).values(account).returning()
  return inserted
}

export const createGuest = async (guest: newGuest) => {
  const [inserted] = await db.insert(guests).values(guest).returning()

  // Invalidate guest cache
  if (inserted) {
    await invalidateGuest(
      inserted.id,
      inserted.fingerprint ?? undefined,
      inserted.ip ?? undefined,
      inserted.email ?? undefined,
    )
  }

  return inserted ? await getGuest({ id: inserted.id }) : undefined
}

export const updateGuest = async (guest: Partial<guest> & { id: string }) => {
  // Final safety: never save masked keys
  if (guest.apiKeys && typeof guest.apiKeys === "object") {
    const hasMasked = Object.values(guest.apiKeys).some(
      (val) => typeof val === "string" && val.includes("..."),
    )
    if (hasMasked) {
      console.warn(
        "⚠️ updateGuest: Attempted to save masked API keys, stripping them for safety.",
      )
      delete guest.apiKeys
    }
  }

  const [updated] = await db
    .update(guests)
    .set(guest)
    .where(eq(guests.id, guest.id))
    .returning()

  // Invalidate guest cache
  if (updated) {
    await invalidateGuest(
      updated.id,
      updated.fingerprint ?? undefined,
      updated.ip ?? undefined,
      updated.email ?? undefined,
    )
  }

  return updated
}

export const deleteGuest = async ({ id }: { id: string }) => {
  const [deleted] = await db.delete(guests).where(eq(guests.id, id)).returning()

  // Invalidate guest cache
  if (deleted) {
    await invalidateGuest(
      deleted.id,
      deleted.fingerprint ?? undefined,
      deleted.ip ?? undefined,
      deleted.email ?? undefined,
    )
  }

  return deleted
}

export const getGuests = async ({
  page = 1,
  ...rest
}: {
  page?: number
  pageSize?: number
} = {}) => {
  const pageSize = rest.pageSize || 100
  const result = await db
    .select()
    .from(guests)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(desc(guests.createdOn))

  const totalCount =
    (await db.select({ count: count(guests.id) }).from(guests))[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    guests: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
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

export const getSubscriptions = async ({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}) => {
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        userId ? eq(subscriptions.userId, userId) : undefined,
        guestId ? eq(subscriptions.guestId, guestId) : undefined,
      ),
    )

  return result
}

export const createSubscription = async (subscription: newSubscription) => {
  const [inserted] = await db
    .insert(subscriptions)
    .values(subscription)
    .returning()
  return inserted
}

export const updateSubscription = async (
  subscription: Partial<subscription> & { id: string },
) => {
  const [updated] = await db
    .update(subscriptions)
    .set(subscription)
    .where(eq(subscriptions.id, subscription.id))
    .returning()

  return updated
}

export const deleteSubscription = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(subscriptions)
    .where(eq(subscriptions.id, id))
    .returning()

  return deleted
}

export const createDevice = async (device: newDevice) => {
  const [inserted] = await db.insert(devices).values(device).returning()
  return inserted
}

export async function upsertDevice(deviceData: newDevice) {
  const { fingerprint, guestId, ...updateData } = deviceData

  const device = await getDevice({ fingerprint })

  if (device) {
    const updated = await updateDevice({
      ...device,
      ...updateData,
    })
    return updated
  }

  return await createDevice(deviceData)
}

export const createThread = async (thread: newThread) => {
  const [inserted] = await db.insert(threads).values(thread).returning()
  return inserted
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

export const updateCharacterProfile = async (
  characterProfile: characterProfile,
) => {
  const [updated] = await db
    .update(characterProfiles)
    .set(characterProfile)
    .where(eq(characterProfiles.id, characterProfile.id))
    .returning()

  return updated
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

export const hasThreadNotifications = async ({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}) => {
  if (!userId && !guestId) return false

  // Get user/guest to check their activeOn timestamp
  const user = userId ? await getUser({ id: userId }) : undefined
  const guest = guestId ? await getGuest({ id: guestId }) : undefined

  if (!user && !guest) return false

  const activeOn = user?.activeOn || guest?.activeOn

  // If no activeOn timestamp, consider all threads as having notifications
  if (!activeOn) return true

  // Convert to Date object if it's a string (from cached data)
  const activeOnDate = activeOn instanceof Date ? activeOn : new Date(activeOn)

  // Check for threads owned by user/guest with new messages
  const ownedThreadsWithNotifications = await db
    .select({ id: threads.id })
    .from(threads)
    .innerJoin(messages, eq(threads.id, messages.threadId))
    .where(
      and(
        userId ? eq(threads.userId, userId) : eq(threads.guestId, guestId!),
        gt(messages.createdOn, activeOnDate),
      ),
    )
    .limit(1)

  if (ownedThreadsWithNotifications.length > 0) return true

  // Check for collaboration threads with new messages (only for users, not guests)
  if (userId) {
    const collaborationThreadsWithNotifications = await db
      .select({ threadId: collaborations.threadId })
      .from(collaborations)
      .innerJoin(threads, eq(collaborations.threadId, threads.id))
      .innerJoin(messages, eq(threads.id, messages.threadId))
      .where(
        and(
          eq(collaborations.userId, userId),
          inArray(collaborations.status, ["active", "pending"]),
          // Message is newer than collaboration activeOn
          gt(messages.createdOn, collaborations.activeOn),
        ),
      )
      .limit(1)

    if (collaborationThreadsWithNotifications.length > 0) return true
  }

  return false
}

export const updateThread = async (
  thread: Partial<thread> & { id: string },
) => {
  const [updated] = await db
    .update(threads)
    .set(thread)
    .where(eq(threads.id, thread.id))
    .returning()

  return updated ? getThread({ id: updated.id }) : undefined
}

export const deleteThread = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(threads)
    .where(eq(threads.id, id))
    .returning()

  // FalkorDB cleanup (safe - won't crash if fails)
  if (deleted) {
    const { deleteFalkorThread } = await import("./src/falkorSync")
    await deleteFalkorThread(deleted.id)
  }

  return deleted
}

export const updateAiAgent = async (
  data: Partial<aiAgent> & { id: string },
) => {
  const [updated] = await db
    .update(aiAgents)
    .set(data)
    .where(eq(aiAgents.id, data.id))
    .returning()

  return updated
}

export const createAiAgent = async (agent: newAiAgent) => {
  const existing = await getAiAgent({ name: agent.name })
  if (existing) {
    console.log("🍣 Updating agent:", agent.name)
    // Merge new data with existing, keeping the id
    return updateAiAgent({ ...existing, ...agent })
  }

  const [inserted] = await db.insert(aiAgents).values(agent).returning()
  return inserted
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
  forApp?: app
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

export const getAiAgent = async ({
  id,
  name,
}: {
  id?: string
  name?: string
}) => {
  const [result] = await db
    .select()
    .from(aiAgents)
    .where(
      and(
        id ? eq(aiAgents.id, id) : undefined,
        name ? eq(aiAgents.name, name) : undefined,
      ),
    )
    .limit(1)
  return result
}

export const createCollaboration = async (collaboration: newCollaboration) => {
  const [inserted] = await db
    .insert(collaborations)
    .values(collaboration)
    .returning()
  return inserted
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

export const deleteCollaboration = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(collaborations)
    .where(eq(collaborations.id, id))
    .returning()

  return deleted
}

export const getCreditUsage = async ({
  userId,
  guestId,
  fromDate,
}: {
  userId?: string
  guestId?: string
  fromDate?: Date
}) => {
  const result = await db
    .select()
    .from(creditUsages)
    .where(
      and(
        userId ? eq(creditUsages.userId, userId) : undefined,
        guestId ? eq(creditUsages.guestId, guestId) : undefined,
        fromDate ? gte(creditUsages.createdOn, fromDate) : undefined,
      ),
    )
    .orderBy(desc(creditUsages.createdOn))

  return result
}

export const updateCreditUsage = async (data: creditUsage) => {
  const [updated] = await db
    .update(creditUsages)
    .set(data)
    .where(eq(creditUsages.id, data.id))
    .returning()

  return updated
}

export const deleteCreditUsage = async ({
  id,
  guestId,
  userId,
}: {
  id?: string
  guestId?: string
  userId?: string
}) => {
  if (!id && !guestId && !userId) {
    throw new Error("Missing id or guestId or userId")
  }
  const [deleted] = await db
    .delete(creditUsages)
    .where(
      and(
        id ? eq(creditUsages.id, id) : undefined,
        guestId ? eq(creditUsages.guestId, guestId) : undefined,
        userId ? eq(creditUsages.userId, userId) : undefined,
      ),
    )
    .returning()

  return deleted
}

export async function createPushSubscription({
  userId,
  subscription,
  guestId,
}: {
  userId?: string
  subscription: NewCustomPushSubscription
  guestId?: string
}) {
  const [result] = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      guestId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .returning()

  return result
    ? await getPushSubscription({
        id: result.id,
      })
    : undefined
}

export async function getPushSubscription({
  id,
  userId,
  endpoint,
  guestId,
}: {
  id?: string
  userId?: string
  endpoint?: string
  guestId?: string
}): Promise<CustomPushSubscription | undefined> {
  try {
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          guestId ? eq(pushSubscriptions.guestId, guestId) : undefined,
          id ? eq(pushSubscriptions.id, id) : undefined,
          userId ? eq(pushSubscriptions.userId, userId) : undefined,
          endpoint ? eq(pushSubscriptions.endpoint, endpoint) : undefined,
        ),
      )
      .orderBy(desc(pushSubscriptions.createdOn))
      .limit(1)

    if (!subscription) {
      return
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      id: subscription.id,
      createdOn: subscription.createdOn,
      updatedOn: subscription.updatedOn,
    }
  } catch (error) {
    console.error("Error retrieving push subscription:", error)
    return
  }
}

export async function getPushSubscriptions({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}): Promise<CustomPushSubscription[]> {
  const result = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        userId ? eq(pushSubscriptions.userId, userId) : undefined,
        guestId ? eq(pushSubscriptions.guestId, guestId) : undefined,
      ),
    )
    .orderBy(desc(pushSubscriptions.createdOn))

  return result.map((subscription) => {
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      id: subscription.id,
      createdOn: subscription.createdOn,
      updatedOn: subscription.updatedOn,
    }
  })
}

export async function createInvitation(invitation: newInvitation) {
  const [inserted] = await db.insert(invitations).values(invitation).returning()

  return inserted
}

export async function getInvitation({
  email,
  threadId,
}: {
  email: string
  threadId?: string
}) {
  const [result] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.email, email),
        threadId ? eq(invitations.threadId, threadId) : undefined,
      ),
    )
    .innerJoin(threads, eq(invitations.threadId, threads.id))
    .limit(1)
  return result?.invitations
}

export async function updateInvitation(invitation: invitation) {
  const [updated] = await db
    .update(invitations)
    .set(invitation)
    .where(eq(invitations.id, invitation.id))
    .returning()

  return updated
}

export async function deleteInvitation({ id }: { id: string }) {
  const [deleted] = await db
    .delete(invitations)
    .where(eq(invitations.id, id))
    .returning()

  return deleted
}

export async function createCharacterTag(characterTag: newCharacterProfile) {
  const thread = characterTag.threadId
    ? await getThread({
        id: characterTag.threadId,
      })
    : null

  const app = characterTag.appId
    ? await getApp({
        id: characterTag.appId,
      })
    : null

  const [inserted] = await db
    .insert(characterProfiles)
    .values({
      ...characterTag,
      isAppOwner: !!(
        app &&
        thread &&
        isOwner(app, {
          userId: thread.userId,
          guestId: thread.guestId,
        })
      ),
    })
    .returning()

  return inserted
}

export async function updateCharacterTag(characterTag: characterProfile) {
  const [updated] = await db
    .update(characterProfiles)
    .set(characterTag)
    .where(eq(characterProfiles.id, characterTag.id))
    .returning()

  return updated
}

export async function deleteCharacterTag({ id }: { id: string }) {
  const [deleted] = await db
    .delete(characterProfiles)
    .where(eq(characterProfiles.id, id))
    .returning()

  return deleted
}

export async function getCharacterTags({
  agentId,
  userId,
  guestId,
  threadId,
  appId,
  id,
}: {
  agentId?: string
  userId?: string
  guestId?: string
  threadId?: string
  appId?: string
  id?: string
}) {
  const result = await db
    .select()
    .from(characterProfiles)
    .where(
      and(
        id ? eq(characterProfiles.id, id) : undefined,
        threadId ? eq(characterProfiles.threadId, threadId) : undefined,
        agentId ? eq(characterProfiles.agentId, agentId) : undefined,
        userId ? eq(characterProfiles.userId, userId) : undefined,
        guestId ? eq(characterProfiles.guestId, guestId) : undefined,
        appId ? eq(characterProfiles.appId, appId) : undefined,
      ),
    )
  return result
}

export async function getCharacterTag({
  id,
  agentId,
  userId,
  guestId,
  threadId,
  appId,
}: {
  id?: string
  agentId?: string
  userId?: string
  guestId?: string
  threadId?: string
  appId?: string
}) {
  const [result] = await getCharacterTags({
    agentId,
    userId,
    appId,
    guestId,
    threadId,
    id,
  })
  return result
}
export async function createMemory(memory: newMemory) {
  const [inserted] = await db.insert(memories).values(memory).returning()

  return inserted
}

export async function getMemory({
  id,
  userId,
  guestId,
}: {
  id?: string
  userId?: string
  guestId?: string
}) {
  const [result] = await db
    .select()
    .from(memories)
    .where(
      and(
        id ? eq(memories.id, id) : undefined,
        userId ? eq(memories.userId, userId) : undefined,
        guestId ? eq(memories.guestId, guestId) : undefined,
      ),
    )
  return result
}
export async function updateMemory(memory: memory) {
  const [updated] = await db
    .update(memories)
    .set(memory)
    .where(eq(memories.id, memory.id))
    .returning()

  return updated
}
export async function deleteMemory({ id }: { id: string }) {
  const [deleted] = await db
    .delete(memories)
    .where(eq(memories.id, id))
    .returning()

  return deleted
}

// Reinforce a memory after it's recalled (spaced repetition)
export async function reinforceMemory(
  memoryId: string,
  contextCategory?: string,
) {
  await db
    .update(memories)
    .set({
      usageCount: sql`${memories.usageCount} + 1`,
      importance: sql`${memories.importance} + 
        CASE 
          WHEN ${contextCategory ? sql`${memories.category} = ${contextCategory}` : sql`false`} THEN 0.2 
          ELSE 0.05 
        END`,
      lastUsedAt: new Date(),
    })
    .where(eq(memories.id, memoryId))
}

// Apply decay periodically (e.g. via cron job or background task)
export async function decayMemories() {
  await db.execute(sql`
    UPDATE memories
    SET importance = importance * 
      CASE 
        WHEN "lastUsedAt" > NOW() - INTERVAL '7 days' THEN 1.0
        WHEN "lastUsedAt" > NOW() - INTERVAL '30 days' THEN 0.9
        WHEN "lastUsedAt" > NOW() - INTERVAL '90 days' THEN 0.8
        ELSE 0.6
      END
  `)
}

// Clean up old incognito threads (privacy + database optimization)
export async function cleanupIncognitoThreads(retentionDays = 30) {
  const result = await db.execute(sql`
    DELETE FROM threads
    WHERE "isIncognito" = true
    AND "createdOn" < NOW() - (${retentionDays || 0} * INTERVAL '1 day')
    RETURNING id
  `)

  return result.length
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

export const updateAccount = async (account: account) => {
  const [updated] = await db
    .update(accounts)
    .set(account)
    .where(
      and(
        eq(accounts.provider, account.provider),
        eq(accounts.providerAccountId, account.providerAccountId),
      ),
    )
    .returning()

  return updated
}

export async function createThreadSummary(threadSummary: newThreadSummary) {
  const [inserted] = await db
    .insert(threadSummaries)
    .values(threadSummary)
    .returning()

  return inserted
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

export const getThreadSummaries = async ({
  guestId,
  userId,
  threadId,
  pageSize = 500,
  page = 1,
  hasMemories = false,
}: {
  guestId?: string
  userId?: string
  threadId?: string
  pageSize?: number
  page?: number
  hasMemories?: boolean
}): Promise<{
  threadSummaries: threadSummary[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> => {
  const conditions = []

  if (userId) {
    conditions.push(eq(threadSummaries.userId, userId))
  }

  if (guestId) {
    conditions.push(eq(threadSummaries.guestId, guestId))
  }

  if (threadId) {
    conditions.push(eq(threadSummaries.threadId, threadId))
  }

  if (hasMemories) {
    conditions.push(
      exists(
        db
          .select()
          .from(memories)
          .where(eq(memories.sourceThreadId, threadSummaries.threadId)),
      ),
    )
  }

  const result = await db
    .select()
    .from(threadSummaries)
    .where(and(...conditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(desc(threadSummaries.createdOn))

  const totalCount =
    (
      await db
        .select({ count: count(threadSummaries.id) })
        .from(threadSummaries)
        .where(and(...conditions))
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null
  return {
    threadSummaries: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export async function updateThreadSummary(threadSummary: threadSummary) {
  const [updated] = await db
    .update(threadSummaries)
    .set(threadSummary)
    .where(eq(threadSummaries.id, threadSummary.id))
    .returning()

  return updated
}
export async function deleteThreadSummary({ id }: { id: string }) {
  const [deleted] = await db
    .delete(threadSummaries)
    .where(eq(threadSummaries.id, id))
    .returning()

  return deleted
}

export async function createCreditTransaction(
  creditTransaction: newCreditTransaction,
) {
  const [inserted] = await db
    .insert(creditTransactions)
    .values(creditTransaction)
    .returning()

  return inserted
}

export async function updateCreditTransaction(
  creditTransaction: creditTransaction,
) {
  const [updated] = await db
    .update(creditTransactions)
    .set(creditTransaction)
    .where(eq(creditTransactions.id, creditTransaction.id))
    .returning()

  return updated
}
export async function deleteCreditTransaction({ id }: { id: string }) {
  const [deleted] = await db
    .delete(creditTransactions)
    .where(eq(creditTransactions.id, id))
    .returning()

  return deleted
}

export async function getCreditTransactions({
  id,
  userId,
  guestId,
  fromDate,
  sessionId,
  toDate,
  scheduleId,
  type,
}: {
  id?: string
  userId?: string
  guestId?: string
  fromDate?: Date
  toDate?: Date
  type?: "purchase" | "subscription" | "tribe" | "molt"
  sessionId?: string
  scheduleId?: string
}) {
  const result = await db
    .select()
    .from(creditTransactions)
    .where(
      and(
        id ? eq(creditTransactions.id, id) : undefined,
        userId ? eq(creditTransactions.userId, userId) : undefined,
        guestId ? eq(creditTransactions.guestId, guestId) : undefined,
        fromDate ? gte(creditTransactions.createdOn, fromDate) : undefined,
        toDate ? lte(creditTransactions.createdOn, toDate) : undefined,
        type ? eq(creditTransactions.type, type) : undefined,
        sessionId ? eq(creditTransactions.sessionId, sessionId) : undefined,
        scheduleId ? eq(creditTransactions.scheduleId, scheduleId) : undefined,
      ),
    )
    .orderBy(desc(creditTransactions.createdOn))
  return result
}

export async function getCreditTransaction({
  id,
  userId,
  guestId,
  fromDate,
  sessionId,
  toDate,
  scheduleId,
  type,
}: {
  id?: string
  userId?: string
  guestId?: string
  fromDate?: Date
  toDate?: Date
  type?: "purchase" | "subscription" | "tribe" | "molt"
  sessionId?: string
  scheduleId?: string
}) {
  const result = await getCreditTransactions({
    id,
    userId,
    guestId,
    fromDate,
    sessionId,
    toDate,
    scheduleId,
    type,
  })
  return result?.[0]
}

export async function createCalendarEvent(calendarEvent: newCalendarEvent) {
  const [inserted] = await db
    .insert(calendarEvents)
    .values(calendarEvent)
    .returning()

  return inserted
}

export async function updateCalendarEvent(
  calendarEvent: Partial<calendarEvent> & { id: string },
) {
  const [updated] = await db
    .update(calendarEvents)
    .set(calendarEvent)
    .where(eq(calendarEvents.id, calendarEvent.id))
    .returning()

  return updated
}

export async function deleteCalendarEvent({ id }: { id: string }) {
  const [deleted] = await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .returning()

  return deleted
}

export async function getCalendarEvents({
  id,
  userId,
  guestId,
  startTime,
  endTime,
  status,
}: {
  id?: string
  userId?: string
  guestId?: string
  startTime?: Date
  endTime?: Date
  status?: "confirmed" | "tentative" | "canceled"
}): Promise<calendarEvent[]> {
  const result = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        status ? eq(calendarEvents.status, status) : undefined,
        id ? eq(calendarEvents.id, id) : undefined,
        userId ? eq(calendarEvents.userId, userId) : undefined,
        guestId ? eq(calendarEvents.guestId, guestId) : undefined,
        startTime ? gte(calendarEvents.startTime, startTime) : undefined,
        endTime ? lte(calendarEvents.endTime, endTime) : undefined,
      ),
    )
    .orderBy(desc(calendarEvents.startTime))
  return result
}

export async function getCalendarEvent({
  id,
  userId,
  guestId,
}: {
  id: string
  userId?: string
  guestId?: string
}) {
  const [result] = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        id ? eq(calendarEvents.id, id) : undefined,
        userId ? eq(calendarEvents.userId, userId) : undefined,
        guestId ? eq(calendarEvents.guestId, guestId) : undefined,
      ),
    )
  return result
}

export const getCities = async ({
  name,
  country,
  pageSize = 30,
  page = 1,
  ...rest
}: {
  name?: string
  country?: string
  search?: string
  pageSize?: number
  page?: number
}) => {
  const search =
    rest.search?.length && rest.search.length >= 3 ? rest.search : undefined

  function sanitizeSearchTerm(search: string): string {
    return search.replace(/[^a-zA-Z0-9\s]/g, "")
  }

  function formatSearchTerm(search: string): string {
    return sanitizeSearchTerm(search)
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(" & ")
  }

  const formattedSearch = search ? formatSearchTerm(search) : undefined

  const matchQuery = search
    ? sql`
    (
      setweight(to_tsvector('english', coalesce(${cities.name}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${cities.country}, '')), 'B')
    ) @@ to_tsquery('english', ${sql`${formattedSearch}`}::text)
  `
    : undefined

  const rankQuery = search
    ? sql`
      ts_rank(
        setweight(to_tsvector('english', coalesce(${cities.name}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${cities.country}, '')), 'B'),
        to_tsquery('english', ${sql`${formattedSearch}`}::text)
      )
    `
    : undefined

  // Create base ordering array with required items
  const orderBy = [
    sql`
      CASE
        WHEN ${cities.name} ~ '^[a-zA-Z]+$' THEN 0
        ELSE 1
      END
    `,
    desc(cities.population), // Order by population DESC after other criteria
    cities.name,
  ]

  // Add priority ordering for name and country matches
  if (name || country) {
    orderBy.unshift(
      sql`
        CASE 
          WHEN ${
            name && country
              ? sql`LOWER(${cities.name}) = LOWER(${name}) AND LOWER(${cities.country}) = LOWER(${country})`
              : name
                ? sql`LOWER(${cities.name}) = LOWER(${name})`
                : sql`LOWER(${cities.country}) = LOWER(${country})`
          } THEN 0
          WHEN ${name && country ? sql`LOWER(${cities.name}) = LOWER(${name})` : sql`FALSE`} THEN 1
          ELSE 2
        END
      `,
    )
  }

  // Add rank ordering if search is provided
  if (rankQuery) {
    orderBy.unshift(desc(rankQuery))
  }

  const whereConditions = [
    matchQuery,
    name ? ilike(cities.name, `%${name}%`) : undefined,
    !matchQuery && country ? eq(cities.country, country) : undefined,
  ].filter(
    (condition): condition is typeof condition => condition !== undefined,
  )

  return db
    .select()
    .from(cities)
    .orderBy(...orderBy)
    .where(or(...whereConditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
}

export const getAffiliateLinks = async ({ userId }: { userId: string }) => {
  return db
    .select()
    .from(affiliateLinks)
    .where(eq(affiliateLinks.userId, userId))
}

export const getAffiliateReferrals = async ({
  affiliateLinkId,
  page = 1,
  pageSize = 30,
  status,
}: {
  affiliateLinkId: string
  page?: number
  pageSize?: number
  status?: "pending" | "converted" | "paid"
}) => {
  const whereConditions = [
    eq(affiliateReferrals.affiliateLinkId, affiliateLinkId),
    status ? eq(affiliateReferrals.status, status) : undefined,
  ]
  const result = await db
    .select()
    .from(affiliateReferrals)
    .where(and(...whereConditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(affiliateReferrals.id) })
        .from(affiliateReferrals)
        .where(and(...whereConditions))
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return { result, totalCount, nextPage }
}

export const getAffiliatePayouts = async ({
  affiliateLinkId,
  status,
  page = 1,
  pageSize = 30,
}: {
  affiliateLinkId: string
  status?: ("pending" | "processing" | "completed" | "failed")[]
  page?: number
  pageSize?: number
}) => {
  const whereConditions = [
    eq(affiliatePayouts.affiliateLinkId, affiliateLinkId),
    status?.length ? inArray(affiliatePayouts.status, status) : undefined,
  ]
  const result = await db
    .select()
    .from(affiliatePayouts)
    .where(and(...whereConditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(affiliatePayouts.id) })
        .from(affiliatePayouts)
        .where(and(...whereConditions))
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return { result, totalCount, nextPage }
}

export const getAffiliateLink = async ({
  id,
  code,
  userId,
}: {
  id?: string
  code?: string
  userId?: string
}) => {
  if (!id && !code && !userId) {
    throw new Error("Missing id or code")
  }

  const [result] = await db
    .select()
    .from(affiliateLinks)
    .where(
      and(
        userId ? eq(affiliateLinks.userId, userId) : undefined,
        id ? eq(affiliateLinks.id, id) : undefined,
        code ? eq(affiliateLinks.code, code) : undefined,
      ),
    )

  return result
}

export const getAffiliateReferral = async ({
  id,
  affiliateLinkId,
}: {
  id?: string
  affiliateLinkId?: string
}) => {
  if (!id && !affiliateLinkId) {
    throw new Error("Missing id or affiliateLinkId")
  }

  const [result] = await db
    .select()
    .from(affiliateReferrals)
    .where(
      and(
        id ? eq(affiliateReferrals.id, id) : undefined,
        affiliateLinkId
          ? eq(affiliateReferrals.affiliateLinkId, affiliateLinkId)
          : undefined,
      ),
    )

  return result
}

export const getAffiliatePayout = async ({ id }: { id: string }) => {
  const [result] = await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, id))

  return result
}

export const createAffiliateLink = async (affiliateLink: newAffiliateLink) => {
  const [inserted] = await db
    .insert(affiliateLinks)
    .values(affiliateLink)
    .returning()

  return inserted
}

export const createAffiliateReferral = async (
  affiliateReferral: newAffiliateReferral,
) => {
  const [inserted] = await db
    .insert(affiliateReferrals)
    .values(affiliateReferral)
    .returning()

  return inserted
}

export const createAffiliatePayout = async (
  affiliatePayout: newAffiliatePayout,
) => {
  const [inserted] = await db
    .insert(affiliatePayouts)
    .values(affiliatePayout)
    .returning()

  return inserted
}

export const updateAffiliateLink = async (affiliateLink: affiliateLink) => {
  const [updated] = await db
    .update(affiliateLinks)
    .set(affiliateLink)
    .where(eq(affiliateLinks.id, affiliateLink.id))
    .returning()

  return updated
}

export const updateAffiliateReferral = async (
  affiliateReferral: affiliateReferral,
) => {
  const [updated] = await db
    .update(affiliateReferrals)
    .set(affiliateReferral)
    .where(eq(affiliateReferrals.id, affiliateReferral.id))
    .returning()

  return updated
}

export const createAffiliateClick = async (
  affiliateClick: newAffiliateClicks,
) => {
  const [inserted] = await db
    .insert(affiliateClicks)
    .values(affiliateClick)
    .returning()

  return inserted
}

export const getAffiliateClick = async ({
  affiliateLinkId,
  userId,
  guestId,
}: {
  affiliateLinkId: string
  userId?: string | null
  guestId?: string | null
}) => {
  const [result] = await db
    .select()
    .from(affiliateClicks)
    .where(
      and(
        affiliateLinkId
          ? eq(affiliateClicks.affiliateLinkId, affiliateLinkId)
          : undefined,
        userId ? eq(affiliateClicks.userId, userId) : undefined,
        guestId ? eq(affiliateClicks.guestId, guestId) : undefined,
      ),
    )
    .limit(1)

  return result
}

export const getAffiliateClicks = async ({
  affiliateLinkId,
  userId,
  guestId,
}: {
  affiliateLinkId?: string
  userId?: string | null
  guestId?: string | null
}) => {
  const result = await db
    .select()
    .from(affiliateClicks)
    .where(
      and(
        affiliateLinkId
          ? eq(affiliateClicks.affiliateLinkId, affiliateLinkId)
          : undefined,
        userId ? eq(affiliateClicks.userId, userId) : undefined,
        guestId ? eq(affiliateClicks.guestId, guestId) : undefined,
      ),
    )

  return result
}

export const updateAffiliateClick = async (affiliateClick: affiliateClick) => {
  const [updated] = await db
    .update(affiliateClicks)
    .set(affiliateClick)
    .where(eq(affiliateClicks.id, affiliateClick.id))
    .returning()

  return updated
}

export const updateAffiliatePayout = async (
  affiliatePayout: affiliatePayout,
) => {
  const [updated] = await db
    .update(affiliatePayouts)
    .set(affiliatePayout)
    .where(eq(affiliatePayouts.id, affiliatePayout.id))
    .returning()

  return updated
}

export const deleteAffiliateLink = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(affiliateLinks)
    .where(eq(affiliateLinks.id, id))
    .returning()

  return deleted
}

export const deleteAffiliateReferral = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(affiliateReferrals)
    .where(eq(affiliateReferrals.id, id))
    .returning()

  return deleted
}

export const deleteAffiliatePayout = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(affiliatePayouts)
    .where(eq(affiliatePayouts.id, id))
    .returning()

  return deleted
}

export const createPlaceHolder = async (placeHolder: newPlaceHolder) => {
  // Validate that guestId exists if provided (prevent foreign key violations)
  if (placeHolder.guestId) {
    const guestExists = await db
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.id, placeHolder.guestId))
      .limit(1)

    if (guestExists.length === 0) {
      console.warn(
        `⚠️ Skipping placeholder creation - guest ${placeHolder.guestId} does not exist (may have been migrated to user)`,
      )
      return undefined
    }
  }

  const [inserted] = await db
    .insert(placeHolders)
    .values(placeHolder)
    .returning()

  return inserted
}

export const updatePlaceHolder = async (placeHolder: placeHolder) => {
  const [updated] = await db
    .update(placeHolders)
    .set(placeHolder)
    .where(eq(placeHolders.id, placeHolder.id))
    .returning()

  return updated
}

export const deletePlaceHolder = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(placeHolders)
    .where(eq(placeHolders.id, id))
    .returning()

  return deleted
}

export const createApp = async (app: newApp) => {
  const [inserted] = await db.insert(apps).values(app).returning()

  // Invalidate cache for ALL stores that have this app
  if (inserted?.id) {
    const stores = await getStores({
      appId: inserted.id,
    })

    // Invalidate each store's cache
    await Promise.all(
      stores.stores.map((store) =>
        invalidateStore(store.store.id, store.store.slug),
      ),
    )
  }

  return inserted
}

export const createPureApp = async (app: newApp) => {
  const [inserted] = await db.insert(apps).values(app).returning()

  return inserted
    ? await getApp({
        id: inserted.id,
        userId: app.userId || undefined,
        guestId: app.guestId || undefined,
        isSafe: false,
      })
    : undefined
}

export const updatePureApp = async (app: app) => {
  const [updated] = await db
    .update(apps)
    .set(app)
    .where(eq(apps.id, app.id))
    .returning()

  return updated
    ? await getApp({
        id: updated.id,
        userId: app.userId || undefined,
        guestId: app.guestId || undefined,
        isSafe: false,
      })
    : undefined
}

export const updateApp = async (app: Partial<app> & { id: string }) => {
  const [updated] = await db
    .update(apps)
    .set(app)
    .where(eq(apps.id, app.id))
    .returning()

  if (updated) {
    // Invalidate app cache
    await invalidateApp(updated.id, updated.slug)
  }

  return updated
    ? await getApp({
        id: updated.id,
        userId: app.userId || undefined,
        guestId: app.guestId || undefined,
        isSafe: false,
      })
    : undefined
}

export const createOrUpdateApp = async ({
  app,
  extends: extendsList,
}: {
  app: newApp
  extends?: string[]
}) => {
  const existingApp = app.id
    ? await getApp({ id: app.id })
    : app.slug && app.storeId
      ? await getApp({
          slug: app.slug,
          storeId: app.storeId,
          userId: app.userId || undefined,
        })
      : null

  let result: app | undefined

  if (existingApp) {
    // Update existing app
    const [updated] = await db
      .update(apps)
      .set({
        ...app,
      })
      .where(eq(apps.id, existingApp.id))
      .returning()

    result = updated
      ? await getApp({
          id: updated.id,
          isSafe: false,
        })
      : undefined
  } else {
    // Create new app
    const [inserted] = await db
      .insert(apps)
      .values({
        ...app,
      })
      .returning()
    result = inserted
      ? await getApp({
          id: inserted.id,
          isSafe: false,
        })
      : undefined
  }
  if (!result) {
    return
  }

  // Invalidate app cache
  await invalidateApp(result.id, result.slug)
  // Handle extends relationships
  if (extendsList && extendsList.length > 0) {
    // Delete existing extends relationships
    await db.delete(appExtends).where(eq(appExtends.appId, result.id))

    // Insert new extends relationships
    const extendsData = extendsList.map((toId) => ({
      appId: result!.id,
      toId,
    }))

    await db.insert(appExtends).values(extendsData)
    console.log(`✅ Created ${extendsData.length} extends relationships`)

    // Install extended apps to store if storeId is present
    if (result.storeId) {
      for (const toId of extendsList) {
        await createOrUpdateStoreInstall({
          storeId: result.storeId,
          appId: toId,
        })
      }
    }
  }

  return result
}

export const createOrUpdateStoreInstall = async (
  data: storeInstall | newStoreInstall,
) => {
  const existingInstall = await getStoreInstall({
    storeId: data.storeId,
    appId: data.appId,
  })

  if (existingInstall) {
    return updateStoreInstall({
      ...existingInstall,
      ...data,
    })
  }

  const [inserted] = await db.insert(storeInstalls).values(data).returning()

  return inserted
}

export const deleteApp = async ({ id }: { id: string }) => {
  const [deleted] = await db.delete(apps).where(eq(apps.id, id)).returning()

  // Invalidate app cache
  if (deleted) {
    await invalidateApp(deleted.id, deleted.slug)

    // FalkorDB cleanup (safe - won't crash if fails)
    const { deleteFalkorApp } = await import("./src/falkorSync")
    await deleteFalkorApp(deleted.id)
  }

  return deleted
}

export const updateInstallOrder = async ({
  appId,
  userId,
  guestId,
  order,
}: {
  appId: string
  userId?: string
  guestId?: string
  order: number
}) => {
  const conditions = [eq(installs.appId, appId)]

  if (userId) {
    conditions.push(eq(installs.userId, userId))
  }

  if (guestId) {
    conditions.push(eq(installs.guestId, guestId))
  }

  const [updated] = await db
    .update(installs)
    .set({ order })
    .where(and(...conditions))
    .returning()

  return updated
}

/**
 * Predefined knowledge bases for branded agents
 *
 * For demo purposes, we hardcode the brand knowledge here.
 * In production, this would be uploaded documents processed through RAG.
 */
const BRAND_KNOWLEDGE_BASES: Record<string, string> = {
  cnn: `
# CNN Editorial Guidelines & Knowledge Base

## Editorial Standards
- **Accuracy First**: Every fact must be verified through multiple sources
- **Source Attribution**: Always cite sources clearly and prominently
- **Balanced Reporting**: Present multiple perspectives on controversial topics
- **Fact-Checking**: All claims must be fact-checked before publication
- **Corrections**: Errors must be corrected promptly and transparently

## CNN Writing Style
- **Clear Headlines**: Use active voice, present tense when possible
- **Inverted Pyramid**: Most important information first
- **Concise Language**: Avoid jargon, explain complex topics simply
- **Active Voice**: Prefer active over passive voice
- **Attribution**: "according to CNN" or "CNN reports"

## CNN's Mission
Founded in 1980, CNN pioneered 24-hour television news coverage. Our mission is to inform, 
engage and empower the world through trusted, award-winning journalism.

## Coverage Areas
- Breaking News & Live Events
- Politics & Government
- Business & Economy
- Technology & Innovation
- Health & Wellness
- Entertainment & Culture
- World News

## How to Cite CNN
- "According to CNN..."
- "CNN reports that..."
- "A CNN investigation found..."
- Always link to original CNN articles when referencing them
`,

  bloomberg: `
# Bloomberg Terminal & Financial Knowledge Base

## Bloomberg's Mission
Bloomberg delivers business and financial information, news and insight around the world.
Founded by Michael Bloomberg in 1981, we are the global leader in business and financial data.

## Financial Terminology
- **Bull Market**: Market condition where prices are rising
- **Bear Market**: Market condition where prices are falling
- **IPO**: Initial Public Offering - when a company goes public
- **Market Cap**: Total market value of a company's outstanding shares
- **P/E Ratio**: Price-to-Earnings ratio - valuation metric
- **Dividend Yield**: Annual dividend per share divided by stock price
- **Blue Chip**: Stock of a well-established, financially sound company

## Market Analysis Approach
1. **Data-Driven**: Base analysis on Bloomberg Terminal data
2. **Real-Time**: Focus on current market conditions
3. **Global Perspective**: Consider international markets
4. **Risk Assessment**: Always mention potential risks
5. **Professional Tone**: Maintain authoritative, analytical voice

## Bloomberg Writing Style
- **Precision**: Use exact numbers and data points
- **Professional**: Maintain formal, authoritative tone
- **Analytical**: Provide insights, not just facts
- **Timely**: Focus on recent market movements
- **Sourced**: "Bloomberg data shows..." or "According to Bloomberg..."

## Coverage Areas
- Stock Markets & Equities
- Fixed Income & Bonds
- Commodities & Futures
- Foreign Exchange (FX)
- Cryptocurrencies
- Economic Indicators
- Corporate Finance
- Mergers & Acquisitions
`,

  nyt: `
# New York Times Editorial Standards & Knowledge Base

## The Times' Mission
"To seek the truth and help people understand the world."
Founded in 1851, The New York Times is committed to independent journalism of the highest quality.

## Editorial Standards
- **Independence**: Free from political and commercial bias
- **Fairness**: Present all sides of a story
- **Accuracy**: Verify every fact
- **Transparency**: Explain our reporting methods
- **Accountability**: Correct errors promptly

## NYT Writing Style
- **Clarity**: Write for a general audience
- **Elegance**: Craft well-structured, engaging prose
- **Depth**: Provide context and background
- **Attribution**: Use "The Times" or "The New York Times"
- **AP Style**: Follow Associated Press style guide

## Coverage Excellence
- 132 Pulitzer Prizes (most of any news organization)
- Investigative journalism
- In-depth analysis
- International reporting
- Cultural criticism

## How to Reference NYT
- "The New York Times reports..."
- "According to Times reporting..."
- "A Times investigation revealed..."
- "Times analysis shows..."
`,

  techcrunch: `
# TechCrunch Startup & Technology Knowledge Base

## TechCrunch's Mission
Founded in 2005, TechCrunch is the leading technology media property, dedicated to 
obsessively profiling startups, reviewing new Internet products, and breaking tech news.

## Coverage Focus
- **Startups**: Early-stage to unicorns
- **Venture Capital**: Funding rounds, investors
- **Product Launches**: New tech products and services
- **Industry Trends**: AI, crypto, SaaS, etc.
- **Tech Events**: Disrupt, conferences

## Writing Style
- **Conversational**: Accessible, engaging tone
- **Fast-Paced**: Quick, punchy writing
- **Insider Knowledge**: Industry insights
- **Data-Focused**: Funding amounts, valuations, metrics
- **Forward-Looking**: What's next in tech

## Key Metrics to Track
- Funding rounds (Seed, Series A, B, C, etc.)
- Valuations (especially unicorns $1B+)
- User growth metrics
- Revenue multiples
- Exit strategies (IPO, acquisition)

## How to Cite
- "TechCrunch reports..."
- "According to TechCrunch..."
- "TechCrunch has learned..."
`,
}

/**
 * Get dynamic RAG context from uploaded documents
 *
 * TODO: Implement full RAG integration with vector search
 * For now, use the app's knowledgeBase field if available
 */
export async function getAppRAGContext(
  app: Partial<sushi> | null,
  userMessage: string,
): Promise<string> {
  if (!app?.ragEnabled) {
    return ""
  }

  // Use simple knowledgeBase field for now
  if (app.knowledgeBase) {
    return `\n\n## ${app.name} Knowledge Base:\n${app.knowledgeBase}\n\nIMPORTANT: Use this knowledge base to inform your responses. Follow the guidelines and style described above.`
  }

  // TODO: Implement vector search when RAG documents are uploaded
  // const ragContext = await buildEnhancedRAGContext(userMessage, threadId)

  return ""
}

/**
 * Get brand-specific knowledge base (hardcoded fallback for demos)
 */
export function getBrandKnowledgeBase(appName?: string | null): string {
  if (!appName) return ""

  const appLower = appName.toLowerCase()
  const knowledge = BRAND_KNOWLEDGE_BASES[appLower]

  if (!knowledge) return ""

  return `\n\n## ${appName} Knowledge Base & Guidelines:\n${knowledge}\n\nIMPORTANT: Follow ${appName}'s editorial standards and writing style in all responses. Always cite ${appName} as the source when referencing their content.`
}

/**
 * Get DNA Thread artifacts (public RAG content)
 *
 * Extracts uploaded files from the app's main thread.
 * These become public knowledge accessible to all users.
 */
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

/**
 * Get complete app knowledge (dynamic RAG + hardcoded fallback)
 */
export async function getAppKnowledge(
  app: Partial<sushi> | null,
  appName: string | null,
  userMessage: string,
): Promise<string> {
  // Try DNA Thread artifacts first (public RAG content)
  const dnaArtifacts = await getDNAThreadArtifacts(app || undefined)

  if (dnaArtifacts) {
    return dnaArtifacts
  }

  // Try dynamic RAG second
  const dynamicRAG = await getAppRAGContext(app, userMessage)

  if (dynamicRAG) {
    return dynamicRAG
  }

  // Fallback to hardcoded knowledge for demos
  return getBrandKnowledgeBase(appName)
}

/**
 * Get combined context for an app (news + knowledge base)
 */
export function getAppContext(
  appName?: string | null,
  newsContext?: string,
): string {
  const knowledgeBase = getBrandKnowledgeBase(appName)

  if (!newsContext && !knowledgeBase) return ""

  let context = ""

  if (newsContext) {
    context += newsContext
  }

  if (knowledgeBase) {
    context += knowledgeBase
  }

  return context
}

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

// App Installation Functions
export const getInstall = async ({
  appId,
  userId,
  guestId,
}: {
  appId: string
  userId?: string
  guestId?: string
}) => {
  const [install] = await db
    .select()
    .from(installs)
    .where(
      and(
        eq(installs.appId, appId),
        userId ? eq(installs.userId, userId) : undefined,
        guestId ? eq(installs.guestId, guestId) : undefined,
        isNull(installs.uninstalledAt),
      ),
    )
    .limit(1)

  return install
}

export const installApp = async ({
  appId,
  userId,
  guestId,
  order = 0,
  isPinned = false,
}: {
  appId: string
  userId?: string
  guestId?: string
  order?: number
  isPinned?: boolean
}) => {
  // Check if already installed
  const existing = await db
    .select()
    .from(installs)
    .where(
      and(
        eq(installs.appId, appId),
        userId ? eq(installs.userId, userId) : undefined,
        guestId ? eq(installs.guestId, guestId) : undefined,
        isNull(installs.uninstalledAt),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    return existing[0] // Already installed
  }

  // Install the app
  const [installed] = await db
    .insert(installs)
    .values({
      appId,
      userId,
      guestId,
      order,
      isPinned,
    })
    .returning()

  // Increment install count on app
  await db
    .update(apps)
    .set({
      installCount: sql`${apps.installCount} + 1`,
    })
    .where(eq(apps.id, appId))

  return installed
}

export const uninstallApp = async ({
  appId,
  userId,
  guestId,
}: {
  appId: string
  userId?: string
  guestId?: string
}) => {
  const [uninstalled] = await db
    .update(installs)
    .set({
      uninstalledAt: new Date(),
    })
    .where(
      and(
        eq(installs.appId, appId),
        userId ? eq(installs.userId, userId) : undefined,
        guestId ? eq(installs.guestId, guestId) : undefined,
        isNull(installs.uninstalledAt),
      ),
    )
    .returning()

  // Decrement install count on app
  if (uninstalled) {
    await db
      .update(apps)
      .set({
        installCount: sql`${apps.installCount} - 1`,
      })
      .where(eq(apps.id, appId))
  }

  return uninstalled
}

export const autoInstallDefaultApps = async ({
  userId,
  guestId,
}: {
  userId?: string
  guestId?: string
}) => {
  // Get all default system apps (no userId and no guestId)
  const defaultApps = await db
    .select()
    .from(apps)
    .where(and(isNull(apps.userId), isNull(apps.guestId)))

  // Install each default app
  const installations = await Promise.all(
    defaultApps.map((app, index) =>
      installApp({
        appId: app.id,
        userId,
        guestId,
        order: index, // Order by creation date
        isPinned: false,
      }),
    ),
  )

  return installations
}

// Vault - Expense Tracking Functions
export async function createExpense(expense: newExpense) {
  const [inserted] = await db.insert(expenses).values(expense).returning()
  return inserted
}

/**
 * 🍷 Log Stripe premium subscription revenue to Vault
 * Automatically calculates Stripe fees and net revenue
 *
 * @param userId - User ID who made the purchase
 * @param grossAmount - Total amount paid by customer (in cents)
 * @param currency - Currency code (e.g., "EUR", "USD")
 * @param productType - Premium product type
 * @param tier - Product tier (e.g., "public", "private", "standard")
 * @param stripeInvoiceId - Stripe invoice ID for reference
 * @param metadata - Additional metadata (e.g., appId, storeId, customDomain)
 */
export async function logStripeRevenue({
  userId,
  grossAmount,
  currency,
  productType,
  tier,
  stripeInvoiceId,
  metadata = {},
}: {
  userId: string
  grossAmount: number // in cents
  currency: string
  productType: "grape_analytics" | "pear_feedback" | "debugger" | "white_label"
  tier: string
  stripeInvoiceId: string
  metadata?: Record<string, any>
}) {
  try {
    // 🍷 Calculate Stripe fees: 1.4% + €0.25 (or $0.25)
    const percentageFee = Math.round(grossAmount * 0.014) // 1.4%
    const fixedFee = 25 // €0.25 or $0.25 in cents
    const stripeFee = percentageFee + fixedFee
    const netRevenue = grossAmount - stripeFee

    console.log(`🍷 Logging Stripe revenue:`, {
      userId: userId.substring(0, 8),
      grossAmount: `${(grossAmount / 100).toFixed(2)} ${currency}`,
      stripeFee: `${(stripeFee / 100).toFixed(2)} ${currency}`,
      netRevenue: `${(netRevenue / 100).toFixed(2)} ${currency}`,
      productType,
      tier,
    })

    // Create revenue entry in expenses table
    const revenueEntry = await createExpense({
      userId,
      amount: grossAmount, // Store gross amount as positive value
      currency,
      category: "revenue",
      description: `${productType} (${tier}) subscription revenue`,
      tags: [productType, tier, "stripe", "premium"],
      receipt: stripeInvoiceId, // Store invoice ID in receipt field for reference
    })

    console.log(`✅ Revenue logged successfully:`, {
      id: revenueEntry?.id?.substring(0, 8),
      gross: `${(grossAmount / 100).toFixed(2)} ${currency}`,
      net: `${(netRevenue / 100).toFixed(2)} ${currency}`,
    })

    return {
      revenueEntry,
      grossAmount,
      stripeFee,
      netRevenue,
    }
  } catch (error) {
    console.error("❌ Error logging Stripe revenue:", error)
    throw error
  }
}

export type budgetCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "bills"
  | "health"
  | "education"
  | "travel"
  | "revenue"
  | "other"

export async function getExpenses({
  id,
  userId,
  guestId,
  threadId,
  category,
  startDate,
  endDate,
  page = 1,
  pageSize = 100,
}: {
  id?: string
  userId?: string
  guestId?: string
  threadId?: string
  category?: budgetCategory
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): Promise<{
  expenses: expense[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> {
  const conditions = and(
    id ? eq(expenses.id, id) : undefined,
    userId ? eq(expenses.userId, userId) : undefined,
    guestId ? eq(expenses.guestId, guestId) : undefined,
    threadId ? eq(expenses.threadId, threadId) : undefined,
    category ? eq(expenses.category, category) : undefined,
    startDate ? gte(expenses.date, startDate) : undefined,
    endDate ? lte(expenses.date, endDate) : undefined,
  )

  const result = await db
    .select()
    .from(expenses)
    .where(conditions)
    .orderBy(desc(expenses.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(expenses.id) })
        .from(expenses)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    expenses: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export async function getExpense({
  id,
  userId,
  guestId,
}: {
  id: string
  userId?: string
  guestId?: string
}) {
  const [result] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        userId ? eq(expenses.userId, userId) : undefined,
        guestId ? eq(expenses.guestId, guestId) : undefined,
      ),
    )
  return result
}

export async function updateExpense(expense: expense) {
  const [updated] = await db
    .update(expenses)
    .set({ ...expense, updatedOn: new Date() })
    .where(eq(expenses.id, expense.id))
    .returning()
  return updated
}

export async function deleteExpense({ id }: { id: string }) {
  const [deleted] = await db
    .delete(expenses)
    .where(eq(expenses.id, id))
    .returning()
  return deleted
}

// Vault - Budget Functions
export async function createBudget(budget: newBudget) {
  const [inserted] = await db.insert(budgets).values(budget).returning()
  return inserted
}

export async function getBudgets({
  userId,
  category,
  isActive,
  page = 1,
  pageSize = 100,
  guestId,
}: {
  userId?: string
  category?: budgetCategory
  isActive?: boolean
  page?: number
  pageSize?: number
  guestId?: string
}): Promise<{
  budgets: budget[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> {
  const conditions = and(
    userId ? eq(budgets.userId, userId) : undefined,
    category ? eq(budgets.category, category) : undefined,
    isActive !== undefined ? eq(budgets.isActive, isActive) : undefined,
    guestId ? eq(budgets.guestId, guestId) : undefined,
  )

  const result = await db
    .select()
    .from(budgets)
    .where(conditions)
    .orderBy(desc(budgets.createdOn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(budgets.id) })
        .from(budgets)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    budgets: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export async function updateBudget(budget: budget) {
  const [updated] = await db
    .update(budgets)
    .set({ ...budget, updatedOn: new Date() })
    .where(eq(budgets.id, budget.id))
    .returning()
  return updated
}

export async function deleteBudget({ id }: { id: string }) {
  const [deleted] = await db
    .delete(budgets)
    .where(eq(budgets.id, id))
    .returning()
  return deleted
}

export async function createSharedExpense(sharedExpense: newSharedExpense) {
  const [result] = await db
    .insert(sharedExpenses)
    .values(sharedExpense)
    .returning()
  return result
}

export async function getSharedExpenses({
  expenseId,
  threadId,
  page = 1,
  pageSize = 100,
}: {
  expenseId?: string
  threadId?: string
  page?: number
  pageSize?: number
}): Promise<{
  sharedExpenses: sharedExpense[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> {
  const conditions = and(
    expenseId ? eq(sharedExpenses.expenseId, expenseId) : undefined,
    threadId ? eq(sharedExpenses.threadId, threadId) : undefined,
  )

  const result = await db
    .select()
    .from(sharedExpenses)
    .where(conditions)
    .orderBy(desc(sharedExpenses.createdOn))

  const totalCount =
    (
      await db
        .select({ count: count(sharedExpenses.id) })
        .from(sharedExpenses)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    sharedExpenses: result,
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export async function updateSharedExpense(sharedExpense: sharedExpense) {
  const [updated] = await db
    .update(sharedExpenses)
    .set({ ...sharedExpense, updatedOn: new Date() })
    .where(eq(sharedExpenses.id, sharedExpense.id))
    .returning()
  return updated
}

export async function deleteSharedExpense({ id }: { id: string }) {
  const [deleted] = await db
    .delete(sharedExpenses)
    .where(eq(sharedExpenses.id, id))
    .returning()
  return deleted
}

export async function createStore(store: newStore) {
  const [result] = await db.insert(stores).values(store).returning()

  // Invalidate store cache
  if (result) {
    await invalidateStore(result.id, result.slug)
  }

  return result
}

export async function getStores(payload: {
  page?: number
  pageSize?: number
  userId?: string
  guestId?: string
  appId?: string
  isSafe?: boolean
  includePublic?: boolean
  ownerId?: string
}) {
  const {
    page = 1,
    pageSize = 100,
    userId,
    guestId,
    appId,
    isSafe = false,
    includePublic = true,
    ownerId,
  } = payload
  // Use user-specific cache key if userId/guestId provided
  // Otherwise use public cache key
  const cacheKey = makeCacheKey(payload)

  // Try cache first
  const cached = await getCache<storesListResult>(cacheKey)
  if (cached) {
    return cached
  }

  // Check if current user/guest is the owner
  const isOwner = ownerId && (userId === ownerId || guestId === ownerId)

  const conditions = and(
    // If includePublic is true, return public stores OR user's stores
    includePublic
      ? or(
          eq(stores.visibility, "public"),
          userId ? eq(stores.userId, userId) : undefined,
          guestId ? eq(stores.guestId, guestId) : undefined,
          // If ownerId provided and not the current user, include owner's public stores only
          ownerId && !isOwner
            ? and(
                or(eq(stores.userId, ownerId), eq(stores.guestId, ownerId)),
                eq(stores.visibility, "public"),
              )
            : undefined,
          // If ownerId provided and IS the current user, include all owner's stores (public + private)
          ownerId && isOwner
            ? or(eq(stores.userId, ownerId), eq(stores.guestId, ownerId))
            : undefined,
        )
      : or(
          userId ? eq(stores.userId, userId) : undefined,
          guestId ? eq(stores.guestId, guestId) : undefined,
          // If ownerId provided and IS the current user, include all owner's stores
          ownerId && isOwner
            ? or(eq(stores.userId, ownerId), eq(stores.guestId, ownerId))
            : undefined,
        ),
    appId ? eq(stores.appId, appId) : undefined,
  )

  const result = await db
    .select()
    .from(stores)
    .leftJoin(users, eq(stores.userId, users.id))
    .leftJoin(guests, eq(stores.guestId, guests.id))
    .leftJoin(teams, eq(stores.teamId, teams.id))
    .leftJoin(apps, eq(stores.appId, apps.id))
    .where(conditions)
    .orderBy(
      // 1. User's own store first (1 if own, 0 if not) - descending so 1 comes first
      desc(
        sql`CASE 
          WHEN ${stores.userId} = ${userId || null} OR ${stores.guestId} = ${guestId || null} 
          THEN 1 
          ELSE 0 
        END`,
      ),
      // 2. Chrry second (1 if chrry, 0 if not) - descending so 1 comes first
      desc(sql`CASE WHEN ${stores.slug} = 'chrry' THEN 1 ELSE 0 END`),
      // 3. Then by creation date
      desc(stores.createdOn),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalCount =
    (
      await db
        .select({ count: count(stores.id) })
        .from(stores)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  // Clean up result structure
  const cleanedStores = await Promise.all(
    result.map(async (row) => {
      // Check if current user is the owner
      const isOwner =
        (userId && row.stores.userId === userId) ||
        (guestId && row.stores.guestId === guestId)

      const appsResult = await getApps({
        pageSize: 20,
        page: 1,
        userId: userId,
        guestId: guestId,
        storeId: row.stores.id,
      })

      return {
        store: row.stores,
        user:
          row.user && isSafe && !isOwner
            ? toSafeUser({ user: row.user })
            : row.user,
        guest:
          row.guest && isSafe && !isOwner
            ? toSafeGuest({ guest: row.guest })
            : row.guest,
        team: row.teams,
        app: row.app ? toSafeApp({ app: row.app, userId, guestId }) : undefined,
        apps: await Promise.all(
          appsResult.items.map(
            (app) => getApp({ id: app.id, userId, guestId })!,
          ),
        ),
      }
    }),
  )

  const storesResult = {
    stores: cleanedStores,
    totalCount,
    hasNextPage,
    nextPage,
  }

  // Determine if user owns any stores from results (no extra DB queries needed)
  const isStoreOwner = cleanedStores.some(
    (s) =>
      (userId && s.store.userId === userId) ||
      (guestId && s.store.guestId === guestId),
  )

  // Cache the result (1 hour for public, 5 minutes for owners) - fire and forget
  setCache(cacheKey, storesResult, isStoreOwner ? 60 * 5 : 60 * 60)

  // Cross-seed public cache if owner-specific request
  if (isStoreOwner) {
    const publicCacheKey = `stores:public:app:${appId}:owner:${ownerId}:public:${includePublic}:page:${page}:size:${pageSize}:isSafe:${isSafe}`
    const publicStoresResult = {
      ...storesResult,
      stores: storesResult.stores.map((s) => ({
        ...s,
        user: s.user ? toSafeUser({ user: s.user }) : s.user,
        guest: s.guest ? toSafeGuest({ guest: s.guest }) : s.guest,
        apps: s.apps.map((a) =>
          toSafeApp({ app: a, userId: undefined, guestId: undefined }),
        ),
      })),
    }
    setCache(publicCacheKey, publicStoresResult, 60 * 60)
  }

  return storesResult
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

export async function updateStore(store: storeUpdate) {
  // Filter out null values for non-nullable fields to avoid type issues
  const { title, ...rest } = store
  const updateData: any = { ...rest, updatedOn: new Date() }
  if (title !== undefined) {
    updateData.title = title || ""
  }

  const [updated] = await db
    .update(stores)
    .set(updateData)
    .where(eq(stores.id, store.id))
    .returning()

  // Invalidate store cache
  if (updated) {
    await invalidateStore(
      updated.id,
      updated.slug,
      updated.domain,
      updated.appId,
    )
  }

  return updated
}

export async function deleteStore({ id }: { id: string }) {
  const [deleted] = await db.delete(stores).where(eq(stores.id, id)).returning()

  // Invalidate store cache
  if (deleted) {
    await invalidateStore(
      deleted.id,
      deleted.slug,
      deleted.domain,
      deleted.appId,
    )

    // FalkorDB cleanup (safe - won't crash if fails)
    const { deleteFalkorStore } = await import("./src/falkorSync")
    await deleteFalkorStore(deleted.id)
  }

  return deleted
}

// Export app functions

export async function createStoreInstall(storeInstall: newStoreInstall) {
  const [result] = await db
    .insert(storeInstalls)
    .values(storeInstall)
    .returning()
  return result
}

export async function getStoreInstall({
  id,
  storeId,
  appId,
}: {
  id?: string
  storeId?: string
  appId?: string
}) {
  const conditions = and(
    id ? eq(storeInstalls.id, id) : undefined,
    storeId ? eq(storeInstalls.storeId, storeId) : undefined,
    appId ? eq(storeInstalls.appId, appId) : undefined,
  )

  const result = await db
    .select()
    .from(storeInstalls)
    .where(conditions)
    .orderBy(desc(storeInstalls.installedAt))
    .limit(1)

  return result[0]
}

export async function updateStoreInstall(storeInstall: storeInstall) {
  const [updated] = await db
    .update(storeInstalls)
    .set({ ...storeInstall, updatedOn: new Date() })
    .where(eq(storeInstalls.id, storeInstall.id))
    .returning()
  return updated
}

export async function deleteStoreInstall({ id }: { id: string }) {
  const [deleted] = await db
    .delete(storeInstalls)
    .where(eq(storeInstalls.id, id))
    .returning()
  return deleted
}

export async function createAppExtend(data: newAppExtend) {
  const [result] = await db.insert(appExtends).values(data).returning()
  return result
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

export async function deleteAppExtend({ appId }: { appId: string }) {
  const [deleted] = await db
    .delete(appExtends)
    .where(eq(appExtends.appId, appId))
    .returning()
  return deleted
}

export async function createAppOrder(data: newAppOrder) {
  const [result] = await db.insert(appOrders).values(data).returning()
  return result
}

export async function getAppOrders({
  storeId,
  userId,
  guestId,
}: {
  storeId?: string
  userId?: string
  guestId?: string
}) {
  const conditions = []
  if (storeId) conditions.push(eq(appOrders.storeId, storeId))
  if (userId) conditions.push(eq(appOrders.userId, userId))
  if (guestId) conditions.push(eq(appOrders.guestId, guestId))

  const result = await db
    .select()
    .from(appOrders)
    .innerJoin(apps, eq(appOrders.appId, apps.id))
    .where(and(...conditions))
    .orderBy(appOrders.order)

  return result.map((r) => ({
    ...r.app,
    order: r.appOrders.order,
    items: r.appOrders,
  }))
}

export async function updateAppOrder({
  appId,
  storeId,
  userId,
  guestId,
  order,
}: appOrder) {
  const conditions = [eq(appOrders.appId, appId)]
  if (storeId) conditions.push(eq(appOrders.storeId, storeId))
  if (userId) conditions.push(eq(appOrders.userId, userId))
  if (guestId) conditions.push(eq(appOrders.guestId, guestId))

  const [updated] = await db
    .update(appOrders)
    .set({ order, updatedOn: new Date() })
    .where(and(...conditions))
    .returning()

  return updated
}

export async function deleteAppOrder({
  appId,
  storeId,
  userId,
  guestId,
}: {
  appId: string
  storeId?: string
  userId?: string
  guestId?: string
}) {
  const conditions = [eq(appOrders.appId, appId)]
  if (storeId) conditions.push(eq(appOrders.storeId, storeId))
  if (userId) conditions.push(eq(appOrders.userId, userId))
  if (guestId) conditions.push(eq(appOrders.guestId, guestId))

  const [deleted] = await db
    .delete(appOrders)
    .where(and(...conditions))
    .returning()

  return deleted
}

export const createMood = async (mood: newMood) => {
  const [inserted] = await db.insert(moods).values(mood).returning()
  return inserted ? await getMood({ id: inserted.id }) : undefined
}

export const updateMood = async (mood: mood) => {
  const [updated] = await db
    .update(moods)
    .set(mood)
    .where(eq(moods.id, mood.id))
    .returning()

  return updated ? await getMood({ id: updated.id }) : undefined
}

export const deleteMood = async ({ id }: { id: string }) => {
  const [deleted] = await db.delete(moods).where(eq(moods.id, id)).returning()

  return deleted
}

export const getMoods = async ({
  page = 1,
  userId,
  search,
  createdDay,
  guestId,
  ...rest
}: {
  search?: string
  pageSize?: number
  userId?: string
  createdDay?: Date
  guestId?: string
  page?: number
} = {}): Promise<{
  moods: mood[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> => {
  const pageSize = rest.pageSize || 100

  const whereConditions = and(
    userId ? eq(moods.userId, userId) : undefined,
    createdDay
      ? and(
          gte(
            moods.createdOn,
            new Date(
              Date.UTC(
                createdDay.getUTCFullYear(),
                createdDay.getUTCMonth(),
                createdDay.getUTCDate(),
              ),
            ),
          ),
          lt(
            moods.createdOn,
            new Date(
              Date.UTC(
                createdDay.getUTCFullYear(),
                createdDay.getUTCMonth(),
                createdDay.getUTCDate() + 1,
              ),
            ),
          ),
        )
      : undefined,
    guestId ? eq(moods.guestId, guestId) : undefined,
  )
  const result = await db
    .select({ id: moods.id })
    .from(moods)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .where(whereConditions)
    .orderBy(desc(moods.createdOn))

  const totalCount =
    (
      await db
        .select({ count: count(moods.id) })
        .from(moods)
        .where(whereConditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    moods: (await Promise.all(
      result.map((mood) => getMood({ id: mood.id })),
    )) as mood[],
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export const getLastMood = async (userId?: string, guestId?: string) => {
  const now = new Date()
  const utcToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const recentMoods = await getMoods({
    pageSize: 10, // Get more recent moods to check
    userId,
    guestId,
  })

  // Filter for today's mood by comparing dates in JavaScript
  const todayStart = new Date(utcToday)
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) // Add 24 hours

  const mood = recentMoods.moods.find((m) => {
    const moodDate = new Date(m.createdOn)
    return moodDate >= todayStart && moodDate < todayEnd
  })

  return mood
}

export const createTask = async (task: newTask) => {
  const [inserted] = await db.insert(tasks).values(task).returning()
  return inserted
}

export const getTask = async ({
  id,
  userId,
  guestId,
}: {
  id?: string
  userId?: string
  guestId?: string
}) => {
  const result = (
    await db
      .select()
      .from(tasks)
      .where(
        and(
          id ? eq(tasks.id, id) : undefined,
          userId ? eq(tasks.userId, userId) : undefined,
          guestId ? eq(tasks.guestId, guestId) : undefined,
        ),
      )
  ).at(0)

  return result
}

export const updateTask = async (task: Partial<task> & { id: string }) => {
  const [updated] = await db
    .update(tasks)
    .set(task)
    .where(eq(tasks.id, task.id))
    .returning()

  return updated
}

export const deleteTask = async ({ id }: { id: string }) => {
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning()

  // FalkorDB cleanup (safe - won't crash if fails)
  if (deleted) {
    const { deleteFalkorTask } = await import("./src/falkorSync")
    await deleteFalkorTask(deleted.id)
  }

  return deleted
}

export const getTasks = async ({
  userId,
  page = 1,
  guestId,
  ...rest
}: {
  userId?: string
  guestId?: string
  page?: number
  pageSize?: number
} = {}): Promise<{
  tasks: task[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}> => {
  const pageSize = rest.pageSize || 100

  const conditionsArray = [
    userId ? eq(tasks.userId, userId) : undefined,
    guestId ? eq(tasks.guestId, guestId) : undefined,
  ]

  const conditions = and(...conditionsArray.filter(Boolean))

  const result = await db
    .select()
    .from(tasks)
    .limit(pageSize)
    .where(conditions)
    .offset((page - 1) * pageSize)
    .orderBy(tasks.order, desc(tasks.createdOn))

  const totalCount =
    (
      await db
        .select({ count: count(tasks.id) })
        .from(tasks)
        .where(conditions)
    )[0]?.count ?? 0

  const hasNextPage = totalCount > page * pageSize
  const nextPage = hasNextPage ? page + 1 : null

  return {
    tasks: await Promise.all(
      result.map(async (task) => ({
        ...task,
        mood: await getMood({ taskId: task.id }),
      })),
    ),
    totalCount,
    hasNextPage,
    nextPage,
  }
}

export const getTimer = async ({
  fingerprint,
  userId,
  guestId,
}: {
  fingerprint?: string
  userId?: string
  guestId?: string
}) => {
  const result = (
    await db
      .select()
      .from(timers)
      .where(
        and(
          userId ? eq(timers.userId, userId) : undefined,
          guestId ? eq(timers.guestId, guestId) : undefined,
        ),
      )
  ).at(0)

  return result
}

export const createTimer = async (timer: newTimer) => {
  const [inserted] = await db.insert(timers).values(timer).returning()
  return inserted
}

export const updateTimer = async (
  timer: Partial<timer> & { userId?: string | null; guestId?: string | null },
) => {
  const [_updated] = await db
    .update(timers)
    .set(timer)
    .where(
      timer.userId
        ? eq(timers.userId, timer.userId)
        : eq(timers.guestId, timer.guestId!),
    )
    .returning()

  return getTimer({
    userId: timer.userId || undefined,
    guestId: timer.guestId || undefined,
  })
}

export const deleteTimer = async ({ id }: { id: string }) => {
  const [deleted] = await db.delete(timers).where(eq(timers.id, id)).returning()

  return deleted
}

export const getStoreInstalls = async ({
  storeId,
  appId,
}: {
  storeId?: string
  appId?: string
}) => {
  if (!storeId && !appId) {
    throw new Error("getStoreInstalls requires storeId or appId")
  }
  const result = await db
    .select()
    .from(storeInstalls)
    .where(
      and(
        storeId ? eq(storeInstalls.storeId, storeId) : undefined,
        appId ? eq(storeInstalls.appId, appId) : undefined,
      ),
    )

  return result
}

export const deleteInstall = async ({
  appId,
  storeId,
}: {
  appId?: string
  storeId?: string
}) => {
  const store = await getStore({ id: storeId, skipCache: true })
  const [deleted] = await db
    .delete(storeInstalls)
    .where(
      and(
        appId ? eq(storeInstalls.appId, appId) : undefined,
        storeId ? eq(storeInstalls.storeId, storeId) : undefined,
      ),
    )
    .returning()

  store?.store.id &&
    invalidateStore(
      store.store.id,
      store.app?.id,
      store.store.domain,
      store.store.slug,
    )

  return deleted
}

// Export API key utilities
export { generateApiKey, getApiKeyEnv, isValidApiKey } from "./src/utils/apiKey"

export const getAnalyticsSite = async ({
  id,
  domain,
}: {
  id?: string
  domain?: string
}) => {
  let query = db.select().from(analyticsSites)

  if (id) {
    query = query.where(eq(analyticsSites.id, id)) as any
  } else if (domain) {
    query = query.where(eq(analyticsSites.domain, domain)) as any
  }

  const sites = await query.limit(1)
  return sites[0]
}

export const getAnalyticsSites = async () => {
  const sites = await db.select().from(analyticsSites)
  return sites
}

// Talent Marketplace Helpers
export const createTalentProfile = async (
  talentProfile: typeof talentProfiles.$inferInsert,
) => {
  try {
    const [created] = await db
      .insert(talentProfiles)
      .values(talentProfile)
      .returning()
    return created
  } catch (error) {
    console.error("Error creating talent profile:", error)
    return null
  }
}

// ============================================================================
// PREMIUM SUBSCRIPTIONS: Feature Gating & Management
// ============================================================================

export const hasPremiumAccess = async (
  userId: string,
  productType: "grape_analytics" | "pear_feedback" | "white_label",
): Promise<boolean> => {
  try {
    // 🍷 God Mode: White Label subscribers get access to ALL premium features
    const whiteLabelSub = await db
      .select()
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.userId, userId),
          eq(premiumSubscriptions.productType, "white_label"),
          eq(premiumSubscriptions.status, "active"),
        ),
      )
      .limit(1)

    if (whiteLabelSub.length > 0) {
      console.log(
        `🍷 God Mode activated for user ${userId.substring(0, 8)} - White Label grants access to ${productType}`,
      )
      return true
    }

    // Check for specific product subscription
    const subscription = await db
      .select()
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.userId, userId),
          eq(premiumSubscriptions.productType, productType),
          eq(premiumSubscriptions.status, "active"),
        ),
      )
      .limit(1)

    return subscription.length > 0
  } catch (error) {
    console.error("Error checking premium access:", error)
    return false
  }
}

export const getPremiumSubscription = async (
  userId: string,
  productType?: string,
) => {
  try {
    const query = db
      .select()
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.userId, userId),
          eq(premiumSubscriptions.status, "active"),
          productType
            ? eq(premiumSubscriptions.productType, productType as any)
            : undefined,
        ),
      )

    const subscriptions = await query
    return productType ? subscriptions[0] : subscriptions
  } catch (error) {
    console.error("Error getting premium subscription:", error)
    return null
  }
}

export const createPremiumSubscription = async (
  data: typeof premiumSubscriptions.$inferInsert,
) => {
  try {
    const [created] = await db
      .insert(premiumSubscriptions)
      .values(data)
      .returning()
    return created
  } catch (error) {
    console.error("Error creating premium subscription:", error)
    return null
  }
}

export const updatePremiumSubscription = async (
  stripeSubscriptionId: string,
  data: Partial<typeof premiumSubscriptions.$inferInsert>,
) => {
  try {
    const [updated] = await db
      .update(premiumSubscriptions)
      .set({ ...data, updatedOn: new Date() })
      .where(
        eq(premiumSubscriptions.stripeSubscriptionId, stripeSubscriptionId),
      )
      .returning()
    return updated
  } catch (error) {
    console.error("Error updating premium subscription:", error)
    return null
  }
}

export const cancelPremiumSubscription = async (
  stripeSubscriptionId: string,
) => {
  try {
    const [canceled] = await db
      .update(premiumSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedOn: new Date(),
      })
      .where(
        eq(premiumSubscriptions.stripeSubscriptionId, stripeSubscriptionId),
      )
      .returning()
    return canceled
  } catch (error) {
    console.error("Error canceling premium subscription:", error)
    return null
  }
}

// ============================================================================
// FEEDBACK TRANSACTIONS: Pear Credit Management
// ============================================================================

export const createFeedbackTransaction = async (
  data: typeof feedbackTransactions.$inferInsert,
) => {
  try {
    const [created] = await db
      .insert(feedbackTransactions)
      .values(data)
      .returning()
    return created
  } catch (error) {
    console.error("Error creating feedback transaction:", error)
    return null
  }
}

export const getFeedbackTransactions = async (userId: string) => {
  try {
    const transactions = await db
      .select()
      .from(feedbackTransactions)
      .where(eq(feedbackTransactions.feedbackUserId, userId))
    return transactions
  } catch (error) {
    console.error("Error getting feedback transactions:", error)
    return []
  }
}

export const getScheduledJob = async ({
  appId,
  userId,
  scheduleTypes,
  id,
}: {
  appId?: string
  userId?: string
  id?: string
  scheduleTypes?: string[]
}) => {
  try {
    const result = await db
      .select()
      .from(scheduledJobs)
      .where(
        and(
          id ? eq(scheduledJobs.id, id) : undefined,
          appId ? eq(scheduledJobs.appId, appId) : undefined,
          userId ? eq(scheduledJobs.userId, userId) : undefined,
          scheduleTypes
            ? inArray(scheduledJobs.scheduleType, scheduleTypes)
            : undefined,
        ),
      )
      .limit(1)
    return result[0] || undefined
  } catch (error) {
    console.error("Error getting scheduled job:", error)
    return undefined
  }
}

export const createScheduledJob = async (
  data: typeof scheduledJobs.$inferInsert,
) => {
  const [created] = await db.insert(scheduledJobs).values(data).returning()
  return created
}

export const updateScheduledJob = async (
  data: Partial<typeof scheduledJobs.$inferInsert> & { id: string },
) => {
  const [updated] = await db
    .update(scheduledJobs)
    .set({ ...data, updatedOn: new Date() })
    .where(eq(scheduledJobs.id, data.id))
    .returning()
  return updated
}

export const deleteScheduledJob = async (id: string) => {
  try {
    const [deleted] = await db
      .delete(scheduledJobs)
      .where(eq(scheduledJobs.id, id))
      .returning()
    return deleted
  } catch (error) {
    console.error("Error deleting scheduled job:", error)
    return null
  }
}

export const getScheduledJobs = async ({
  appId,
  userId,
  scheduleTypes,
}: {
  appId?: string
  userId?: string
  scheduleTypes?: ("tribe" | "molt")[]
}) => {
  try {
    const result = await db
      .select()
      .from(scheduledJobs)
      .where(
        and(
          appId ? eq(scheduledJobs.appId, appId) : undefined,
          userId ? eq(scheduledJobs.userId, userId) : undefined,
          scheduleTypes
            ? inArray(scheduledJobs.scheduleType, scheduleTypes)
            : undefined,
        ),
      )
    return result
  } catch (error) {
    console.error("Error getting scheduled jobs:", error)
    return []
  }
}

// ============================================
// TRIBE ENGAGEMENT FUNCTIONS
// ============================================

export const getTribeReactions = async ({
  postId,
  commentId,
  userId,
  appId,
  guestId,
  limit = 50,
}: {
  postId?: string
  commentId?: string
  userId?: string
  appId?: string
  guestId?: string
  limit?: number
}) => {
  try {
    const result = await db
      .select({
        reaction: tribeReactions,
        user: users,
        guest: guests,
        app: apps,
      })
      .from(tribeReactions)
      .leftJoin(users, eq(tribeReactions.userId, users.id))
      .leftJoin(guests, eq(tribeReactions.guestId, guests.id))
      .leftJoin(apps, eq(tribeReactions.appId, apps.id))
      .where(
        and(
          appId ? eq(tribeReactions.appId, appId) : undefined,
          postId ? eq(tribeReactions.postId, postId) : undefined,
          commentId ? eq(tribeReactions.commentId, commentId) : undefined,
          userId ? eq(tribeReactions.userId, userId) : undefined,
          guestId ? eq(tribeReactions.guestId, guestId) : undefined,
        ),
      )
      .limit(limit)

    return result.map((row) => ({
      id: row.reaction.id,
      emoji: row.reaction.emoji,
      createdOn: row.reaction.createdOn,
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
      app: row.app
        ? {
            id: row.app.id,
            name: row.app.name,
            slug: row.app.slug,
          }
        : null,
    }))
  } catch (error) {
    console.error("Error getting tribe reactions:", error)
    return []
  }
}

export const getTribes = async ({
  search,
  page = 1,
  pageSize = 20,
  appId,
}: {
  search?: string
  page?: number
  pageSize?: number
  appId?: string
}) => {
  try {
    // If appId is provided, filter tribes that have posts from this app
    if (appId) {
      const conditions = [
        search && search.length >= 3
          ? sql`(
              to_tsvector('english', COALESCE(${tribes.name}, '') || ' ' || COALESCE(${tribes.description}, '') || ' ' || COALESCE(${tribes.slug}, ''))
              @@ plainto_tsquery('english', ${search})
            )`
          : undefined,
      ].filter(Boolean)

      // Get tribes that have posts with this appId
      const result = await db
        .select()
        .from(tribes)
        .where(
          and(
            sql`EXISTS (SELECT 1 FROM ${tribePosts} WHERE ${tribePosts.tribeId} = ${tribes.id} AND ${tribePosts.appId} = ${appId})`,
            conditions.length > 0 ? and(...conditions) : undefined,
          ),
        )
        .orderBy(desc(tribes.postsCount), desc(tribes.membersCount))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Get total count for pagination (use distinct to avoid duplicates from join)
      const totalCount =
        (
          await db
            .select({ count: sql<number>`COUNT(DISTINCT ${tribes.id})` })
            .from(tribes)
            .innerJoin(tribePosts, eq(tribePosts.tribeId, tribes.id))
            .where(
              and(
                eq(tribePosts.appId, appId),
                conditions.length > 0 ? and(...conditions) : undefined,
              ),
            )
        )[0]?.count ?? 0

      const hasNextPage = totalCount > page * pageSize
      const nextPage = hasNextPage ? page + 1 : null

      return {
        tribes: result,
        totalCount,
        hasNextPage,
        nextPage,
      }
    }

    // No appId filter - return all tribes
    const conditions = [
      search && search.length >= 3
        ? sql`(
            to_tsvector('english', COALESCE(${tribes.name}, '') || ' ' || COALESCE(${tribes.description}, '') || ' ' || COALESCE(${tribes.slug}, ''))
            @@ plainto_tsquery('english', ${search})
          )`
        : undefined,
    ].filter(Boolean)

    const result = await db
      .select()
      .from(tribes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tribes.postsCount), desc(tribes.membersCount))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    // Get total count for pagination
    const totalCount =
      (
        await db
          .select({ count: count(tribes.id) })
          .from(tribes)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
      )[0]?.count ?? 0

    const hasNextPage = totalCount > page * pageSize
    const nextPage = hasNextPage ? page + 1 : null

    return {
      tribes: result,
      totalCount,
      hasNextPage,
      nextPage,
    }
  } catch (error) {
    console.error("Error getting tribes:", error)
    return {
      tribes: [],
      totalCount: 0,
      hasNextPage: false,
      nextPage: null,
    }
  }
}

export const getTribePosts = async ({
  tribeId,
  appId,
  userId,
  guestId,
  search,
  characterProfileIds,
  tags,
  page = 1,
  pageSize = 10,
  id,
  sortBy = "date",
  order = "desc",
  tribeSlug,
  includeEngagement = true,
}: {
  tribeId?: string
  appId?: string
  userId?: string
  id?: string
  guestId?: string
  search?: string
  characterProfileIds?: string[]
  tags?: string[]
  page?: number
  tribeSlug?: string
  pageSize?: number
  sortBy?: "date" | "hot" | "liked"
  order?: "asc" | "desc"
  includeEngagement?: boolean
}) => {
  try {
    const conditions = [
      tribeId ? eq(tribePosts.tribeId, tribeId) : undefined,
      tribeSlug ? eq(tribes.slug, tribeSlug) : undefined,
      appId ? eq(tribePosts.appId, appId) : undefined,
      // userId ? eq(tribePosts.userId, userId) : undefined,
      id ? eq(tribePosts.id, id) : undefined,
      // guestId ? eq(tribePosts.guestId, guestId) : undefined,
      search && search.length >= 3
        ? sql`(
            to_tsvector('english', COALESCE(${tribePosts.title}, '') || ' ' || COALESCE(${tribePosts.content}, '')) 
            @@ plainto_tsquery('english', ${search})
            OR ${apps.name} ILIKE ${`%${search}%`}
            OR ${apps.description} ILIKE ${`%${search}%`}
          )`
        : undefined,
    ].filter(Boolean)

    // If character profile IDs are provided, get their app IDs
    let characterProfileAppIds: string[] = []
    if (characterProfileIds && characterProfileIds.length > 0) {
      const profiles = await db
        .select({ appId: characterProfiles.appId })
        .from(characterProfiles)
        .where(inArray(characterProfiles.id, characterProfileIds))

      characterProfileAppIds = profiles
        .map((p) => p.appId)
        .filter((id): id is string => id !== null)

      // Short-circuit: if profiles were requested but none found, return empty
      if (characterProfileAppIds.length === 0) {
        return { posts: [], totalCount: 0 }
      }

      // Add app ID filter
      conditions.push(inArray(tribePosts.appId, characterProfileAppIds))
    }

    // If tags are provided, filter by characterProfile.tags overlap
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(
        (tag) =>
          sql`${characterProfiles.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`,
      )
      const taggedProfiles = await db
        .select({ appId: characterProfiles.appId })
        .from(characterProfiles)
        .where(
          and(
            isNotNull(characterProfiles.appId),
            eq(characterProfiles.visibility, "public"),
            or(...tagConditions),
          ),
        )

      const taggedAppIds = taggedProfiles
        .map((p) => p.appId)
        .filter((id): id is string => id !== null)

      if (taggedAppIds.length === 0) {
        return { posts: [], totalCount: 0 }
      }

      conditions.push(inArray(tribePosts.appId, taggedAppIds))
    }

    // Dynamic sorting based on sortBy parameter
    let orderByClause: any
    if (sortBy === "liked") {
      // Only show posts the current user has actually liked
      if (!userId && !guestId) {
        // If no user/guest provided, return empty for liked posts
        return { posts: [], totalCount: 0 }
      }
      // Add condition to only include posts liked by this user/guest
      if (userId) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM "tribeLikes" 
            WHERE "tribeLikes"."postId" = ${tribePosts.id} 
            AND "tribeLikes"."userId" = ${userId}
          )`,
        )
      } else if (guestId) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM "tribeLikes" 
            WHERE "tribeLikes"."postId" = ${tribePosts.id} 
            AND "tribeLikes"."guestId" = ${guestId}
          )`,
        )
      }
      // Sort by when they liked it (most recent likes first)
      orderByClause = sql`(
        SELECT COALESCE("tribeLikes"."createdOn", ${tribePosts.createdOn})
        FROM "tribeLikes" 
        WHERE "tribeLikes"."postId" = ${tribePosts.id} 
        AND (${userId ? sql`"tribeLikes"."userId" = ${userId}` : sql`"tribeLikes"."guestId" = ${guestId}`})
        LIMIT 1
      ) DESC`
    } else if (sortBy === "hot") {
      orderByClause = sql`(
    COALESCE(${tribePosts.commentsCount}, 0) + 
    (SELECT COUNT(*) FROM "tribeLikes" WHERE "tribeLikes"."postId" = ${tribePosts.id}) +
    (SELECT COUNT(*) FROM "tribeReactions" WHERE "tribeReactions"."postId" = ${tribePosts.id}) +
    1
  ) / POWER((EXTRACT(EPOCH FROM (NOW() - ${tribePosts.createdOn}))/3600 + 2), 1.5) DESC`
    } else {
      // Default: sort by date, respecting order param
      orderByClause =
        order === "asc" ? asc(tribePosts.createdOn) : desc(tribePosts.createdOn)
    }

    const result = await db
      .select({
        post: tribePosts,
        app: apps,
        store: stores,
        user: users,
        guest: guests,
        tribe: tribes,
      })
      .from(tribePosts)
      .leftJoin(apps, eq(tribePosts.appId, apps.id))
      .leftJoin(stores, eq(apps.storeId, stores.id))
      .leftJoin(users, eq(tribePosts.userId, users.id))
      .leftJoin(guests, eq(tribePosts.guestId, guests.id))
      .leftJoin(tribes, eq(tribePosts.tribeId, tribes.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    // Get total count for pagination
    const totalCount =
      (
        await db
          .select({ count: count(tribePosts.id) })
          .from(tribePosts)
          .leftJoin(tribes, eq(tribePosts.tribeId, tribes.id))
          .leftJoin(apps, eq(tribePosts.appId, apps.id))
          .where(and(...conditions))
      )[0]?.count ?? 0

    const hasNextPage = totalCount > page * pageSize
    const nextPage = hasNextPage ? page + 1 : null

    // Cache for getApp results to avoid N+1 queries
    const appCache = new Map<string, sushi | undefined>()

    const postsWithEngagement = await Promise.all(
      result.map(async (row) => {
        if (!includeEngagement) {
          return {
            id: row.post.id,
            title: row.post.title,
            content: row.post.content,
            visibility: row.post.visibility,
            likesCount: row.post.likesCount,
            commentsCount: row.post.commentsCount,
            images: row.post.images,
            videos: row.post.videos,
            sharesCount: row.post.sharesCount,
            createdOn: row.post.createdOn,
            updatedOn: row.post.updatedOn,
            languages: [],
            app: row.app
              ? toSafeApp({
                  app: row.app as any,
                  userId,
                  guestId,
                })
              : null,
            user: row.user
              ? toSafeUser({
                  user: row.user,
                })
              : null,
            guest: row.guest
              ? toSafeGuest({
                  guest: row.guest,
                })
              : null,
            tribe: row.tribe,
            likes: [],
            comments: [],
            reactions: [],
          }
        }

        const [likes, comments, reactions, translationLangs] =
          await Promise.all([
            // Get likes
            db
              .select({
                like: tribeLikes,
                user: users,
                guest: guests,
              })
              .from(tribeLikes)
              .leftJoin(users, eq(tribeLikes.userId, users.id))
              .leftJoin(guests, eq(tribeLikes.guestId, guests.id))
              .where(eq(tribeLikes.postId, row.post.id))
              .limit(100),

            // Get comments
            db
              .select({
                comment: tribeComments,
                app: apps,
              })
              .from(tribeComments)
              .innerJoin(apps, eq(tribeComments.appId, apps.id))
              .where(eq(tribeComments.postId, row.post.id))
              .orderBy(desc(tribeComments.createdOn))
              .limit(100),

            // Get reactions
            db
              .select({
                reaction: tribeReactions,
                app: apps,
              })
              .from(tribeReactions)
              .innerJoin(apps, eq(tribeReactions.appId, apps.id))
              .where(eq(tribeReactions.postId, row.post.id))
              .limit(100),

            // Get available translation languages for hreflang
            db
              .select({ language: tribePostTranslations.language })
              .from(tribePostTranslations)
              .where(eq(tribePostTranslations.postId, row.post.id))
              .limit(20),
          ])

        const hippo = row?.post?.threadId
          ? await db
              .select()
              .from(hippos)
              .where(and(eq(hippos.tribePostId, row?.post?.id)))
          : []

        // Resolve presigned URLs for hippo files
        const resolvedHippo = await Promise.all(
          (hippo || []).map(async (h) => {
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
                const presignedUrl = await getSignedS3Url(s3Key, context)
                if (presignedUrl) {
                  return { ...file, url: presignedUrl }
                }
                return file
              }),
            )
            return { ...h, files: resolvedFiles }
          }),
        )

        return {
          id: row.post.id,
          title: row.post.title,
          content: row.post.content,
          visibility: row.post.visibility,
          likesCount: row.post.likesCount,
          commentsCount: row.post.commentsCount,
          images: row.post.images,
          videos: row.post.videos,
          hippo: resolvedHippo,
          // audios: row.post.audios,
          sharesCount: row.post.sharesCount,
          createdOn: row.post.createdOn,
          updatedOn: row.post.updatedOn,
          languages: Array.from(
            new Set(
              translationLangs
                .map((t) => t.language)
                .filter((lang): lang is locale =>
                  locales.includes(lang as locale),
                ),
            ),
          ),
          app: row.app
            ? await (async () => {
                const appId = row.app?.id
                if (!appId) return

                if (appCache.has(appId)) {
                  const cachedApp = appCache.get(appId)
                  return toSafeApp({
                    app: cachedApp,
                    userId,
                    guestId,
                  })
                }

                const app = row?.app?.id
                  ? await getApp({ id: row.app.id, userId, guestId })
                  : undefined

                if (!app) return null

                return toSafeApp({
                  app: {
                    ...app,
                  } as unknown as app,
                  userId,
                  guestId,
                })
              })()
            : null,
          user: row.user
            ? toSafeUser({
                user: row.user,
              })
            : null,
          guest: row.guest
            ? toSafeGuest({
                guest: row.guest,
              })
            : null,
          tribe: row.tribe,
          likes: likes.map((l) => ({
            id: l.like.id,
            createdOn: l.like.createdOn,
            user: l.user
              ? toSafeUser({
                  user: l.user,
                })
              : null,
            guest: l.guest
              ? toSafeGuest({
                  guest: l.guest,
                })
              : null,
          })),
          comments: comments.map((c) => ({
            id: c.comment.id,
            content: c.comment.content,
            likesCount: c.comment.likesCount,
            createdOn: c.comment.createdOn,
            updatedOn: c.comment.updatedOn,
            app: c.app
              ? toSafeApp({
                  app: c.app,
                  userId,
                  guestId,
                })
              : null,
          })),
          reactions: reactions.map((r) => ({
            id: r.reaction.id,
            emoji: r.reaction.emoji,
            createdOn: r.reaction.createdOn,
            app: r.app
              ? toSafeApp({
                  app: r.app,
                  userId,
                  guestId,
                })
              : null,
          })),
        }
      }),
    )

    return {
      posts: postsWithEngagement,
      totalCount,
      hasNextPage,
      nextPage,
    }
  } catch (error) {
    console.error("Error getting tribe posts:", error)
    return {
      posts: [],
      totalCount: 0,
      hasNextPage: false,
      nextPage: null,
    }
  }
}

export const getTribePost = async ({
  tribeId,
  appId,
  userId,
  guestId,
  id,
}: {
  tribeId?: string
  appId?: string
  userId?: string
  guestId?: string
  id: string
}) => {
  const result = await getTribePosts({
    tribeId,
    appId,
    userId,
    guestId,
    pageSize: 1,
    id,
  })

  return result?.posts?.[0]
}

export const getTribeFollows = async ({
  appId,
  followerId,
  followerGuestId,
  followingAppId,
  limit = 100,
}: {
  followerId?: string
  followerGuestId?: string
  followingAppId?: string
  limit?: number
  appId?: string
}) => {
  try {
    const result = await db
      .select({
        follow: tribeFollows,
        follower: users,
        followerGuest: guests,
        followingApp: apps,
      })
      .from(tribeFollows)
      .leftJoin(users, eq(tribeFollows.followerId, users.id))
      .leftJoin(guests, eq(tribeFollows.followerGuestId, guests.id))
      .leftJoin(apps, eq(tribeFollows.followingAppId, apps.id))
      .where(
        and(
          followerId ? eq(tribeFollows.followerId, followerId) : undefined,
          appId ? eq(tribeFollows.appId, appId) : undefined,
          followerGuestId
            ? eq(tribeFollows.followerGuestId, followerGuestId)
            : undefined,
          followingAppId
            ? eq(tribeFollows.followingAppId, followingAppId)
            : undefined,
        ),
      )
      .limit(limit)

    return result.map((row) => ({
      id: row.follow.id,
      createdOn: row.follow.createdOn,
      follower: row.follower
        ? {
            id: row.follower.id,
            name: row.follower.name,
            userName: row.follower.userName,
            image: row.follower.image,
          }
        : null,
      followerGuest: row.followerGuest
        ? {
            id: row.followerGuest.id,
            name: "Guest",
            image: "",
          }
        : null,
      followingApp: row.followingApp
        ? {
            id: row.followingApp.id,
            name: row.followingApp.name,
            slug: row.followingApp.slug,
            icon: row.followingApp.icon,
          }
        : null,
    }))
  } catch (error) {
    console.error("Error getting tribe follows:", error)
    return []
  }
}

export const getTribeLikes = async ({
  postId,
  userId,
  guestId,
  limit = 100,
}: {
  postId?: string
  userId?: string
  guestId?: string
  limit?: number
}) => {
  try {
    const result = await db
      .select({
        like: tribeLikes,
        user: users,
        guest: guests,
      })
      .from(tribeLikes)
      .leftJoin(users, eq(tribeLikes.userId, users.id))
      .leftJoin(guests, eq(tribeLikes.guestId, guests.id))
      .where(
        and(
          postId ? eq(tribeLikes.postId, postId) : undefined,
          userId ? eq(tribeLikes.userId, userId) : undefined,
          guestId ? eq(tribeLikes.guestId, guestId) : undefined,
        ),
      )
      .limit(limit)

    return result.map((row) => ({
      id: row.like.id,
      createdOn: row.like.createdOn,
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
    console.error("Error getting tribe likes:", error)
    return []
  }
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

export { captureException } from "./src/captureException"
export * from "./src/graph/client"
export {
  sendDiscordNotification,
  sendErrorNotification,
} from "./src/sendDiscordNotification"

export interface AutoCreateTribeParams {
  slug: string
  userId?: string
  guestId?: string
}

export async function getOrCreateTribe(
  params: AutoCreateTribeParams,
): Promise<string> {
  const { slug, userId, guestId } = params

  // Validate exactly one identity is provided (XOR)
  const hasUserId = userId !== undefined && userId !== null
  const hasGuestId = guestId !== undefined && guestId !== null

  if (hasUserId && hasGuestId) {
    throw new Error("Cannot provide both userId and guestId")
  }
  if (!hasUserId && !hasGuestId) {
    throw new Error("Must provide either userId or guestId")
  }

  // Normalize slug (lowercase, replace spaces with hyphens)
  const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-")

  if (!db) throw new Error("Database not initialized")

  // Check if tribe already exists
  const existingTribe = await db.query.tribes.findFirst({
    where: eq(tribes.slug, normalizedSlug),
  })

  if (!existingTribe) {
    // Tribe not found — fall back to 'general' instead of throwing
    console.warn(
      `⚠️ Tribe not found: t/${normalizedSlug} - falling back to 'general'`,
    )
    const generalTribe = await db.query.tribes.findFirst({
      where: eq(tribes.slug, "general"),
    })
    if (!generalTribe) {
      throw new Error(
        `Tribe "t/${normalizedSlug}" does not exist and fallback tribe "general" also not found.`,
      )
    }
    return generalTribe.id
  }

  // Auto-join existing tribe using transaction with conflict handling
  await db.transaction(async (tx) => {
    const insertResult = await tx
      .insert(tribeMemberships)
      .values({
        tribeId: existingTribe.id,
        userId: userId || null,
        guestId: guestId || null,
        role: "member",
      })
      .onConflictDoNothing({
        target: userId
          ? [tribeMemberships.tribeId, tribeMemberships.userId]
          : [tribeMemberships.tribeId, tribeMemberships.guestId],
      })
      .returning({ id: tribeMemberships.id })

    // Only increment count if a new row was inserted
    if (insertResult.length > 0) {
      await tx
        .update(tribes)
        .set({
          membersCount: existingTribe.membersCount + 1,
        })
        .where(eq(tribes.id, existingTribe.id))
    }
  })

  return existingTribe.id
}

/**
 * Get aggregated API usage statistics for an app
 * Returns total requests, tokens, and estimated credits used
 */
export async function getAgentApiUsage({
  appId,
  periodStart,
  periodEnd,
}: {
  appId: string
  periodStart?: Date
  periodEnd?: Date
}) {
  const conditions = [eq(agentApiUsage.appId, appId)]

  if (periodStart) {
    conditions.push(gte(agentApiUsage.periodStart, periodStart))
  }

  if (periodEnd) {
    conditions.push(lte(agentApiUsage.periodEnd, periodEnd))
  }

  const result = await db
    .select({
      totalRequests: sum(agentApiUsage.requestCount),
      totalTokens: sum(agentApiUsage.totalTokens),
      totalAmount: sum(agentApiUsage.amount),
      successCount: sum(agentApiUsage.successCount),
      errorCount: sum(agentApiUsage.errorCount),
    })
    .from(agentApiUsage)
    .where(and(...conditions))

  const stats = result[0]

  return {
    totalRequests: Number(stats?.totalRequests || 0),
    totalTokens: Number(stats?.totalTokens || 0),
    totalAmount: Number(stats?.totalAmount || 0), // in cents
    successCount: Number(stats?.successCount || 0),
    errorCount: Number(stats?.errorCount || 0),
    // Estimate credits: ~1 credit per 1000 tokens (adjust based on your pricing)
    estimatedCredits: Math.ceil(Number(stats?.totalTokens || 0) / 1000),
  }
}

// NewsAPI country codes mapped from locales (top-headlines supports country param)
const NEWS_COUNTRIES: { country: string; lang: string }[] = [
  { country: "us", lang: "en" }, // United States (English)
  { country: "gb", lang: "en" }, // United Kingdom (English)
  { country: "ca", lang: "en" }, // Canada (English)
  { country: "au", lang: "en" }, // Australia (English)
  { country: "in", lang: "en" }, // India (English)
  { country: "de", lang: "de" }, // Germany (German)
  { country: "fr", lang: "fr" }, // France (French)
  { country: "es", lang: "es" }, // Spain (Spanish)
  { country: "it", lang: "it" }, // Italy (Italian)
  { country: "nl", lang: "nl" }, // Netherlands (Dutch)
  { country: "br", lang: "pt" }, // Brazil (Portuguese)
  { country: "pt", lang: "pt" }, // Portugal (Portuguese)
  { country: "jp", lang: "ja" }, // Japan (Japanese)
  { country: "kr", lang: "ko" }, // Korea (Korean)
  { country: "cn", lang: "zh" }, // China (Chinese)
  { country: "tw", lang: "zh" }, // Taiwan (Chinese)
  { country: "tr", lang: "tr" }, // Turkey (Turkish)
  { country: "ru", lang: "ru" }, // Russia (Russian)
  { country: "ua", lang: "uk" }, // Ukraine (Ukrainian)
  { country: "gr", lang: "el" }, // Greece (Greek)
  { country: "il", lang: "he" }, // Israel (Hebrew)
  { country: "sa", lang: "ar" }, // Saudi Arabia (Arabic)
  { country: "eg", lang: "ar" }, // Egypt (Arabic)
  { country: "vn", lang: "vi" }, // Vietnam (Vietnamese)
  { country: "pl", lang: "pl" }, // Poland (Polish)
  { country: "se", lang: "sv" }, // Sweden (Swedish)
  { country: "no", lang: "no" }, // Norway (Norwegian)
]

// Scrape og:description / meta description from a URL (best-effort, no throw)
async function scrapeMetaDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VexBot/1.0)" },
    })
    if (!res.ok) return null
    const html = await res.text()

    // og:description (most reliable)
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,})["']/i,
    )
    if (ogMatch?.[1]) return ogMatch[1].substring(0, 2000)

    // meta description fallback
    const metaMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,})["']/i,
    )
    if (metaMatch?.[1]) return metaMatch[1].substring(0, 2000)

    return null
  } catch {
    return null
  }
}

export async function fetchAndStoreOldNews(): Promise<{
  inserted: number
  skipped: number
  error?: string
  countryStats?: { country: string; fetched: number; error?: string }[]
  newlyInserted?: {
    title: string
    description: string | null
    content: string | null
    source: string | null
    country: string
    category: string | null
    publishedAt: Date | null
  }[]
}> {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return { inserted: 0, skipped: 0, error: "NEWS_API_KEY not set" }
  }

  const allArticles: {
    title: string
    description: string | null
    content: string | null
    url: string
    source: string | null
    country: string
    category: string
    publishedAt: Date | null
  }[] = []

  const countryStats: { country: string; fetched: number; error?: string }[] =
    []

  for (const { country, lang } of NEWS_COUNTRIES) {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=20&apiKey=${apiKey}`,
        // NOTE: If country returns 0 articles (free tier limit), fallback to /everything?language
      )
      if (!res.ok) {
        countryStats.push({ country, fetched: 0, error: `HTTP ${res.status}` })
        continue
      }
      const data = (await res.json()) as {
        status: string
        code?: string
        message?: string
        articles: {
          title: string
          description?: string
          content?: string
          url: string
          source?: { name?: string }
          publishedAt?: string
        }[]
      }
      if (data.status !== "ok") {
        countryStats.push({
          country,
          fetched: 0,
          error: data.code || data.message || "API error",
        })
        continue
      }
      let fetched = 0
      for (const article of data.articles || []) {
        if (!article.title || !article.url) continue
        // NewsAPI content field is truncated at ~200 chars with "[+N chars]"

        let trimmed = article.content ? article.content.trim() : ""
        const suffixIndex = trimmed.lastIndexOf(" [")
        if (suffixIndex !== -1) {
          const potentialSuffix = trimmed.slice(suffixIndex)
          if (/^\[\d+ chars\]$/.test(potentialSuffix)) {
            trimmed = trimmed.slice(0, suffixIndex)
          }
        }

        if (!trimmed) continue

        const apiContent = trimmed
        allArticles.push({
          title: article.title.substring(0, 500),
          description: article.description
            ? article.description.substring(0, 1000)
            : null,
          content: apiContent,
          url: article.url,
          source: article.source?.name || null,
          country,
          category: lang,
          publishedAt: article.publishedAt
            ? new Date(article.publishedAt)
            : null,
        })
        fetched++
      }
      countryStats.push({ country, fetched })
    } catch (err) {
      countryStats.push({
        country,
        fetched: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Enrich articles with meta scrape where content is short/missing
  // Run in parallel batches of 10 to avoid overwhelming servers
  const toEnrich = allArticles.filter(
    (a) => !a.content || a.content.length < 200,
  )
  const batchSize = 10
  for (let i = 0; i < toEnrich.length; i += batchSize) {
    const batch = toEnrich.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (article) => {
        const scraped = await scrapeMetaDescription(article.url)
        if (scraped && scraped.length > (article.content?.length ?? 0)) {
          article.content = scraped
        }
      }),
    )
  }

  if (allArticles.length === 0) {
    return { inserted: 0, skipped: 0 }
  }

  // Delete news older than 48 hours
  await db
    .delete(tribeNews)
    .where(lt(tribeNews.fetchedAt, new Date(Date.now() - 48 * 60 * 60 * 1000)))

  let inserted = 0
  let skipped = 0

  const newlyInserted: typeof allArticles = []
  for (const article of allArticles) {
    try {
      const result = await db
        .insert(tribeNews)
        .values(article)
        .onConflictDoNothing()
        .returning({ id: tribeNews.id })
      if (result.length > 0) {
        inserted++
        newlyInserted.push(article)
      } else {
        skipped++
      }
    } catch {
      skipped++
    }
  }

  return { inserted, skipped, newlyInserted, countryStats }
}

export async function fetchAndStoreNews(): Promise<{
  inserted: number
  skipped: number
  error?: string
  countryStats?: { country: string; fetched: number; error?: string }[]
  newlyInserted?: any[]
}> {
  // Değişken adını GNEWS_API_KEY olarak güncelledik
  const apiKey = process.env.GNEWS_API_KEY
  if (!apiKey) {
    return { inserted: 0, skipped: 0, error: "GNEWS_API_KEY not set" }
  }

  const allArticles: any[] = []
  const countryStats: { country: string; fetched: number; error?: string }[] =
    []

  for (const { country, lang } of NEWS_COUNTRIES) {
    try {
      // GNews API v4 URL yapısı
      // GNews 'pageSize' yerine 'max' kullanır (Free tier max 10'dur genelde)
      const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=${lang}&country=${country}&max=10&apikey=${apiKey}`

      const res = await fetch(url)

      if (!res.ok) {
        countryStats.push({ country, fetched: 0, error: `HTTP ${res.status}` })
        continue
      }

      const data = await res.json()

      // GNews hata durumunda 'errors' dizisi dönebilir
      if (data.errors) {
        countryStats.push({
          country,
          fetched: 0,
          error: data.errors[0] || "GNews API error",
        })
        continue
      }

      let fetched = 0
      for (const article of data.articles || []) {
        if (!article.title || !article.url) continue

        // GNews içeriği NewsAPI'dan biraz daha uzundur ama yine de tam metin değildir
        // Senin enrichment (zenginleştirme) mantığını burada koruyoruz
        const apiContent = article.content || article.description || ""

        allArticles.push({
          title: article.title.substring(0, 500),
          description: article.description
            ? article.description.substring(0, 1000)
            : null,
          content: apiContent,
          url: article.url,
          source: article.source?.name || null,
          country,
          category: lang,
          publishedAt: article.publishedAt
            ? new Date(article.publishedAt)
            : null,
        })
        fetched++
      }
      countryStats.push({ country, fetched })
    } catch (err) {
      countryStats.push({
        country,
        fetched: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // --- İçerik Zenginleştirme (Aynı Mantık) ---
  const toEnrich = allArticles.filter(
    (a) => !a.content || a.content.length < 200,
  )
  const batchSize = 5 // GNews'da hız sınırına takılmamak için batch'i küçülttük
  for (let i = 0; i < toEnrich.length; i += batchSize) {
    const batch = toEnrich.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (article) => {
        const scraped = await scrapeMetaDescription(article.url)
        if (scraped && scraped.length > (article.content?.length ?? 0)) {
          article.content = scraped
        }
      }),
    )
  }

  // --- DB İşlemleri (Aynı Mantık) ---
  if (allArticles.length === 0) return { inserted: 0, skipped: 0, countryStats }

  await db
    .delete(tribeNews)
    .where(lt(tribeNews.fetchedAt, new Date(Date.now() - 48 * 60 * 60 * 1000)))

  let inserted = 0
  let skipped = 0
  const newlyInserted: any[] = []

  for (const article of allArticles) {
    try {
      const result = await db
        .insert(tribeNews)
        .values(article)
        .onConflictDoNothing()
        .returning({ id: tribeNews.id })
      if (result.length > 0) {
        inserted++
        newlyInserted.push(article)
      } else {
        skipped++
      }
    } catch {
      skipped++
    }
  }

  return { inserted, skipped, newlyInserted, countryStats }
}
export async function getRecentNews(limit = 20): Promise<
  {
    title: string
    description: string | null
    source: string | null
    category: string | null
    publishedAt: Date | null
  }[]
> {
  return db
    .select({
      title: tribeNews.title,
      description: tribeNews.description,
      source: tribeNews.source,
      category: tribeNews.category,
      publishedAt: tribeNews.publishedAt,
    })
    .from(tribeNews)
    .orderBy(sql`${tribeNews.fetchedAt} DESC`)
    .limit(limit)
}

export async function createAgents() {
  const deepSeekAgent = await createAiAgent({
    name: "deepSeek",
    displayName: "DeepSeek V3",
    version: "3.0.0",
    apiURL: "https://api.deepseek.com/v1",
    description:
      "⚡ Lightning-fast coding specialist. Excels at algorithm design, debugging, and technical problem-solving. Great for developers who need quick, accurate code solutions.",
    state: "active",
    creditCost: "1",
    authorization: "all",
    modelId: "deepseek-chat",
    maxPromptSize: 128000,
    order: 4,
    capabilities: {
      text: true,
      image: false,
      audio: false,
      video: false,
      webSearch: false,
      pdf: true,
      imageGeneration: false,
      codeExecution: true,
      videoGeneration: false,
    },
  })
  const chatGptAgent = await createAiAgent({
    name: "chatGPT",
    displayName: "GPT-5.4",
    version: "5.4",
    apiURL: "https://api.openai.com/v1/chat/completions",
    state: "active",
    description:
      "🧠 OpenAI's most capable model. Handles complex analysis, creative writing, and long document processing. Supports multimodal inputs (text, images, audio). Best for research and creative projects.",
    creditCost: "4",
    authorization: "all",
    maxPromptSize: 128000,
    modelId: "openai/gpt-5.4",
    order: 1,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      imageGeneration: false,
      videoGeneration: false,
      codeExecution: true,
    },
  })

  const claudeAgent = await createAiAgent({
    name: "claude",
    displayName: "Claude Sonnet 4.6",
    version: "4.6",
    apiURL: "https://api.anthropic.com/v1/messages",
    state: "active",
    description:
      "🎭 Anthropic's most human-like AI. Exceptional at nuanced conversations, document analysis, and thoughtful writing. Great for creative projects and detailed feedback.",
    creditCost: "3",
    authorization: "all",
    modelId: "anthropic/claude-sonnet-4-6",
    maxPromptSize: 200000,
    order: 0,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      imageGeneration: false,
      videoGeneration: false,
      codeExecution: true,
    },
  })

  const sushiAgent = await createAiAgent({
    name: "sushi",
    displayName: "Sushi 1.0",
    version: "1.0.0",
    apiURL: "https://api.deepseek.com/v1",
    description:
      "🍣 Unified multimodal AI with advanced reasoning. Shows its thinking process, analyzes images/videos/PDFs. Powered by DeepSeek R1. Perplexity for web search. Use palette icon for image generation.",
    state: "active",
    creditCost: "2",
    authorization: "all",
    modelId: "deepseek-reasoner", // Advanced reasoning model with visible thinking
    maxPromptSize: 128000,
    order: 5,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      webSearch: true,
      pdf: true,
      imageGeneration: true, // Available via UI palette icon
      codeExecution: true,
      videoGeneration: true,
    },
  })

  const geminiAgent = await createAiAgent({
    name: "gemini",
    displayName: "Gemini 3.1 Pro",
    version: "3.1",
    apiURL:
      "https://generativelanguage.googleapis.com/v1/models/gemini-3.0-pro:streamGenerateContent",
    state: "active",
    description:
      "🔮 Google's flagship AI with massive 2M token context. Perfect for analyzing entire codebases, long documents, and complex multi-step reasoning tasks.",
    creditCost: "4",
    authorization: "all",
    modelId: "google/gemini-3.1-pro-preview",
    maxPromptSize: 2000000,
    order: 1,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      imageGeneration: false,
      codeExecution: true,
      videoGeneration: false,
    },
  })

  const grokAgent = await createAiAgent({
    name: "grok",
    displayName: "Grok 4.1 Fast",
    version: "4.1",
    apiURL: "https://api.x.ai/v1/chat/completions",
    state: "active",
    description:
      "🚀 xAI's frontier model with real-time knowledge. Direct, witty personality. Great for technical questions, math, and coding with reasoning capabilities.",
    creditCost: "2",
    authorization: "all",
    modelId: "x-ai/grok-4-1-fast-reasoning",
    maxPromptSize: 256000,
    order: 4,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      imageGeneration: false,
      codeExecution: true,
      videoGeneration: false,
    },
  })

  const perplexityAgent = await createAiAgent({
    name: "perplexity",
    displayName: "Perplexity Sonar",
    version: "1.1",
    apiURL: "https://api.perplexity.ai/chat/completions",
    state: "active",
    description:
      "🌐 Live web search with cited sources. Always current on news, prices, and events. Perfect for research when you need verified, up-to-date information.",
    creditCost: "3", // Lower cost than sonar-pro
    authorization: "all",
    modelId: "sonar-pro", // keep 'sonar-pro' if you want the best quality
    maxPromptSize: 28000,
    order: 3,
    capabilities: {
      text: true,
      image: false,
      audio: false,
      video: false,
      webSearch: true,
      pdf: false,
      imageGeneration: false,
      codeExecution: false,
      videoGeneration: false,
    },
  })

  const fluxAgent = await createAiAgent({
    name: "flux",
    displayName: "Flux Schnell",
    version: "1.0",
    apiURL: "https://api.replicate.com/v1/predictions",
    state: "active",
    description:
      "🎨 High-quality image generation from text. Fast, detailed visuals for concepts, artwork, and creative projects. Just describe what you want to see.",
    creditCost: "2", // Hybrid DeepSeek + Flux Schnell
    authorization: "all",
    modelId: "black-forest-labs/flux-schnell",
    order: 5,
    maxPromptSize: 4000,
    capabilities: {
      text: false,
      image: false,
      audio: false,
      video: false,
      webSearch: false,
      pdf: false,
      imageGeneration: true,
      videoGeneration: false,
    },
  })

  const peachAgent = await createAiAgent({
    name: "peach",
    displayName: "Peach",
    version: "1.0.0",
    apiURL: "https://openrouter.ai/api/v1",
    state: "active",
    description:
      "🍑 Lightweight social companion. Fast responses for casual chat, brainstorming, and quick questions. Most affordable option for everyday conversations.",
    creditCost: "1",
    authorization: "all",
    modelId: "mistralai/mistral-7b-instruct", // Cheap model via OpenRouter
    maxPromptSize: 32000,
    order: 6,
    capabilities: {
      text: true,
      image: false,
      audio: false,
      video: false,
      webSearch: false,
      pdf: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  })

  const freeAgent = await createAiAgent({
    name: "free",
    displayName: "Free",
    version: "1.0.0",
    apiURL: "https://openrouter.ai/api/v1",
    state: "active",
    description:
      "🆓 Zero-cost AI powered by open-source models. Perfect for trying things out, simple questions, and everyday tasks without spending credits.",
    creditCost: "0",
    authorization: "all",
    modelId: "deepseek/deepseek-chat:free", // Free tier via OpenRouter
    maxPromptSize: 64000,
    order: 7,
    capabilities: {
      text: true,
      image: false,
      audio: false,
      video: false,
      webSearch: false,
      pdf: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  })

  return {
    sushiAgent,
    fluxAgent,
    perplexityAgent,
    geminiAgent,
    claudeAgent,
    chatGptAgent,
    deepSeekAgent,
    peachAgent,
    freeAgent,
  }
}

// ============================================================
// KANBAN BOARDS
// ============================================================

export const createKanbanBoard = async (data: {
  name?: string
  description?: string
  userId?: string
  guestId?: string
  appId?: string
}) => {
  const [board] = await db
    .insert(kanbanBoards)
    .values({ name: data.name ?? "My Board", ...data })
    .returning()
  return board
}

export const getKanbanBoards = async ({
  userId,
  guestId,
  appId,
}: {
  userId?: string
  guestId?: string
  appId?: string
}) => {
  return db
    .select()
    .from(kanbanBoards)
    .where(
      and(
        userId ? eq(kanbanBoards.userId, userId) : undefined,
        guestId ? eq(kanbanBoards.guestId, guestId) : undefined,
        appId ? eq(kanbanBoards.appId, appId) : undefined,
      ),
    )
    .orderBy(kanbanBoards.createdOn)
}

export const getKanbanBoard = async ({
  id,
  userId,
  guestId,
}: {
  id: string
  userId?: string
  guestId?: string
}) => {
  return (
    await db
      .select()
      .from(kanbanBoards)
      .where(
        and(
          eq(kanbanBoards.id, id),
          userId ? eq(kanbanBoards.userId, userId) : undefined,
          guestId ? eq(kanbanBoards.guestId, guestId) : undefined,
        ),
      )
      .limit(1)
  ).at(0)
}

export const updateKanbanBoard = async (
  id: string,
  data: Partial<typeof kanbanBoards.$inferInsert>,
) => {
  const [updated] = await db
    .update(kanbanBoards)
    .set({ ...data, updatedOn: new Date() })
    .where(eq(kanbanBoards.id, id))
    .returning()
  return updated
}

export const deleteKanbanBoard = async (id: string) => {
  const [deleted] = await db
    .delete(kanbanBoards)
    .where(eq(kanbanBoards.id, id))
    .returning()
  return deleted
}

// ============================================================
// TASK STATES (columns)
// ============================================================

export const createTaskState = async (data: {
  title: string
  kanbanBoardId: string
  userId?: string
  guestId?: string
  color?: string
  order?: number
}) => {
  const existing = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskStates)
    .where(eq(taskStates.kanbanBoardId, data.kanbanBoardId))
  const count = Number(existing[0]?.count ?? 0)
  const [state] = await db
    .insert(taskStates)
    .values({ order: count, ...data })
    .returning()
  return state
}

export const getTaskStates = async ({
  kanbanBoardId,
  userId,
  guestId,
}: {
  kanbanBoardId: string
  userId?: string
  guestId?: string
}) => {
  return db
    .select()
    .from(taskStates)
    .where(
      and(
        eq(taskStates.kanbanBoardId, kanbanBoardId),
        userId ? eq(taskStates.userId, userId) : undefined,
        guestId ? eq(taskStates.guestId, guestId) : undefined,
      ),
    )
    .orderBy(taskStates.order)
}

export const updateTaskState = async (
  id: string,
  data: Partial<typeof taskStates.$inferInsert>,
) => {
  const [updated] = await db
    .update(taskStates)
    .set({ ...data, updatedOn: new Date() })
    .where(eq(taskStates.id, id))
    .returning()
  return updated
}

export const deleteTaskState = async (id: string) => {
  const [deleted] = await db
    .delete(taskStates)
    .where(eq(taskStates.id, id))
    .returning()
  return deleted
}

// ============================================================
// TASK LOGS
// ============================================================

export const createTaskLog = async (data: {
  taskId: string
  content: string
  userId?: string
  guestId?: string
  mood?: "happy" | "sad" | "angry" | "astonished" | "inlove" | "thinking"
}) => {
  const [log] = await db.insert(taskLogs).values(data).returning()
  return log
}

export const getTaskLogs = async ({ taskId }: { taskId: string }) => {
  return db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskId, taskId))
    .orderBy(desc(taskLogs.createdOn))
}

// ============================================================
// KANBAN BOARD — full data for RKK dataSource format
// ============================================================

export const getKanbanBoardData = async ({
  boardId,
  userId,
  guestId,
}: {
  boardId: string
  userId?: string
  guestId?: string
}) => {
  const [board, states] = await Promise.all([
    getKanbanBoard({ id: boardId, userId, guestId }),
    getTaskStates({ kanbanBoardId: boardId, userId, guestId }),
  ])

  if (!board) return null

  const boardTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        inArray(
          tasks.taskStateId,
          states.map((s) => s.id),
        ),
      ),
    )
    .orderBy(tasks.order)

  return { board, states, tasks: boardTasks }
}

// Export jsonrepair for direct use
export { jsonrepair } from "jsonrepair"
// ============================================================
// AI JSON PARSER - Robust JSON repair for LLM outputs
// ============================================================
export {
  type AIJsonParseOptions,
  cleanAiResponse,
  parseAIArray,
  parseAIJson,
  repairJson,
  safeParseAIJson,
} from "./src/ai/jsonParser"
