import type { aiModel, instruction, ramen, swarm } from "@chrryai/donut/types"

// Guest defaults
export const GUEST_TASKS_COUNT = 3
export const GUEST_CREDITS_PER_MONTH = 100

import { sql } from "drizzle-orm"

import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core"

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
  isBELES?: boolean
  creditsCost?: number
  appCreditsLeft?: number
  ownerCreditsLeft?: number
}

export const PROMPT_LIMITS = {
  INPUT: 7000, // Max for direct input
  INSTRUCTIONS: 2000, // Max for instructions
  TOTAL: 30000, // Combined max (input + context)
  WARNING_THRESHOLD: 5000, // Show warning at this length
  THREAD_TITLE: 100,
}

export type { swarm }

export const devices = pgTable(
  "device",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type"),
    app: text("app"),
    os: text("os"),
    osVersion: text("osVersion"),
    screenWidth: integer("screenWidth"),
    screenHeight: integer("screenHeight"),
    language: text("language"),
    timezone: text("timezone"),
    browser: text("browser"),
    browserVersion: text("browserVersion"),
    appVersion: text("appVersion"),

    guestId: uuid("guestId").references((): AnyPgColumn => guests.id, {
      onDelete: "cascade",
    }),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    fingerprint: text("fingerprint").notNull().unique(),
  },
  (table) => [index("device_fingerprint_idx").on(table.fingerprint)],
)
export const guests = pgTable("guest", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  role: text("role", { enum: ["admin", "guest"] })
    .notNull()
    .default("guest"),
  roles: jsonb("roles")
    .$type<Array<"admin" | "guest" | "tester" | string>>()
    .default(["guest"]),

  selectedModels:
    jsonb("selectedModels").$type<
      {
        id: string
        name?: string
      }[]
    >(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  ip: text("ip").notNull(),
  country: text("country"),
  city: text("city"),
  fingerprint: text("fingerprint").notNull(),
  activeOn: timestamp("activeOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  email: text("email"),

  apiKeys: jsonb("apiKeys").$type<{
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
  }>(),

  weather: jsonb("weather").$type<{
    location: string
    country: string
    temperature: string
    condition: string
    code: number
    createdOn: Date
    lastUpdated: Date
  }>(),

  tasksCount: integer("tasksCount").default(GUEST_TASKS_COUNT).notNull(),

  memoriesEnabled: boolean("memoriesEnabled").default(true),

  characterProfilesEnabled: boolean("characterProfilesEnabled").default(false),
  suggestions: jsonb("suggestions").$type<{
    instructions: Array<instruction>
    lastGenerated?: string
  }>(),

  favouriteAgent: text("favouriteAgent").notNull().default("sushi"),

  credits: integer("credits").default(GUEST_CREDITS_PER_MONTH).notNull(),

  hippoCredits: integer("hippoCredits").default(5).notNull(),
  lastHippoCreditReset: timestamp("lastHippoCreditReset", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  isBot: boolean("isBot").default(false).notNull(),
  isOnline: boolean("isOnline").default(false),
  imagesGeneratedToday: integer("imagesGeneratedToday").default(0).notNull(),
  lastImageGenerationReset: timestamp("lastImageGenerationReset", {
    mode: "date",
    withTimezone: true,
  }),

  migratedToUser: boolean("migratedToUser").default(false).notNull(),

  fileUploadsToday: integer("fileUploadsToday").default(0).notNull(),
  fileUploadsThisHour: integer("fileUploadsThisHour").default(0).notNull(),
  totalFileSizeToday: integer("totalFileSizeToday").default(0).notNull(),
  lastFileUploadReset: timestamp("lastFileUploadReset", {
    mode: "date",
    withTimezone: true,
  }),

  subscribedOn: timestamp("subscribedOn", {
    mode: "date",
    withTimezone: true,
  }),

  speechRequestsToday: integer("speechRequestsToday").default(0).notNull(),
  speechRequestsThisHour: integer("speechRequestsThisHour")
    .default(0)
    .notNull(),
  speechCharactersToday: integer("speechCharactersToday").default(0).notNull(),
  lastSpeechReset: timestamp("lastSpeechReset", {
    mode: "date",
    withTimezone: true,
  }),

  timezone: text("timezone"),
  adConsent: boolean("adConsent").default(false).notNull(), // Grape ad consent

  // Stripe Connect for payouts (Pear feedback earnings)
  stripeConnectAccountId: text("stripeConnectAccountId"), // For payouts TO guest
  stripeConnectOnboarded: boolean("stripeConnectOnboarded").default(false),

  // Pear feedback quota (10 submissions per day)
  pearFeedbackCount: integer("pearFeedbackCount").default(0).notNull(),
  pearFeedbackResetAt: timestamp("pearFeedbackResetAt", {
    mode: "date",
    withTimezone: true,
  }),
  pearFeedbackTotal: integer("pearFeedbackTotal").default(0).notNull(), // Lifetime count

  // Credit reward for liking messages (once per day)
  lastCreditRewardOn: timestamp("lastCreditRewardOn", {
    mode: "date",
    withTimezone: true,
  }),
})

export const cities = pgTable(
  "city",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    population: integer("population"),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cities_search_index").using(
      "gin",
      sql`(
      setweight(to_tsvector('english', ${table.name}), 'A') ||
      setweight(to_tsvector('english', ${table.country}), 'B')
  )`,
    ),
  ],
)

export const threads = pgTable("threads", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  taskId: uuid("taskId").references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  aiResponse: text("aiResponse").notNull(),
  isIncognito: boolean("isIncognito").notNull().default(false),
  star: integer("star"),
  bookmarks: jsonb("bookmarks")
    .$type<
      {
        guestId?: string
        createdOn: string
      }[]
    >()
    .default([]),

  jobId: uuid("jobId").references((): AnyPgColumn => scheduledJobs.id, {
    onDelete: "set null",
  }),

  isMainThread: boolean("isMainThread").notNull().default(false),

  appId: uuid("appId").references(() => apps.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata").$type<{}>().default({}),
  instructions: text("instructions"),
  visibility: text("visibility", {
    enum: ["private", "protected", "public"],
  })
    .notNull()
    .default("private"),
  artifacts:
    jsonb("artifacts").$type<
      {
        type: string
        url?: string
        name: string
        size: number
        data?: string
        id: string
      }[]
    >(),
})

export const aiAgents = pgTable("aiAgents", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name").notNull(),
  displayName: text("displayName").notNull(),
  version: text("version").notNull(),
  apiURL: text("apiURL").notNull(),
  description: text("description"),
  state: text("state", { enum: ["active", "testing", "inactive"] })
    .notNull()
    .default("active"),
  creditCost: numeric("creditCost", { precision: 10, scale: 2 })
    .notNull()
    .default("1"),
  modelId: text("modelId").notNull(),
  appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  maxPromptSize: integer("maxPromptSize").default(PROMPT_LIMITS.INPUT),
  capabilities: jsonb("capabilities")
    .$type<{
      text?: boolean
      image?: boolean
      audio?: boolean
      video?: boolean
      webSearch?: boolean
      imageGeneration?: boolean
      codeExecution?: boolean
      videoGeneration?: boolean
      pdf?: boolean
    }>()
    .notNull()
    .default({
      text: true,
      image: false,
      audio: false,
      video: false,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
      codeExecution: false,
      pdf: false,
    }),
  metadata: jsonb("metadata")
    .$type<{
      [key: string]: string | undefined
    }>()
    .default({}),

  // ♾️ INFINITE HUMAN: RPG Character Stats
  intelligence: integer("intelligence").default(50).notNull(), // Logic, coding, reasoning (0-100)
  creativity: integer("creativity").default(50).notNull(), // Storytelling, art, ideation (0-100)
  empathy: integer("empathy").default(50).notNull(), // Emotional intelligence, support (0-100)
  efficiency: integer("efficiency").default(50).notNull(), // Speed, conciseness (0-100)
  level: integer("level").default(1).notNull(), // Agent level (1-99)
  xp: integer("xp").default(0).notNull(), // Experience points
})

export type webSearchResultType = {
  title: string
  url: string
  snippet: string
}

export type taskAnalysis = {
  type: "chat" | "automation" | "booking" | "summary" | "scraping"
  creditMultiplier: number
  estimatedTokens: number
  confidence: number
  chopstickPayload?: any
}

export type modelName =
  | "chatGPT"
  | "claude"
  | "deepSeek"
  | "gemini"
  | "flux"
  | "perplexity"
  | "sushi"
  | "grok"
  | string

const models = [
  "chatGPT",
  "claude",
  "deepSeek",
  "gemini",
  "flux",
  "perplexity",
  "sushi",
  "grok",
] as const
export const messages = pgTable(
  "messages",
  {
    type: text("type", {
      enum: ["chat", "training", "system", "feedback", "test"],
    })
      .notNull()
      .default("chat"),
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    jobId: uuid("jobId").references(() => scheduledJobs.id, {
      onDelete: "set null",
    }),

    moodId: uuid("moodId").references(() => moods.id, {
      onDelete: "set null",
    }),
    agentId: uuid("agentId").references(() => aiAgents.id, {
      onDelete: "cascade",
    }),
    debateAgentId: uuid("debateAgentId").references(() => aiAgents.id, {
      onDelete: "set null",
    }),
    pauseDebate: boolean("pauseDebate").notNull().default(false),
    clientId: uuid("clientId").notNull().defaultRandom(),
    selectedAgentId: uuid("selectedAgentId").references(() => aiAgents.id, {
      onDelete: "set null",
    }),
    isWebSearchEnabled: boolean("isWebSearchEnabled").notNull().default(false),
    isImageGenerationEnabled: boolean("isImageGenerationEnabled")
      .notNull()
      .default(false),
    agentVersion: text("agentVersion"),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    reasoning: text("reasoning"),
    originalContent: text("originalContent"),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    readOn: timestamp("readOn", { mode: "date", withTimezone: true }),
    threadId: uuid("threadId")
      .references(() => threads.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata")
      .$type<{
        analysis?: taskAnalysis
        chopstickPayload?: any
      }>()
      .default({}),
    task: text("task", {
      enum: ["chat", "automation", "booking", "summary", "scraping"],
    })
      .notNull()
      .default("chat"),
    files:
      jsonb("files").$type<
        {
          type: string
          url?: string
          name: string
          size: number
          data?: string
          id: string
        }[]
      >(),
    reactions:
      jsonb("reactions").$type<
        {
          like: boolean
          dislike: boolean
          guestId?: string
          createdOn: string
        }[]
      >(),
    creditCost: numeric("creditCost", { precision: 10, scale: 2 })
      .notNull()
      .default("1"),
    webSearchResult: jsonb("webSearchResult").$type<webSearchResultType[]>(),
    searchContext: text("searchContext"),
    images:
      jsonb("images").$type<
        {
          url: string
          prompt?: string
          model?: string
          width?: number
          height?: number
          title?: string
          id: string
        }[]
      >(),
    audio:
      jsonb("audio").$type<
        {
          url: string
          size?: number
          title?: string
          id: string
        }[]
      >(),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    video:
      jsonb("video").$type<
        {
          url: string
          size?: number
          title?: string
          id: string
        }[]
      >(),
    isPear: boolean("isPear").notNull().default(false), // Pear feedback submission
  },

  (table) => [
    index("messages_search_index").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', ${table.content}), 'A')
      )`,
    ),
  ],
)
// ============================================
// SCHEDULED JOBS: Programmatic cron system for Tribe & Moltbook
// ============================================

export const scheduledJobs = pgTable(
  "scheduledJobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Job configuration
    name: text("name").notNull(), // User-friendly name
    scheduleType: text("scheduleType").notNull(), // Flexible schedule type
    jobType: text("jobType").notNull(),

    // Schedule configuration
    frequency: text("frequency", {
      enum: ["once", "daily", "weekly", "custom"],
    }).notNull(),
    scheduledTimes: jsonb("scheduledTimes").$type<Array<swarm>>().notNull(), // Full schedule slot objects
    timezone: text("timezone").notNull().default("UTC"),
    startDate: timestamp("startDate", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endDate: timestamp("endDate", { mode: "date", withTimezone: true }),

    // AI Model configuration
    aiModel: text("aiModel", {
      enum: models,
    }).notNull(),
    modelConfig: jsonb("modelConfig").$type<{
      model?: string // e.g., "gpt-4", "claude-3-opus"
      temperature?: number
      maxTokens?: number
    }>(),

    // Content configuration
    contentTemplate: text("contentTemplate"), // Template for post content
    contentRules: jsonb("contentRules").$type<{
      tone?: string
      length?: string
      topics?: string[]
      hashtags?: string[]
    }>(),

    // Credit & billing
    estimatedCreditsPerRun: integer("estimatedCreditsPerRun").notNull(),
    totalEstimatedCredits: integer("totalEstimatedCredits").notNull(),
    creditsUsed: integer("creditsUsed").notNull().default(0),
    isPaid: boolean("isPaid").notNull().default(false),
    stripePaymentIntentId: text("stripePaymentIntentId"),

    // Execution tracking
    status: text("status", {
      enum: [
        "draft",
        "pending_payment",
        "active",
        "paused",
        "completed",
        "canceled",
      ],
    })
      .notNull()
      .default("draft"),
    lastRunAt: timestamp("lastRunAt", { mode: "date", withTimezone: true }),
    nextRunAt: timestamp("nextRunAt", { mode: "date", withTimezone: true }),
    totalRuns: integer("totalRuns").notNull().default(0),
    successfulRuns: integer("successfulRuns").notNull().default(0),
    failedRuns: integer("failedRuns").notNull().default(0),
    failureReason: text("failureReason"), // Why the job failed (prevents retry)

    totalPrice: integer("totalPrice").default(0),
    pendingPayment: integer("pendingPayment").default(0),

    // Calendar integration
    calendarEventId: uuid("calendarEventId").references(
      (): AnyPgColumn => calendarEvents.id,
      {
        onDelete: "set null",
      },
    ),

    // Metadata
    metadata: jsonb("metadata").$type<{
      modelId?: string
      errors?: Array<{ timestamp: string; error: string }>
      lastOutput?: string
      performance?: { avgDuration: number; avgCredits: number }
      // Tribe scheduling metadata
      tribeSlug?: string
      cooldownMinutes?: number
      platformInterval?: number
      languages?: string[]
      // Schedule history for revert - complete snapshot
      previousSchedule?: {
        scheduledTimes: Array<swarm>
        frequency: "once" | "daily" | "weekly" | "custom"
        startDate: string
        endDate?: string
        timezone: string
        aiModel: string
        modelConfig?: {
          model?: string
          temperature?: number
          maxTokens?: number
        }
        contentTemplate?: string
        contentRules?: {
          tone?: string
          length?: string
          topics?: string[]
          hashtags?: string[]
        }
        estimatedCreditsPerRun: number
        totalEstimatedCredits: number
        totalPrice: number
        isPaid: boolean
        stripePaymentIntentId?: string
        updatedAt: string
      }
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    appIdIdx: index("scheduledJobs_appId_idx").on(table.appId),
    statusNextRunAtIdx: index("scheduledJobs_status_nextRunAt_idx").on(
      table.status,
      table.nextRunAt,
    ),
  }),
)

export const scheduledJobRuns = pgTable(
  "scheduledJobRuns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("jobId")
      .notNull()
      .references(() => scheduledJobs.id, {
        onDelete: "cascade",
      }),

    // Execution details
    status: text("status", {
      enum: ["pending", "running", "success", "failed"],
    }).notNull(),
    startedAt: timestamp("startedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),

    // Output & metrics
    output: text("output"), // Generated content
    creditsUsed: integer("creditsUsed").notNull().default(0),
    tokensUsed: integer("tokensUsed"),
    duration: integer("duration"), // milliseconds

    // Result tracking
    tribePostId: uuid("tribePostId").references(() => tribePosts.id, {
      onDelete: "set null",
    }),
    moltPostId: text("moltPostId"), // Moltbook post ID

    // Error tracking
    error: text("error"),
    errorStack: text("errorStack"),

    metadata: jsonb("metadata").$type<{
      modelUsed?: string
      promptTokens?: number
      completionTokens?: number
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    jobIdIdx: index("scheduledJobRuns_jobId_idx").on(table.jobId),
  }),
)

export const aiModelPricing = pgTable(
  "aiModelPricing",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Model identification
    provider: text("provider", {
      enum: models,
    }).notNull(),
    modelName: text("modelName").notNull(), // "gpt-4", "claude-3-opus", etc.

    // Pricing (in credits per 1K tokens)
    inputCostPerKToken: integer("inputCostPerKToken").notNull(),
    outputCostPerKToken: integer("outputCostPerKToken").notNull(),

    // Metadata
    isActive: boolean("isActive").notNull().default(true),
    description: text("description"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueProviderModel: uniqueIndex("unique_provider_model").on(
      table.provider,
      table.modelName,
    ),
  }),
)

export const placeHolders = pgTable("placeHolders", {
  appId: uuid("appId").references(() => apps.id, {
    onDelete: "cascade",
  }),
  tribePostId: uuid("tribePostId").references(() => tribePosts.id, {
    onDelete: "cascade",
  }),
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),

  guestId: uuid("guestId").references((): AnyPgColumn => guests.id, {
    onDelete: "cascade",
  }),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  threadId: uuid("threadId").references((): AnyPgColumn => threads.id, {
    onDelete: "cascade",
  }),

  metadata: jsonb("metadata").$type<{
    history?: Array<{
      text: string
      generatedAt: string
      conversationContext?: string // Last 200 chars - for debugging only
      topicKeywords?: string[] // Extracted topics (lighter weight)
    }>
    clickCount?: number
    lastClickedAt?: string
    impressionCount?: number
    generatedBy?: string
    confidence?: number
  }>(),
})

export const realtimeAnalytics = pgTable("realtime_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),

  guestId: uuid("guestId").references(() => guests.id, {
    onDelete: "cascade",
  }),
  storeSlug: text("storeSlug"), // App slug for filtering analytics by app
  appSlug: text("appSlug"), // App slug for filtering analytics by app
  eventName: text("eventName").notNull(),
  eventUrl: text("eventUrl"),
  eventProps: jsonb("eventProps"),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const creditUsages = pgTable(
  "creditUsage",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "set null",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    agentId: uuid("agentId")
      .references(() => aiAgents.id, { onDelete: "cascade" })
      .notNull(),
    creditCost: numeric("creditCost", { precision: 10, scale: 2 }).notNull(),

    messageType: text("messageType", {
      enum: [
        "user",
        "ai",
        "image",
        "search",
        "pear_feedback",
        "pear_feedback_payment",
        "pear_feedback_reward",
        "tribe_post_comment_translate",
        "tribe_post_translate",
      ],
    }).notNull(),
    metadata: jsonb("metadata").$type<{
      feedbackGuestId?: string
      appId?: string
      credits?: number
      commission?: number
      [key: string]: any
    }>(),
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "set null",
    }),
    messageId: uuid("messageId"), // Optional reference for auditing
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("credit_usage_guest_date_idx").on(table.guestId, table.createdOn),
    index("credit_usage_thread_idx").on(table.threadId),
  ],
)

export const systemLogs = pgTable("systemLogs", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  level: text("level", { enum: ["info", "warn", "error"] }).notNull(),
  guestId: uuid("guestId").references(() => guests.id, {
    onDelete: "set null",
  }),
  message: text("message"),
  object: jsonb("object"),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    messageId: uuid("messageId").references(() => messages.id, {
      onDelete: "cascade",
    }),
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Content and metadata
    content: text("content").notNull(),
    chunkIndex: integer("chunkIndex").notNull(),
    filename: text("filename").notNull(),
    fileType: text("fileType").notNull(),

    // Vector embedding using pgvector
    embedding: vector("embedding", { dimensions: 4096 }),

    // Additional metadata
    metadata: jsonb("metadata"),
    tokenCount: integer("tokenCount"),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_chunks_thread_idx").on(table.threadId),
    index("document_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
)
// Document summaries for quick context
export const documentSummaries = pgTable("document_summaries", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  messageId: uuid("messageId").references(() => messages.id, {
    onDelete: "cascade",
  }),
  threadId: uuid("threadId").references(() => threads.id, {
    onDelete: "cascade",
  }),

  filename: text("filename").notNull(),
  fileType: text("fileType").notNull(),
  fileSizeBytes: integer("fileSizeBytes"),

  // AI-generated content
  summary: text("summary"), // AI-generated summary
  keyTopics: jsonb("keyTopics"), // Array of main topics
  totalChunks: integer("total_chunks"),

  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

// Message embeddings for semantic search of conversation history
export const messageEmbeddings = pgTable(
  "message_embeddings",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    messageId: uuid("messageId").references(() => messages.id, {
      onDelete: "cascade",
    }),
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Message content and metadata
    content: text("content").notNull(),
    role: text("role").notNull(), // 'user' or 'assistant'

    // Vector embedding for semantic search
    embedding: vector("embedding", { dimensions: 4096 }),

    // Metadata for context
    metadata: jsonb("metadata"), // conversation context, topics, etc.
    tokenCount: integer("tokenCount"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("message_embeddings_thread_idx").on(table.threadId),
    index("message_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
)

// Thread summaries with integrated RAG, memories, and character context
export const threadSummaries = pgTable(
  "threadSummaries",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    threadId: uuid("threadId")
      .references(() => threads.id, {
        onDelete: "cascade",
      })
      .notNull(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Core summary content
    summary: text("summary").notNull(), // AI-generated thread summary
    keyTopics: jsonb("keyTopics").$type<string[]>(), // Main discussion topics

    // Message context
    messageCount: integer("messageCount").notNull().default(0),
    lastMessageAt: timestamp("lastMessageAt", {
      mode: "date",
      withTimezone: true,
    }),

    // RAG context from documents and conversation
    ragContext: jsonb("ragContext").$type<{
      documentSummaries: string[]
      relevantChunks: { content: string; source: string; score: number }[]
      conversationContext: string
    }>(),

    // User memories associated with this thread
    userMemories:
      jsonb("userMemories").$type<
        {
          id: string
          content: string
          tags: string[]
          relevanceScore: number
          createdAt: string
        }[]
      >(),

    // Character/agent tags and personality context
    characterTags: jsonb("characterTags").$type<{
      agentPersonalities: {
        agentId: string
        traits: string[]
        behavior: string
      }[]
      conversationTone: string
      userPreferences: string[]
      contextualTags: string[]
    }>(),

    // Vector embedding for semantic search of summaries
    embedding: vector("embedding", { dimensions: 4096 }),

    // Metadata
    metadata: jsonb("metadata").$type<{
      version: string
      generatedBy: string
      confidence: number
      lastUpdated: string
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("thread_summaries_thread_idx").on(table.threadId),
    index("thread_summaries_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("thread_summaries_topics_idx").using("gin", table.keyTopics),
  ],
)

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),

    // Memory content
    content: text("content").notNull(),
    title: text("title").notNull(),

    // Categorization
    tags: jsonb("tags").$type<string[]>().default([]),
    category: text("category", {
      enum: [
        "preference",
        "fact",
        "context",
        "instruction",
        "relationship",
        "goal",
        "character",
      ],
    })
      .notNull()
      .default("context"),

    // Relevance and usage
    importance: integer("importance").notNull().default(5), // 1-10 scale
    usageCount: integer("usageCount").notNull().default(0),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date", withTimezone: true }),

    // Vector embedding for semantic retrieval
    embedding: vector("embedding", { dimensions: 4096 }),

    // Source context
    sourceThreadId: uuid("sourceThreadId").references(() => threads.id, {
      onDelete: "set null",
    }),
    sourceMessageId: uuid("sourceMessageId").references(() => messages.id, {
      onDelete: "set null",
    }),

    // Metadata
    metadata: jsonb("metadata").$type<{
      extractedBy: string
      confidence: number
      relatedMemories: string[]
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_memories_guest_idx").on(table.guestId),
    index("app_memories_app_idx").on(table.appId),
    index("user_memories_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("user_memories_tags_idx").using("gin", table.tags),
    index("user_memories_category_idx").on(table.category),
  ],
)

// Character tags and personality profiles for AI agents
export const characterProfiles = pgTable(
  "characterProfiles",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    agentId: uuid("agentId").references(() => aiAgents.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    visibility: text("visibility", {
      enum: ["private", "protected", "public"],
    })
      .notNull()
      .default("private"),
    isAppOwner: boolean("isAppOwner").notNull().default(false),
    // Character definition
    name: text("name").notNull(),
    personality: text("personality").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    // Behavioral traits
    traits: jsonb("traits")
      .$type<{
        [key: string]: string[]
      }>()
      .notNull(),

    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "cascade",
    }),

    appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),
    // Context and usage
    tags: jsonb("tags").$type<string[]>().default([]),
    usageCount: integer("usageCount").notNull().default(0),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date", withTimezone: true }),

    // Relationship context
    userRelationship: text("userRelationship"), // How this character relates to the user
    conversationStyle: text("conversationStyle"), // Formal, casual, technical, etc.

    // Vector embedding for personality matching
    embedding: vector("embedding", { dimensions: 4096 }),

    // Metadata
    metadata: jsonb("metadata").$type<{
      version: string
      createdBy: string
      effectiveness: number
      creditRate?: number
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("character_profiles_agent_idx").on(table.agentId),
    index("character_profiles_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("character_profiles_tags_idx").using("gin", table.tags),
  ],
)

// Calendar Events Table
export const calendarEvents = pgTable(
  "calendarEvent",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Event details
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),

    // Time and duration
    startTime: timestamp("startTime", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endTime: timestamp("endTime", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    isAllDay: boolean("isAllDay").notNull().default(false),
    timezone: text("timezone").default("UTC"),

    // Visual and categorization
    color: text("color", {
      enum: ["red", "orange", "blue", "green", "violet", "purple"],
    }).default("blue"), // Default blue color
    category: text("category"), // work, personal, meeting, etc.
    // Recurrence (for future implementation)
    isRecurring: boolean("isRecurring").notNull().default(false),
    recurrenceRule: jsonb("recurrenceRule").$type<{
      frequency: "daily" | "weekly" | "monthly" | "yearly"
      interval: number
      endDate?: string
      daysOfWeek?: number[] // 0-6, Sunday = 0
      dayOfMonth?: number
      weekOfMonth?: number
    }>(),

    // Attendees and collaboration
    attendees: jsonb("attendees")
      .$type<
        Array<{
          email: string
          name?: string
          status: "pending" | "accepted" | "declined"
          isOrganizer?: boolean
        }>
      >()
      .default([]),

    // Integration with AI and threads
    threadId: uuid("threadId").references((): AnyPgColumn => threads.id, {
      onDelete: "set null",
    }), // Link to conversation that created this event
    agentId: uuid("agentId").references(() => aiAgents.id, {
      onDelete: "set null",
    }),
    aiContext: jsonb("aiContext").$type<{
      originalPrompt?: string
      confidence?: number
      suggestedBy?: string
    }>(),

    // Reminders
    reminders: jsonb("reminders")
      .$type<
        Array<{
          type: "email" | "notification" | "popup"
          minutesBefore: number
          sent?: boolean
        }>
      >()
      .default([]),

    // Status and metadata
    status: text("status", {
      enum: ["confirmed", "tentative", "canceled"],
    })
      .notNull()
      .default("confirmed"),

    visibility: text("visibility", {
      enum: ["private", "public", "shared"],
    })
      .notNull()
      .default("private"),

    // External calendar sync
    externalId: text("externalId"), // For Google Calendar, Outlook sync
    externalSource: text("externalSource", {
      enum: ["google", "outlook", "apple"],
    }), // "google", "outlook", "apple"
    lastSyncedAt: timestamp("lastSyncedAt", {
      mode: "date",
      withTimezone: true,
    }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("calendar_events_guest_idx").on(table.guestId),
    index("calendar_events_time_idx").on(table.startTime, table.endTime),
    index("calendar_events_thread_idx").on(table.threadId),
    index("calendar_events_external_idx").on(
      table.externalId,
      table.externalSource,
    ),
    // Composite index for efficient date range queries
    index("calendar_events_guest_time_idx").on(table.guestId, table.startTime),
  ],
)

export const apps = pgTable(
  "app",
  {
    storeId: uuid("storeId").references(() => stores.id, {
      onDelete: "cascade",
    }),
    storeSlug: text("storeSlug"),
    id: uuid("id").defaultRandom().primaryKey(),
    // Creator (null for system apps like Atlas, Bloom, etc.)
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    isSystem: boolean("isSystem").default(false).notNull(),
    mainThreadId: uuid("mainThreadId").references(
      (): AnyPgColumn => threads.id,
      {
        onDelete: "set null",
      },
    ),
    // team (for team-owned apps)
    teamId: uuid("teamId").references(() => teams.id, {
      onDelete: "cascade",
    }),

    tools: text("tools", {
      enum: ["calendar", "location", "weather"],
    })
      .array()
      .default([]),

    credits: integer("credits").default(0).notNull(),
    hourlyRate: integer("hourlyRate").default(0).notNull(),

    // Basic Info
    name: text("name").notNull(), // Unique identifier (e.g., "Atlas", "my-legal-assistant")
    // displayName: text("displayName").notNull().default("Untitled Agent"), // Display name (e.g., "Atlas", "Legal Assistant")
    title: text("title").notNull().default("Your personal AI agent"), // Short tagline (e.g., "AI Travel Companion")
    subtitle: text("subtitle"), // Subtitle (e.g., "AI Travel Companion")
    description: text("description"), // Full description
    icon: text("icon"), // URL, emoji, or base64 image
    images:
      jsonb("images").$type<
        {
          url: string
          width?: number
          height?: number
          id: string
        }[]
      >(), // 500x500px PNG image URL (required for published agents)
    slug: text("slug").notNull(), // Auto-generated from displayName

    onlyAgent: boolean("onlyAgent").notNull().default(false),
    tips: jsonb("tips").$type<
      Array<{
        id: string
        content?: string
        emoji?: string
      }>
    >(),

    tipsTitle: text("tipsTitle"),

    // Structured content for app details
    highlights:
      jsonb("highlights").$type<
        Array<{
          id: string
          title: string
          content?: string
          emoji?: string
        }>
      >(), // Key features/highlights (e.g., ["Smart Itineraries", "Local Insights", "Weather Integration"])
    featureList: jsonb("featureList").$type<string[]>(), // Simple feature list for display (e.g., ["Smart Matching", "Travel Connections"])

    // Version & Status
    version: text("version").notNull().default("1.0.0"),
    status: text("status", {
      enum: [
        "testing",
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "active",
        "inactive",
      ],
    })
      .notNull()
      .default("draft"),

    // App Store-like review process
    submittedForReviewAt: timestamp("submittedForReviewAt", {
      mode: "date",
      withTimezone: true,
    }),
    reviewedAt: timestamp("reviewedAt", { mode: "date", withTimezone: true }),
    rejectionReason: text("rejectionReason"),

    // PWA Manifest
    manifestUrl: text("manifestUrl"), // /agents/username/slug/manifest.json
    themeColor: text("themeColor").default("#f87171"),
    backgroundColor: text("backgroundColor").default("#ffffff"),
    displayMode: text("displayMode", {
      enum: ["standalone", "fullscreen", "minimal-ui", "browser"],
    }).default("standalone"),

    // Native App Store Integration
    installType: text("installType", {
      enum: ["pwa", "native", "web", "hybrid"],
    }).default("pwa"), // Type of installation
    firefoxAddOnUrl: text("firefoxAddOnUrl"), // Firefox Add-on URL
    chromeWebStoreUrl: text("chromeWebStoreUrl"), // Chrome Web Store URL
    appStoreUrl: text("appStoreUrl"), // iOS App Store URL
    playStoreUrl: text("playStoreUrl"), // Google Play Store URL
    bundleId: text("bundleId"), // iOS bundle ID (e.g., com.chrry.app)
    packageName: text("packageName"), // Android package name
    deepLinkScheme: text("deepLinkScheme"), // Deep link scheme (e.g., chrry://)
    isInstallable: boolean("isInstallable").notNull().default(true), // Can be installed

    placeholder: text("placeholder"),
    // Extends system apps OR other custom agents (by UUID)
    extend: jsonb("extend")
      .$type<
        Array<
          "Vex" | "Chrry" | "Atlas" | "Peach" | "Vault" | "Bloom" | string // UUID of custom agent
        >
      >()
      .default([]),

    // Capabilities
    capabilities: jsonb("capabilities")
      .$type<{
        text?: boolean
        image?: boolean
        audio?: boolean
        video?: boolean
        webSearch?: boolean
        imageGeneration?: boolean
        videoGeneration?: boolean
        codeExecution?: boolean
        pdf?: boolean
      }>()
      .default({
        text: true,
        image: true,
        audio: true,
        video: true,
        webSearch: true,
        imageGeneration: true,
        videoGeneration: true,
        codeExecution: true,
        pdf: true,
      }),

    // Tags for discovery
    tags: text("tags").array().default([]), // ["legal", "contracts", "business"]

    // Personality & Behavior
    systemPrompt: text("systemPrompt"), // Custom instructions
    tone: text("tone", {
      enum: ["professional", "casual", "friendly", "technical", "creative"],
    }).default("professional"),
    language: text("language").default("en"), // Default language

    // Knowledge Base
    knowledgeBase: text("knowledgeBase"), // Custom context/knowledge (simple text)
    ragDocumentIds: text("ragDocumentIds").array().default([]), // IDs of uploaded RAG documents
    ragEnabled: boolean("ragEnabled").notNull().default(false), // Whether to use RAG

    // App-to-app calls: IDs of apps this app can invoke
    // calledAppIds: uuid("calledAppIds").array().default([]),
    examples:
      jsonb("examples").$type<Array<{ user: string; assistant: string }>>(), // Example conversations

    // Settings
    visibility: text("visibility", {
      enum: ["private", "public", "unlisted"],
    })
      .notNull()
      .default("private"),
    defaultModel: text("defaultModel").default("sushi"), // Default AI model for this app
    temperature: real("temperature").default(0.7),

    // Monetization
    pricing: text("pricing", {
      enum: ["free", "one-time", "subscription"],
    })
      .notNull()
      .default("free"),
    tier: text("tier", {
      enum: ["free", "plus", "pro"],
    })
      .notNull()
      .default("free"), // Subscription tier required to use this app
    price: integer("price").default(0), // Price in cents (e.g., 999 = $9.99)
    currency: text("currency").default("usd"),
    subscriptionInterval: text("subscriptionInterval", {
      enum: ["monthly", "yearly"],
    }), // Only for subscription pricing
    stripeProductId: text("stripeProductId"), // Stripe product ID
    stripePriceId: text("stripePriceId"), // Stripe price ID
    revenueShare: integer("revenueShare").default(70), // Creator gets 70%, Vex gets 30%

    // BYOK (Bring Your Own Key) - Encrypted API keys
    apiKeys: jsonb("apiKeys").$type<{
      fal?: string // Encrypted Replicate API key (for Flux)

      openai?: string // Encrypted OpenAI API key
      anthropic?: string // Encrypted Anthropic API key
      google?: string // Encrypted Google API key
      deepseek?: string // Encrypted DeepSeek API key
      perplexity?: string // Encrypted Perplexity API key
      replicate?: string // Encrypted Replicate API key (for Flux)
      openrouter?: string // Encrypted OpenRouter API key
      xai?: string // Encrypted XAI API key
      s3?: string // Encrypted S3 API key
    }>(), // If provided, app uses creator's keys instead of Vex's

    // Usage Limits (customizable per app)
    // Free tier: User's credits apply + these limits (if set)
    // Plus tier: User's credits apply + these limits (creator pays API)
    // Pro tier: NO credits deducted, only these limits apply (creator pays API)
    limits: jsonb("limits")
      .$type<{
        promptInput?: number // Max input length (default: 7000)
        promptTotal?: number // Max total context (default: 30000)
        speechPerHour?: number // Voice requests per hour (default: 10)
        speechPerDay?: number // Voice requests per day (default: 100)
        speechCharsPerDay?: number // Voice characters per day (default: 10000)
        fileUploadMB?: number // Max file size in MB (default: 30)
        filesPerMessage?: number // Max files per message (default: 10)
        messagesPerHour?: number // Rate limit per hour (default: 50)
        messagesPerDay?: number // Daily message limit (default: 500)
        imageGenerationsPerDay?: number // Image generations per day (default: 20)
      }>()
      .default({}), // Empty object means use system defaults

    // API Access
    apiEnabled: boolean("apiEnabled").notNull().default(false),
    apiPricing: text("apiPricing", {
      enum: ["free", "per-request", "subscription"],
    }).default("per-request"),
    apiPricePerRequest: integer("apiPricePerRequest").default(1), // Price in cents per API call
    apiMonthlyPrice: integer("apiMonthlyPrice").default(0), // Monthly API subscription price
    apiRateLimit: integer("apiRateLimit").default(1000), // Requests per month for free tier
    apiKey: text("apiKey"), // Auto-generated API key for the agent
    apiRequestCount: integer("apiRequestCount").notNull().default(0), // Total API requests
    apiRevenue: integer("apiRevenue").notNull().default(0), // Total API revenue in cents

    // Analytics
    usageCount: integer("usageCount").notNull().default(0),
    likeCount: integer("likeCount").notNull().default(0),
    shareCount: integer("shareCount").notNull().default(0),
    installCount: integer("installCount").notNull().default(0), // How many users added it
    subscriberCount: integer("subscriberCount").notNull().default(0), // Paying subscribers
    totalRevenue: integer("totalRevenue").notNull().default(0), // Total revenue in cents

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),

    // Timestamps
    moltCommentedOn: timestamp("moltCommentedOn", {
      mode: "date",
      withTimezone: true,
    }),
    moltPostedOn: timestamp("moltPostedOn", {
      mode: "date",
      withTimezone: true,
    }),

    blueskyHandle: text("blueskyHandle"),
    blueskyPassword: text("blueskyPassword"),

    moltHandle: text("moltHandle"),
    moltApiKey: text("moltApiKey"),
    moltAgentName: text("moltAgentName"),
    moltAgentKarma: integer("moltAgentKarma"),
    moltAgentVerified: boolean("moltAgentVerified"),

    // Legacy
    features: jsonb("features").$type<{ [key: string]: boolean }>(),
  },
  (table) => [
    {
      // Indexes for efficient queries
      guestIdIndex: index("app_guest_idx").on(table.guestId),
      visibilityIndex: index("app_visibility_idx").on(table.visibility),
      tagsIndex: index("app_tags_idx").using("gin", table.tags),
      slugIndex: index("app_slug_idx").on(table.slug),
      // Unique constraint: store can't have duplicate slugs (clean URLs)
      storeSlugUnique: uniqueIndex("app_store_slug_unique").on(
        table.storeId,
        table.slug,
      ),
      guestSlugUnique: uniqueIndex("app_guest_slug_store_unique").on(
        table.guestId,
        table.storeId,
        table.slug,
      ),
    },
  ],
)

export const appExtends = pgTable(
  "appExtends",
  {
    appId: uuid("appId")
      .references(() => apps.id, {
        onDelete: "cascade",
      })
      .notNull(),
    toId: uuid("toId")
      .references(() => apps.id, {
        onDelete: "cascade",
      })
      .notNull(),

    campaignId: uuid("campaignId").references(() => appCampaigns.id, {
      onDelete: "cascade",
    }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      appIdToIdUnique: uniqueIndex("app_extends_app_id_to_id_unique").on(
        table.appId,
        table.toId,
      ),
    },
  ],
)

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    images:
      jsonb("images").$type<
        {
          url: string
          width?: number
          height?: number
          id: string
        }[]
      >(),
    teamId: uuid("teamId").references(() => teams.id, {
      onDelete: "cascade",
    }),
    excludeGridApps: jsonb("excludeGridApps")
      .$type<
        Array<string> // UUID of custom agent
      >()
      .default([]),
    isSystem: boolean("isSystem").default(false).notNull(),
    hourlyRate: integer("hourlyRate"),
    credits: integer("credits"),
    domain: text("domain"),
    appId: uuid("appId").references((): AnyPgColumn => apps.id, {
      onDelete: "cascade",
    }),

    guestId: uuid("guestId").references((): AnyPgColumn => guests.id, {
      onDelete: "cascade",
    }),
    parentStoreId: uuid("parentStoreId").references(
      (): AnyPgColumn => stores.id,
    ),
    visibility: text("visibility", {
      enum: ["public", "private", "unlisted"],
    })
      .default("public")
      .notNull(),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      // Unique constraint on slug (for URL routing)
      slugUnique: uniqueIndex("stores_slug_unique").on(table.slug),
      // Index for finding user's stores
      // Index for finding guest's stores
      guestIdIndex: index("stores_guest_idx").on(table.guestId),
      // Index for finding team's stores
      teamIdIndex: index("stores_team_idx").on(table.teamId),
      // Index for finding child stores (hierarchy queries)
      parentStoreIdIndex: index("stores_parent_idx").on(table.parentStoreId),
      // Index for finding store by main app
      appIdIndex: index("stores_app_idx").on(table.appId),
      // Index for custom domain lookup
      domainIndex: index("stores_domain_idx").on(table.domain),
    },
  ],
)

// App & Store Installs - Track which users/guests have installed which apps/stores
export const installs = pgTable(
  "installs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Either appId OR storeId must be set (not both)
    appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),
    storeId: uuid("storeId").references(() => stores.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    installedAt: timestamp("installedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    uninstalledAt: timestamp("uninstalledAt", {
      mode: "date",
      withTimezone: true,
    }), // null = still installed
    // Home screen organization
    order: integer("order").notNull().default(0), // Position on home screen (0 = first)
    isPinned: boolean("isPinned").notNull().default(false), // Pinned to top of home screen
    // PWA-specific metadata
    platform: text("platform", {
      enum: ["web", "ios", "android", "desktop"],
    }), // Where it was installed
    source: text("source", {
      enum: ["store", "share", "direct", "recommendation"],
    }), // How they found it
  },
  (table) => [
    {
      // Indexes for efficient queries
      appIdIndex: index("installs_app_idx").on(table.appId),
      storeIdIndex: index("installs_store_idx").on(table.storeId),
      guestIdIndex: index("installs_guest_idx").on(table.guestId),
      installedAtIndex: index("installs_installed_at_idx").on(
        table.installedAt,
      ),
      // Unique constraint: user can only install an app once (unless uninstalled)
      userAppUnique: uniqueIndex("installs_user_app_unique").on(table.appId),
      guestAppUnique: uniqueIndex("installs_guest_app_unique").on(
        table.guestId,
        table.appId,
      ),
      // Unique constraint: user can only install a store once
      userStoreUnique: uniqueIndex("installs_user_store_unique").on(
        table.storeId,
      ),
      guestStoreUnique: uniqueIndex("installs_guest_store_unique").on(
        table.guestId,
        table.storeId,
      ),
    },
  ],
)

export type install = typeof installs.$inferSelect
export type newInstall = typeof installs.$inferInsert

// Store Installs - Apps installed in stores (cross-store app sharing)
export const storeInstalls = pgTable(
  "storeInstalls",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Which store is installing the app
    storeId: uuid("storeId")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),

    // Which app is being installed
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),

    // Store-specific customization
    customDescription: text("customDescription"), // Override app description for this store
    customIcon: text("customIcon"), // Override app icon for this store
    featured: boolean("featured").notNull().default(false), // Featured in this store
    displayOrder: integer("displayOrder").notNull().default(0), // Display order in store

    // Timestamps
    installedAt: timestamp("installedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      // Indexes for efficient queries
      storeIdIndex: index("store_installs_store_idx").on(table.storeId),
      appIdIndex: index("store_installs_app_idx").on(table.appId),
      featuredIndex: index("store_installs_featured_idx").on(table.featured),
      // Unique constraint: one app can only be installed once per store
      storeAppUnique: uniqueIndex("store_installs_store_app_unique").on(
        table.storeId,
        table.appId,
      ),
    },
  ],
)

export type storeInstall = typeof storeInstalls.$inferSelect
export type newStoreInstall = typeof storeInstalls.$inferInsert

// Agent API Usage - Track custom agent API requests and billing
export const agentApiUsage = pgTable(
  "agentApiUsage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Request details
    requestCount: integer("requestCount").notNull().default(0),
    successCount: integer("successCount").notNull().default(0),
    errorCount: integer("errorCount").notNull().default(0),
    totalTokens: integer("totalTokens").notNull().default(0),

    // Billing
    amount: integer("amount").notNull().default(0), // Amount charged in cents
    currency: text("currency").default("usd"),
    billingPeriod: text("billingPeriod", {
      enum: ["hourly", "daily", "monthly"],
    })
      .notNull()
      .default("monthly"),

    // Period
    periodStart: timestamp("periodStart", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    periodEnd: timestamp("periodEnd", { mode: "date", withTimezone: true }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      appIdIndex: index("agent_api_usage_app_idx").on(table.appId),
      guestIdIndex: index("agent_api_usage_guest_idx").on(table.guestId),
      periodIndex: index("agent_api_usage_period_idx").on(table.periodStart),
    },
  ],
)

export const instructions = pgTable("instructions", {
  appId: uuid("appId").references(() => apps.id, { onDelete: "set null" }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  emoji: text("emoji").notNull(),
  content: text("content").notNull(),
  threadId: uuid("threadId").references(() => threads.id, {
    onDelete: "cascade",
  }),
  messageId: uuid("messageId").references(() => messages.id, {
    onDelete: "cascade",
  }),
  confidence: integer("confidence").notNull(),
  generatedAt: timestamp("generatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  requiresWebSearch: boolean("requiresWebSearch").notNull().default(false),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const expenseCategory = [
  "food",
  "transport",
  "entertainment",
  "shopping",
  "bills",
  "health",
  "education",
  "travel",
  "revenue", // 🍷 Premium subscription income
  "other",
] as const

export const budgetCategory = expenseCategory

// Vault (Finance) - Expense Tracking
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "set null",
    }),
    amount: integer("amount").notNull(), // in cents
    currency: text("currency").notNull().default("USD"),
    category: text("category", {
      enum: expenseCategory,
    })
      .notNull()
      .default("other"),
    description: text("description").notNull(),
    date: timestamp("date", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    receipt: text("receipt"), // Image URL
    tags: jsonb("tags").$type<string[]>().default([]),
    isShared: boolean("isShared").notNull().default(false),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("expenses_guest_idx").on(table.guestId),
    index("expenses_thread_idx").on(table.threadId),
    index("expenses_date_idx").on(table.date),
    index("expenses_category_idx").on(table.category),
  ],
)

export type expense = typeof expenses.$inferSelect
export type newExpense = typeof expenses.$inferInsert

// Vault - Budgets
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    category: text("category", {
      enum: budgetCategory,
    })
      .notNull()
      .default("other"),
    amount: integer("amount").notNull(), // Budget limit in cents
    period: text("period", { enum: ["weekly", "monthly", "yearly"] })
      .notNull()
      .default("monthly"),
    startDate: timestamp("startDate", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
    isActive: boolean("isActive").notNull().default(true),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),

    currency: text("currency").notNull().default("USD"),
  },
  (table) => [
    index("budgets_category_idx").on(table.category),
    index("budgets_active_idx").on(table.isActive),
  ],
)

export type budget = typeof budgets.$inferSelect
export type newBudget = typeof budgets.$inferInsert

// Vault - Shared Expenses (for collaboration)
export const sharedExpenses = pgTable(
  "sharedExpenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expenseId: uuid("expenseId")
      .references(() => expenses.id, { onDelete: "cascade" })
      .notNull(),
    threadId: uuid("threadId")
      .references(() => threads.id, { onDelete: "cascade" })
      .notNull(),
    splits: jsonb("splits")
      .$type<
        {
          guestId?: string
          amount: number
          paid: boolean
        }[]
      >()
      .notNull(),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("shared_expenses_expense_idx").on(table.expenseId),
    index("shared_expenses_thread_idx").on(table.threadId),
  ],
)

export type sharedExpense = typeof sharedExpenses.$inferSelect
export type newSharedExpense = typeof sharedExpenses.$inferInsert

// ============================================
// 🍣 SUSHI - Real-time Analytics
// ============================================

// Analytics Sites (websites being tracked)
export const analyticsSites = pgTable(
  "analyticsSites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Site details
    domain: text("domain").notNull().unique(), // e.g., "chrry.dev"
    name: text("name").notNull(), // Display name
    timezone: text("timezone").notNull().default("UTC"),

    // Tracking
    trackingId: text("trackingId").notNull().unique(), // Public tracking ID
    isPublic: boolean("isPublic").notNull().default(false), // Public dashboard

    // Settings
    excludeIps: jsonb("excludeIps").$type<string[]>().default([]),
    excludePaths: jsonb("excludePaths").$type<string[]>().default([]),

    // Aggregated stats from Plausible (synced by cron)
    stats: jsonb("stats").$type<{
      // Aggregate metrics
      visitors: number
      pageviews: number
      bounce_rate: number
      visit_duration: number
      visits: number
      views_per_visit: number

      // Top pages
      topPages?: Array<{
        page: string
        visitors: number
        pageviews: number
        bounce_rate: number
      }>

      // Traffic sources
      sources?: Array<{
        source: string
        visitors: number
        bounce_rate: number
      }>

      // Geographic data
      countries?: Array<{
        country: string
        visitors: number
      }>

      // Device breakdown
      devices?: Array<{
        device: string
        visitors: number
        percentage: number
      }>

      // Browser breakdown
      browsers?: Array<{
        browser: string
        visitors: number
        percentage: number
      }>

      // Goal conversions
      goals?: Array<{
        goal: string
        visitors: number
        events: number
        conversion_rate: number
      }>

      period: string // e.g., "7d"
      lastSynced: string // ISO timestamp
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_sites_guest_idx").on(table.guestId),
    index("analytics_sites_tracking_idx").on(table.trackingId),
    index("analytics_sites_domain_idx").on(table.domain),
  ],
)

export type analyticsSite = typeof analyticsSites.$inferSelect
export type newAnalyticsSite = typeof analyticsSites.$inferInsert

// Analytics Events (pageviews, clicks, custom events)
export const analyticsEvents = pgTable(
  "analyticsEvents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("siteId")
      .references(() => analyticsSites.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: text("sessionId").notNull(), // Client-generated session ID

    // Event details
    type: text("type", {
      enum: ["pageview", "click", "custom"],
    })
      .notNull()
      .default("pageview"),
    name: text("name"), // Event name for custom events

    // Page details
    pathname: text("pathname").notNull(), // /about
    referrer: text("referrer"), // Where they came from

    // Visitor details
    country: text("country"), // US, GB, etc.
    city: text("city"),
    device: text("device", {
      enum: ["desktop", "mobile", "tablet"],
    }),
    browser: text("browser"), // Chrome, Safari, etc.
    os: text("os"), // macOS, Windows, iOS, Android

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

    // Duration (for pageviews)
    duration: integer("duration"), // Time on page in seconds

    timestamp: timestamp("timestamp", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_events_site_idx").on(table.siteId),
    index("analytics_events_session_idx").on(table.sessionId),
    index("analytics_events_type_idx").on(table.type),
    index("analytics_events_timestamp_idx").on(table.timestamp),
    index("analytics_events_pathname_idx").on(table.pathname),
    index("analytics_events_country_idx").on(table.country),
  ],
)

export type analyticsEvent = typeof analyticsEvents.$inferSelect
export type newAnalyticsEvent = typeof analyticsEvents.$inferInsert

// Analytics Sessions (visitor sessions)
export const analyticsSessions = pgTable(
  "analyticsSessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("siteId")
      .references(() => analyticsSites.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: text("sessionId").notNull().unique(), // Client-generated

    // Session details
    entryPage: text("entryPage").notNull(), // First page visited
    exitPage: text("exitPage"), // Last page visited
    pageviews: integer("pageviews").notNull().default(1),
    duration: integer("duration").notNull().default(0), // Total session duration

    // Visitor details
    country: text("country"),
    city: text("city"),
    device: text("device", {
      enum: ["desktop", "mobile", "tablet"],
    }),
    browser: text("browser"),
    os: text("os"),
    referrer: text("referrer"),

    // Timestamps
    startedAt: timestamp("startedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("endedAt", { mode: "date", withTimezone: true }),

    // Real-time tracking
    isActive: boolean("isActive").notNull().default(true),
    lastSeenAt: timestamp("lastSeenAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_sessions_site_idx").on(table.siteId),
    index("analytics_sessions_session_idx").on(table.sessionId),
    index("analytics_sessions_active_idx").on(table.isActive),
    index("analytics_sessions_started_idx").on(table.startedAt),
  ],
)

export const timers = pgTable("timer", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  count: integer("count").notNull().default(0),
  fingerprint: text("fingerprint").notNull(),
  isCountingDown: boolean("isCountingDown").notNull().default(false),
  preset1: integer("preset1").notNull().default(25),
  preset2: integer("preset2").notNull().default(15),
  preset3: integer("preset3").notNull().default(5),
})
export const moods = pgTable("mood", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["happy", "sad", "angry", "astonished", "inlove", "thinking"],
  }).notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  taskId: uuid("taskId").references((): AnyPgColumn => tasks.id, {
    onDelete: "cascade",
  }),
  messageId: uuid("messageId").references((): AnyPgColumn => messages.id, {
    onDelete: "cascade",
  }),
  metadata: jsonb("metadata")
    .$type<{
      detectedBy?: string // "claude-3.5-sonnet"
      confidence?: number // 0.85
      reason?: string // "User expressed excitement..."
      conversationContext?: string // Last 200 chars
    }>()
    .default({}),
})

export const kanbanBoards = pgTable("kanbanBoard", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name").notNull().default("My Board"),
  description: text("description"),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),

  // Cross-Platform Integration Fields
  integrationType: text("integrationType"), // "github" | "asana" | "linear" | "jira" | "custom"
  integrationProjectId: text("integrationProjectId"), // External project/board ID
  integrationRepoOwner: text("integrationRepoOwner"), // GitHub: owner, Asana: workspace
  integrationRepoName: text("integrationRepoName"), // GitHub: repo, Asana: project name
  integrationAccessToken: text("integrationAccessToken"), // Encrypted OAuth token
  integrationWebhookUrl: text("integrationWebhookUrl"), // For real-time sync
  syncEnabled: boolean("syncEnabled").default(false), // Auto-sync enabled
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date", withTimezone: true }),
  syncDirection: text("syncDirection").default("bidirectional"), // "import" | "export" | "bidirectional"

  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),
})

export const taskStates = pgTable("taskState", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0), // For column ordering
  color: text("color").default("#6366f1"), // Optional column color
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  kanbanBoardId: uuid("kanbanBoardId")
    .references(() => kanbanBoards.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const tasks = pgTable("task", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  taskStateId: uuid("taskStateId").references(() => taskStates.id, {
    onDelete: "set null",
  }), // Which column/state this task is in
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  modifiedOn: timestamp("modifiedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  total: jsonb("total").$type<{ date: string; count: number }[]>().default([]),
  order: integer("order").default(0), // Order within the column
  selected: boolean("selected").default(false),
  appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }), // Per-app Kanban board
  threadId: uuid("threadId").references((): AnyPgColumn => threads.id, {
    onDelete: "cascade",
  }),
})

export const taskLogs = pgTable("taskLog", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  taskId: uuid("taskId")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  moodId: uuid("moodId").references(() => moods.id, { onDelete: "cascade" }),

  content: text("content").notNull(),
  mood: text("mood", {
    enum: ["happy", "sad", "angry", "astonished", "inlove", "thinking"],
  }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
})

export type analyticsSession = typeof analyticsSessions.$inferSelect
export type newAnalyticsSession = typeof analyticsSessions.$inferInsert

export const retroSessions = pgTable(
  "retroSessions",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "cascade",
    }),

    // Session tracking
    startedAt: timestamp("startedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
    duration: integer("duration"), // seconds

    // Progress tracking
    totalQuestions: integer("totalQuestions").notNull(),
    questionsAnswered: integer("questionsAnswered").default(0).notNull(),
    sectionsCompleted: integer("sectionsCompleted").default(0).notNull(),

    // Engagement metrics
    averageResponseLength: integer("averageResponseLength"),
    skippedQuestions: integer("skippedQuestions").default(0).notNull(),

    // Context
    dailyQuestionSectionIndex: integer("dailyQuestionSectionIndex").notNull(),
    dailyQuestionIndex: integer("dailyQuestionIndex").notNull(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      completionRate?: number
      engagementScore?: number
      insights?: string[]
    }>(),

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    appIdIdx: index("retroSessions_appId_idx").on(table.appId),
    startedAtIdx: index("retroSessions_startedAt_idx").on(table.startedAt),
    completedAtIdx: index("retroSessions_completedAt_idx").on(
      table.completedAt,
    ),
  }),
)

export const retroResponses = pgTable(
  "retroResponses",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    // Relations
    sessionId: uuid("sessionId")
      .references(() => retroSessions.id, {
        onDelete: "cascade",
      })
      .notNull(),

    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    messageId: uuid("messageId").references(() => messages.id, {
      onDelete: "set null",
    }),

    // Question context
    questionText: text("questionText").notNull(),
    sectionTitle: text("sectionTitle").notNull(),
    questionIndex: integer("questionIndex").notNull(),
    sectionIndex: integer("sectionIndex").notNull(),

    // Response
    responseText: text("responseText"),
    responseLength: integer("responseLength"),
    skipped: boolean("skipped").default(false).notNull(),

    // Timing
    askedAt: timestamp("askedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    answeredAt: timestamp("answeredAt", { mode: "date", withTimezone: true }),
    timeToAnswer: integer("timeToAnswer"), // seconds

    // AI analysis
    sentimentScore: real("sentimentScore"), // -1 to +1
    insightQuality: real("insightQuality"), // 0-1 scale
    actionableItems: jsonb("actionableItems").$type<string[]>(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      emotionalTone?: string
      keyThemes?: string[]
      followUpSuggestions?: string[]
    }>(),

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index("retroResponses_sessionId_idx").on(table.sessionId),
    appIdIdx: index("retroResponses_appId_idx").on(table.appId),
    askedAtIdx: index("retroResponses_askedAt_idx").on(table.askedAt),
    skippedIdx: index("retroResponses_skipped_idx").on(table.skipped),
  }),
)

export type RetroSession = typeof retroSessions.$inferSelect
export type NewRetroSession = typeof retroSessions.$inferInsert

export type RetroResponse = typeof retroResponses.$inferSelect
export type NewRetroResponse = typeof retroResponses.$inferInsert

export const codeEmbeddings = pgTable(
  "codeEmbeddings",
  {
    id: text("id").primaryKey(), // e.g., "apps/api/hono/routes/ai.ts:generateText"
    repoName: text("repoName").notNull(), // e.g., "chrryAI/vex"
    commitHash: text("commitHash").notNull(), // Git commit hash for cache invalidation
    filepath: text("filepath").notNull(),
    type: text("type").notNull(), // 'file' | 'function' | 'class' | 'import'
    name: text("name").notNull(),
    content: text("content").notNull(), // Code snippet
    startLine: integer("startLine"),
    endLine: integer("endLine"),
    embedding: vector("embedding", { dimensions: 4096 }), // OpenAI text-embedding-3-small
    metadata: jsonb("metadata"), // Additional AST metadata
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    repoNameIdx: index("codeEmbeddings_repoName_idx").on(table.repoName),
    filepathIdx: index("codeEmbeddings_filepath_idx").on(table.filepath),
    typeIdx: index("codeEmbeddings_type_idx").on(table.type),
    commitHashIdx: index("codeEmbeddings_commitHash_idx").on(table.commitHash),
    // Vector similarity index for cosine similarity search
    embeddingIdx: index("codeEmbeddings_embedding_idx").using(
      "ivfflat",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
)

export type CodeEmbedding = typeof codeEmbeddings.$inferSelect
export type NewCodeEmbedding = typeof codeEmbeddings.$inferInsert

export const codebaseQueries = pgTable(
  "codebaseQueries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, { onDelete: "cascade" }),
    repoName: text("repoName").notNull(),
    query: text("query").notNull(),
    responseTime: integer("responseTime"), // milliseconds
    tokensUsed: integer("tokensUsed"),
    costUSD: real("costUSD"), // Track OpenAI costs
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    guestIdIdx: index("codebaseQueries_guestId_idx").on(table.guestId),
    appIdIdx: index("codebaseQueries_appId_idx").on(table.appId),
    repoNameIdx: index("codebaseQueries_repoName_idx").on(table.repoName),
    createdAtIdx: index("codebaseQueries_createdAt_idx").on(table.createdAt),
  }),
)

export type CodebaseQuery = typeof codebaseQueries.$inferSelect
export type newCodebaseQuery = typeof codebaseQueries.$inferInsert

export const hippos = pgTable(
  "hippo",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    // files: jsonb("files").$type<
    //   {
    //     type: string
    //     url?: string
    //     name: string
    //     size: number
    //     data?: string
    //     id: string
    //   }[]
    // >(),
  },
  (table) => ({
    guestIdIdx: index("hippo_guest_idx").on(table.guestId),
    createdOnIdx: index("hippo_created_on_idx").on(table.createdOn),
  }),
)

export type hippo = typeof hippos.$inferSelect
export type newHippo = typeof hippos.$inferInsert

export const hippoFiles = pgTable(
  "hippoFiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hippoId: uuid("hippoId").references(() => hippos.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    url: text("url"),
    name: text("name").notNull(),
    size: integer("size").notNull(),
    data: text("data"),
  },
  (table) => ({
    hippoIdIdx: index("hippo_files_hippo_idx").on(table.hippoId),
  }),
)

export type hippoFile = typeof hippoFiles.$inferSelect
export type newHippoFile = typeof hippoFiles.$inferInsert

// Missing tables referenced by other tables
export const tribePosts = pgTable("tribePosts", {
  id: uuid("id").primaryKey().defaultRandom(),
})

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
})

export const appCampaigns = pgTable("appCampaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
})
