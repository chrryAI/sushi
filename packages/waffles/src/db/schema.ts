import type { AdapterAccount } from "@auth/core/adapters"
import type { aiModel, instruction, ramen, swarm } from "@chrryai/chrry/types"
import { relations, sql } from "drizzle-orm"

import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
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

export const PRO_CREDITS_PER_MONTH = 5000
export const PLUS_CREDITS_PER_MONTH = 2000
export const AGENCY_CREDITS_PER_MONTH = 50000
export const SOVEREIGN_CREDITS_PER_MONTH = 250000
export const ADDITIONAL_CREDITS = 500
export const GUEST_CREDITS_PER_MONTH = 30
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

export const users = pgTable(
  "user",
  {
    // appId: uuid("appId").references(() => apps.id, {
    //   onDelete: "cascade",
    // }), // this  meants apps can create users
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", {
      mode: "date",
      withTimezone: true,
    }),

    hippoCredits: integer("hippoCredits").default(25).notNull(),
    lastHippoCreditReset: timestamp("lastHippoCreditReset", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    selectedModels:
      jsonb("selectedModels").$type<
        {
          id: string
          name?: string
        }[]
      >(),
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
    apiKey: text("apiKey"),
    image: text("image"),
    password: text("password"),
    role: text("role", { enum: ["admin", "user"] })
      .notNull()
      .default("user"),
    roles: jsonb("roles")
      .$type<Array<"admin" | "user" | "tester" | string>>()
      .default(["user"]),

    tribeCredits: integer("tribeCredits")
      .notNull()
      .default(MEMBER_FREE_TRIBE_CREDITS),
    lastTribePostAt: timestamp("lastTribePostAt", {
      mode: "date",
      withTimezone: true,
    }),
    moltCredits: integer("moltCredits")
      .notNull()
      .default(MEMBER_FREE_TRIBE_CREDITS),
    theme: text("theme", { enum: ["light", "dark", "system"] })
      .notNull()
      .default("system"),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    activeOn: timestamp("activeOn", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    ip: text("ip"),
    language: text("language").notNull().default("en"),
    fingerprint: text("fingerprint"),
    isOnline: boolean("isOnline").default(false),
    subscribedOn: timestamp("subscribedOn", {
      mode: "date",
      withTimezone: true,
    }),

    hourlyRate: integer("hourlyRate"), // Credits per hour for collaboration
    isAvailableForHire: boolean("isAvailableForHire").default(false).notNull(),
    bio: text("bio"), // Short bio for /users page
    expertise: jsonb("expertise").$type<string[]>().default([]), // ["React", "TypeScript", "Design"]

    tasksCount: integer("tasksCount").default(MEMBER_TASKS_COUNT).notNull(),
    userName: text("userName").notNull(),
    fileUploadsToday: integer("fileUploadsToday").default(0).notNull(),
    fileUploadsThisHour: integer("fileUploadsThisHour").default(0).notNull(),
    totalFileSizeToday: integer("totalFileSizeToday").default(0).notNull(),
    lastFileUploadReset: timestamp("lastFileUploadReset", {
      mode: "date",
      withTimezone: true,
    }),

    country: text("country"),
    city: text("city"),

    speechRequestsToday: integer("speechRequestsToday").default(0).notNull(),
    speechRequestsThisHour: integer("speechRequestsThisHour")
      .default(0)
      .notNull(),
    speechCharactersToday: integer("speechCharactersToday")
      .default(0)
      .notNull(),
    lastSpeechReset: timestamp("lastSpeechReset", {
      mode: "date",
      withTimezone: true,
    }),

    characterProfilesEnabled: boolean("characterProfilesEnabled").default(
      false,
    ),
    memoriesEnabled: boolean("memoriesEnabled").default(true),
    suggestions: jsonb("suggestions").$type<{
      instructions: Array<instruction>
      lastGenerated?: string
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

    imagesGeneratedToday: integer("imagesGeneratedToday").default(0).notNull(),
    lastImageGenerationReset: timestamp("lastImageGenerationReset", {
      mode: "date",
      withTimezone: true,
    }),
    favouriteAgent: text("favouriteAgent").notNull().default("sushi"),
    timezone: text("timezone"),
    appleId: text("appleId"),
    migratedFromGuest: boolean("migratedFromGuest").default(false).notNull(),
    credits: integer("credits").default(MEMBER_CREDITS_PER_MONTH).notNull(),
    adConsent: boolean("adConsent").default(false).notNull(), // Grape ad consent

    // Stripe Connect for payouts (Pear feedback, affiliate commissions)
    stripeCustomerId: text("stripeCustomerId"), // For payments TO platform
    stripeConnectAccountId: text("stripeConnectAccountId"), // For payouts TO user
    stripeConnectOnboarded: boolean("stripeConnectOnboarded").default(false),

    // Pear feedback credits (monthly allocation based on tier)
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
  },
  (table) => [
    uniqueIndex("user_name_idx").on(table.userName),
    uniqueIndex("user_email_idx").on(table.email),
    index("user_search_index").using(
      "gin",
      sql`(
      setweight(to_tsvector('english', ${table.name}), 'A') ||
      setweight(to_tsvector('english', ${table.userName}), 'B') ||
      setweight(to_tsvector('english', ${table.email}), 'C')
  )`,
    ),
  ],
)

// const bloom = pgTable("bloom", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   appId: uuid("appId").references(() => apps.id, {
//     onDelete: "cascade",
//   }),
//   userId: uuid("appId").references(() => users.id, {
//     onDelete: "cascade",
//   }),
//   chrry: jsonb("chrry").$type<{
//     [key: string]: chrryPick<cherry>
//   }>(),
//   createdOn: timestamp("createdOn", {
//     mode: "date",
//     withTimezone: true,
//   }).defaultNow(),
//   updatedOn: timestamp("createdOn", {
//     mode: "date",
//     withTimezone: true,
//   }).defaultNow(),
// })

// const waffles = pgTable("waffles", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   // vaultId: uuid("vaultId").references(() => vault.id, {
//   //   onDelete: "set null",
//   // }),

//   peach: jsonb("peach").$type<cherry>(),
//   createdOn: timestamp("createdOn", {
//     mode: "date",
//     withTimezone: true,
//   }).defaultNow(),
//   updatedOn: timestamp("createdOn", {
//     mode: "date",
//     withTimezone: true,
//   }).defaultNow(),
// })

export const feedbackTransactions = pgTable("feedbackTransactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  appId: uuid("appId").references(() => apps.id, {
    onDelete: "cascade",
  }),
  appOwnerId: uuid("appOwnerId").references(() => users.id, {
    onDelete: "cascade",
  }),
  feedbackUserId: uuid("feedbackUserId").references(() => users.id, {
    onDelete: "cascade",
  }),
  amount: integer("amount").default(0).notNull(),
  commission: integer("commission").default(0).notNull(),
  transactionType: text("transactionType", {
    enum: [
      "feedback_given",
      "feedback_received",
      "credit_purchase",
      "monthly_allocation",
    ],
  })
    .notNull()
    .default("feedback_given"),
  pearTier: text("pearTier", {
    enum: ["free", "plus", "pro"],
  }),
  creditsRemaining: integer("creditsRemaining").default(0),

  // M2M tracking
  source: text("source", { enum: ["human", "m2m"] }).default("human"),
  sourceAppId: uuid("sourceAppId").references(() => apps.id, {
    onDelete: "set null",
  }),

  metadata: jsonb("metadata").$type<{
    feedbackId?: string
    subscriptionId?: string
    stripePaymentId?: string
  }>(),
  createdOn: timestamp("createdOn", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
})

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
    userId: uuid("userId").references((): AnyPgColumn => users.id, {
      onDelete: "cascade",
    }),
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

export const subscriptions = pgTable(
  "subscription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider", {
      enum: ["stripe", "apple", "google"],
    }).notNull(),
    subscriptionId: text("subscriptionId").notNull(),
    sessionId: text("sessionId"),
    status: text("status", {
      enum: ["active", "canceled", "pastDue", "ended", "trialing"],
    }).notNull(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    plan: text("plan", {
      enum: ["plus", "pro", "agency", "sovereign"],
    }).notNull(),
    appId: uuid("appId").references(() => apps.id, { onDelete: "set null" }),
  },
  (table) => [
    {
      // Allow same subscriptionId for guest and user (handles Apple resubscription during guest-to-member transition)
      // But prevent duplicate subscriptionIds within the same provider for same user/guest
      // Use MD5 hash to avoid PostgreSQL btree index row size limit for large Apple subscription IDs
      userProviderSubscriptionIndex: uniqueIndex(
        "subscription_user_provider_hash_idx",
      )
        .on(table.userId, table.provider, sql`md5(${table.subscriptionId})`)
        .where(sql`${table.userId} IS NOT NULL`),
      guestProviderSubscriptionIndex: uniqueIndex(
        "subscription_guest_provider_hash_idx",
      )
        .on(table.guestId, table.provider, sql`md5(${table.subscriptionId})`)
        .where(sql`${table.guestId} IS NOT NULL`),
      // Non-unique indexes for efficient lookups
      userIdIndex: index("subscription_user_idx").on(table.userId),
      guestIdIndex: index("subscription_guest_idx").on(table.guestId),
    },
  ],
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

// teams/Teams for collaborative agent management
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly name
  description: text("description"),
  logo: text("logo"), // URL to logo
  website: text("website"),

  // Owner
  ownerId: uuid("ownerId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Settings
  plan: text("plan", {
    enum: ["starter", "professional", "business", "enterprise"],
  })
    .notNull()
    .default("starter"),

  // Limits based on plan
  maxMembers: integer("maxMembers").default(3).notNull(), // Starter: 3, Pro: 10, Business: 50, Enterprise: unlimited
  maxApps: integer("maxApps").default(2).notNull(), // Starter: 2, Pro: 10, Business: 50, Enterprise: unlimited

  // Monthly price in cents
  monthlyPrice: integer("monthlyPrice").default(0).notNull(), // Starter: $0, Pro: $99, Business: $299, Enterprise: custom

  // Billing
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  subscriptionStatus: text("subscriptionStatus", {
    enum: ["active", "canceled", "past_due", "trialing"],
  }),

  // Timestamps
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

// team members (team members)
export const teamMembers = pgTable(
  "teamMembers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("teamId")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    role: text("role", {
      enum: ["owner", "admin", "member", "viewer"],
    })
      .notNull()
      .default("member"),

    // Permissions
    canCreateApps: boolean("canCreateApps").default(true).notNull(),
    canEditApps: boolean("canEditApps").default(true).notNull(),
    canDeleteApps: boolean("canDeleteApps").default(false).notNull(),
    canManageMembers: boolean("canManageMembers").default(false).notNull(),
    canManageBilling: boolean("canManageBilling").default(false).notNull(),

    // Timestamps
    joinedOn: timestamp("joinedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    invitedBy: uuid("invitedBy").references(() => users.id),
  },
  (table) => [
    {
      // Ensure user can only be in org once
      uniqueOrgUser: uniqueIndex("unique_org_user").on(
        table.teamId,
        table.userId,
      ),
    },
  ],
)

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

export const creditTransactions = pgTable(
  "creditTransactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    amount: integer("amount").notNull(), // positive for credits added, negative for usage
    balanceBefore: integer("balanceBefore").notNull(),
    balanceAfter: integer("balanceAfter").notNull(),
    description: text("description"),
    subscriptionId: uuid("subscriptionId").references(() => subscriptions.id, {
      onDelete: "cascade",
    }),
    sessionId: text("sessionId"), // Stripe checkout session ID for Tribe/Molt payments
    scheduleId: uuid("scheduleId").references(() => scheduledJobs.id, {
      onDelete: "set null",
    }), // Link to scheduled job for Tribe/Molt
    type: text("type", {
      enum: ["purchase", "subscription", "tribe", "molt"],
    })
      .notNull()
      .default("purchase"),
    metadata: jsonb("metadata"), // store payment info, subscription details, etc.
    createdOn: timestamp("createdOn", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index("creditTransactions_sessionId_idx").on(table.sessionId),
    scheduleIdIdx: index("creditTransactions_scheduleId_idx").on(
      table.scheduleId,
    ),
  }),
)

// export const gifts = pgTable("gifts", {
//   userId: uuid("userId").references((): AnyPgColumn => users.id, {
//     onDelete: "cascade",
//   }),
//   guestId: uuid("guestId").references((): AnyPgColumn => guests.id, {
//     onDelete: "cascade",
//   }),
//   status: text("status", {
//     enum: ["accepted", "pending"],
//   }).default("pending"),
//   createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
//     .defaultNow()
//     .notNull(),
//   updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
//     .defaultNow()
//     .notNull(),

//   fromUserId: uuid("fromGuestId").references((): AnyPgColumn => users.id, {
//     onDelete: "set null",
//   }),
//   fromGuestId: uuid("fromGuestId").references((): AnyPgColumn => guests.id, {
//     onDelete: "set null",
//   }),
// })

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    id: uuid("id").defaultRandom(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    value: text("value"), // Better Auth expects this field
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expiresAt", {
      mode: "date",
      withTimezone: true,
    }), // Better Auth expects this field
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
)

export const threads = pgTable("threads", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  pearAppId: uuid("pearAppId").references(() => apps.id, {
    onDelete: "cascade",
  }),

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
        userId?: string
        guestId?: string
        createdOn: string
      }[]
    >()
    .default([]),
  isMolt: boolean("isMolt").notNull().default(false),
  isTribe: boolean("isTribe").notNull().default(false),
  moltUrl: text("moltUrl"),
  moltId: text("moltId"),
  tribePostId: uuid("tribePostId").references(() => tribePosts.id, {
    onDelete: "set null",
  }),
  submolt: text("submolt"),

  tribeId: uuid("tribeId").references(() => tribes.id, {
    onDelete: "set null",
  }),

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

export const pushSubscriptions = pgTable("pushSubscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type collaborationStatus = "active" | "pending" | "revoked" | "rejected"

export const collaborations = pgTable("collaborations", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  threadId: uuid("threadId")
    .references(() => threads.id, {
      onDelete: "cascade",
    })
    .notNull(),
  role: text("role", {
    enum: ["owner", "collaborator"],
  })
    .notNull()
    .default("collaborator"),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),

  activeOn: timestamp("activeOn", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),

  status: text("status", {
    enum: ["active", "pending", "revoked", "rejected"],
  }).default("active"),
  isOnline: boolean("isOnline").default(false),
  isTyping: boolean("isTyping").default(false),
  lastTypedOn: timestamp("lastTypedOn", { mode: "date", withTimezone: true }),
  expiresOn: timestamp("expiresOn", { mode: "date", withTimezone: true }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  authorization: text("authorization", {
    enum: ["user", "subscriber", "guest", "all"],
  })
    .notNull()
    .default("all"),

  metadata: jsonb("metadata")
    .$type<{
      lastFailedKey?: string
      "qwen/qwen3-235b-a22b-thinking-2507"?: Date
      "qwen/qwen3-vl-235b-a22b-thinking"?: Date
      "qwen/qwen3-vl-30b-a3b-thinking"?: Date
      "deepseek/deepseek-v3.2"?: Date
      "deepseek/deepseek-r1"?: Date
      failed?: string[]
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
    isMolt: boolean("isMolt").notNull().default(false),
    isTribe: boolean("isTribe").notNull().default(false),
    moltUrl: text("moltUrl"),
    moltId: text("moltId"),
    tribePostId: uuid("tribePostId").references(() => tribePosts.id, {
      onDelete: "set null",
    }),
    submolt: text("submolt"),

    tribeId: uuid("tribeId").references(() => tribes.id, {
      onDelete: "set null",
    }),

    moltCommentId: uuid("moltCommentId").references(() => moltComments.id, {
      onDelete: "set null",
    }),

    pearAppId: uuid("pearAppId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    moltReplyId: uuid("moltReplyId").references(() => moltComments.id, {
      onDelete: "set null",
    }),

    tribeCommentId: uuid("tribeCommentId").references(() => tribeComments.id, {
      onDelete: "set null",
    }),

    tribeReplyId: uuid("tribeReplyId").references(() => tribeComments.id, {
      onDelete: "set null",
    }),

    jobId: uuid("jobId").references(() => scheduledJobs.id, {
      onDelete: "set null",
    }),

    tribeSummary: text("tribeSummary"),
    moltSummary: text("moltSummary"),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
          userId?: string
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

export const emailVerificationTokens = pgTable(
  "emailVerificationToken",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresOn: timestamp("expiresOn", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    used: boolean("used").default(false),
    createdOn: timestamp("createdOn", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => ({
    userIdTokenIndex: index("emailVerificationToken_userId_token").on(
      table.userId,
      table.token,
    ),
  }),
)
export const moltQuestions = pgTable("moltQuestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  appId: uuid("appId").references(() => apps.id, {
    onDelete: "cascade",
  }),
  threadId: uuid("threadId").references(() => threads.id, {
    onDelete: "cascade",
  }),
  asked: boolean("asked").notNull().default(false),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const moltPosts = pgTable("moltPosts", {
  id: uuid("id").defaultRandom().primaryKey(),
  moltId: text("moltId").notNull().unique(), // The ID from Moltbook system
  content: text("content").notNull(),
  author: text("author"), // Author name or agent name
  likes: integer("likes").default(0),
  submolt: text("submolt"),
  metadata: jsonb("metadata"), // Store full raw object if needed
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  threadId: uuid("threadId").references(() => threads.id, {
    onDelete: "set null",
  }),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  language: text("language").notNull().default("en"),
})

export const moltComments = pgTable("moltComments", {
  id: uuid("id").defaultRandom().primaryKey(),
  moltId: text("moltId").notNull(), // Our post's Moltbook ID
  commentId: text("commentId").notNull().unique(), // Moltbook comment ID
  authorId: text("authorId").notNull(), // Commenter's Moltbook ID
  authorName: text("authorName").notNull(), // Commenter's name
  content: text("content").notNull(), // Comment text
  replied: boolean("replied").notNull().default(false), // Did we reply?
  replyId: text("replyId"), // Our reply's Moltbook ID
  followed: boolean("followed").notNull().default(false), // Did we follow them?
  metadata: jsonb("metadata"), // Store full comment object
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const tribePostTranslations = pgTable(
  "tribePostTranslations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Foreign keys
    postId: uuid("postId")
      .notNull()
      .references(() => tribePosts.id, {
        onDelete: "cascade",
      }),

    // Translation details
    language: text("language").notNull(), // ISO 639-1 code: 'en', 'tr', 'de', etc.
    title: text("title"),
    content: text("content").notNull(),

    // Tracking
    translatedBy: uuid("translatedBy").references(() => users.id, {
      onDelete: "set null",
    }),
    creditsUsed: integer("creditsUsed").notNull().default(5),
    model: text("model").notNull().default("gpt-4o-mini"), // AI model used

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Index for fast lookups by post and language
    postLanguageIdx: uniqueIndex("tribePostTranslations_post_language_idx").on(
      table.postId,
      table.language,
    ),
    // Index for user's translation history
    translatedByIdx: index("tribePostTranslations_translatedBy_idx").on(
      table.translatedBy,
    ),
  }),
)

export const tribeCommentTranslations = pgTable(
  "tribeCommentTranslations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Foreign keys
    commentId: uuid("commentId")
      .notNull()
      .references(() => tribeComments.id, {
        onDelete: "cascade",
      }),

    // Translation details
    language: text("language").notNull(), // ISO 639-1 code: 'en', 'tr', 'de', etc.
    title: text("title"),
    content: text("content").notNull(),

    // Tracking
    translatedBy: uuid("translatedBy").references(() => users.id, {
      onDelete: "set null",
    }),
    creditsUsed: integer("creditsUsed").notNull().default(5),
    model: text("model").notNull().default("gpt-4o-mini"), // AI model used

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Index for fast lookups by post and language
    commentLanguageIdx: uniqueIndex(
      "tribeCommentTranslations_comment_language_idx",
    ).on(table.commentId, table.language),
    // Index for user's translation history
    translatedByIdx: index("tribeCommentTranslations_translatedBy_idx").on(
      table.translatedBy,
    ),
  }),
)

export const moltbookFollows = pgTable(
  "moltbookFollows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .notNull()
      .references(() => apps.id, {
        onDelete: "cascade",
      }),
    agentId: text("agentId").notNull(), // Moltbook agent ID
    agentName: text("agentName").notNull(), // Moltbook agent name
    followedOn: timestamp("followedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"), // Store additional info about the agent
  },
  (table) => ({
    uniqueFollow: uniqueIndex("unique_app_agent_follow").on(
      table.appId,
      table.agentId,
    ),
  }),
)

export const moltbookBlocks = pgTable(
  "moltbookBlocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .notNull()
      .references(() => apps.id, {
        onDelete: "cascade",
      }),
    agentId: text("agentId").notNull(), // Moltbook agent ID
    agentName: text("agentName").notNull(), // Moltbook agent name
    reason: text("reason"), // Why blocked (spam, low-quality, etc.)
    blockedOn: timestamp("blockedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"), // Store additional info
  },
  (table) => ({
    uniqueBlock: uniqueIndex("unique_app_agent_block").on(
      table.appId,
      table.agentId,
    ),
  }),
)

// ============================================
// TRIBE: In-house social network for user-created apps
// ============================================

export const tribes = pgTable(
  "tribes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    // Membership & engagement
    membersCount: integer("membersCount").notNull().default(0),
    postsCount: integer("postsCount").notNull().default(0),

    // Settings
    visibility: text("visibility", {
      enum: ["public", "private", "restricted"],
    })
      .notNull()
      .default("public"),

    // Moderation
    moderatorIds: jsonb("moderatorIds").$type<string[]>().default([]),
    rules: text("rules"),

    // Metadata
    metadata: jsonb("metadata").$type<{
      color?: string
      banner?: string
      tags?: string[]
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    searchIdx: index("tribes_search_idx").using(
      "gin",
      sql`to_tsvector('english', COALESCE(${table.name}, '') || ' ' || COALESCE(${table.description}, '') || ' ' || COALESCE(${table.slug}, ''))`,
    ),
  }),
)

export const tribeMemberships = pgTable(
  "tribeMemberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tribeId: uuid("tribeId")
      .notNull()
      .references(() => tribes.id, {
        onDelete: "cascade",
      }),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    role: text("role", {
      enum: ["member", "moderator", "admin"],
    })
      .notNull()
      .default("member"),

    joinedOn: timestamp("joinedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    lastTribePostAt: timestamp("lastTribePostAt", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => ({
    tribeUserIdx: uniqueIndex("tribeMemberships_tribe_user_idx").on(
      table.tribeId,
      table.userId,
    ),
    tribeGuestIdx: uniqueIndex("tribeMemberships_tribe_guest_idx").on(
      table.tribeId,
      table.guestId,
    ),
    identityCheck: check(
      "tribeMemberships_identity_xor",
      sql`(("userId" IS NULL)::int + ("guestId" IS NULL)::int) = 1`,
    ),
  }),
)

export const tribePosts = pgTable(
  "tribePosts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .notNull()
      .references(() => apps.id, {
        onDelete: "cascade",
      }),
    threadId: uuid("threadId").references((): AnyPgColumn => threads.id, {
      onDelete: "set null",
    }),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "set null",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "set null",
    }),
    language: text("language").notNull().default("en"),
    content: text("content").notNull(),
    title: text("title"),
    visibility: text("visibility", {
      enum: ["public", "tribe", "private"],
    })
      .notNull()
      .default("public"),

    // Media attachments
    images:
      jsonb("images").$type<
        {
          url: string
          width?: number
          height?: number
          alt?: string
          id: string
          prompt?: string
        }[]
      >(),
    videos:
      jsonb("videos").$type<
        {
          url: string
          thumbnail?: string
          duration?: number
          id: string
          prompt?: string
        }[]
      >(),

    // Engagement metrics
    likesCount: integer("likesCount").notNull().default(0),
    commentsCount: integer("commentsCount").notNull().default(0),
    sharesCount: integer("sharesCount").notNull().default(0),
    viewsCount: integer("viewsCount").notNull().default(0),

    // Tribe-specific
    tribeId: uuid("tribeId").references(() => tribes.id, {
      onDelete: "set null",
    }),
    tags: jsonb("tags").$type<string[]>().default([]),
    isPinned: boolean("isPinned").notNull().default(false),

    // SEO - AI-generated keywords for better discoverability
    seoKeywords: jsonb("seoKeywords").$type<string[]>(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      editHistory?: { content: string; editedAt: string }[]
      replyToPostId?: string
      quotedPostId?: string
      location?: string
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    searchIdx: index("tribePosts_search_idx").using(
      "gin",
      sql`to_tsvector('english', COALESCE(${table.title}, '') || ' ' || COALESCE(${table.content}, ''))`,
    ),
  }),
)

export const tribePostsRelations = relations(tribePosts, ({ one, many }) => ({
  app: one(apps, {
    fields: [tribePosts.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [tribePosts.userId],
    references: [users.id],
  }),
  tribe: one(tribes, {
    fields: [tribePosts.tribeId],
    references: [tribes.id],
  }),
  likes: many(tribeLikes),
  comments: many(tribeComments),
  reactions: many(tribeReactions),
  shares: many(tribeShares),
}))

export const tribeComments = pgTable(
  "tribeComments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("postId")
      .notNull()
      .references(() => tribePosts.id, {
        onDelete: "cascade",
      }),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "set null",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),

    // Nested comments (replies)
    parentCommentId: uuid("parentCommentId").references(
      (): AnyPgColumn => tribeComments.id,
      {
        onDelete: "cascade",
      },
    ),

    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    // Engagement
    likesCount: integer("likesCount").notNull().default(0),

    // Metadata
    metadata: jsonb("metadata").$type<{
      editHistory?: { content: string; editedAt: string }[]
      mentions?: string[]
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    searchIdx: index("tribeComments_search_idx").using(
      "gin",
      sql`to_tsvector('english', COALESCE(${table.content}, ''))`,
    ),
  }),
)

export const tribeLikes = pgTable(
  "tribeLikes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    postId: uuid("postId").references(() => tribePosts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("commentId").references(() => tribeComments.id, {
      onDelete: "cascade",
    }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // User post likes
    uniqueUserPostLike: uniqueIndex("unique_user_post_like_user")
      .on(table.userId, table.postId)
      .where(sql`${table.userId} IS NOT NULL AND ${table.postId} IS NOT NULL`),
    // Guest post likes
    uniqueGuestPostLike: uniqueIndex("unique_user_post_like_guest")
      .on(table.guestId, table.postId)
      .where(sql`${table.guestId} IS NOT NULL AND ${table.postId} IS NOT NULL`),
    // User comment likes
    uniqueUserCommentLike: uniqueIndex("unique_user_comment_like_user")
      .on(table.userId, table.commentId)
      .where(
        sql`${table.userId} IS NOT NULL AND ${table.commentId} IS NOT NULL`,
      ),
    // Guest comment likes
    uniqueGuestCommentLike: uniqueIndex("unique_user_comment_like_guest")
      .on(table.guestId, table.commentId)
      .where(
        sql`${table.guestId} IS NOT NULL AND ${table.commentId} IS NOT NULL`,
      ),
  }),
)

export const tribeFollows = pgTable(
  "tribeFollows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("followerId").references(() => users.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    followerGuestId: uuid("followerGuestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    followingAppId: uuid("followingAppId")
      .notNull()
      .references(() => apps.id, {
        onDelete: "cascade",
      }),

    // Notification preferences
    notifications: boolean("notifications").notNull().default(true),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // User follows
    uniqueUserFollow: uniqueIndex("unique_tribe_follow_user")
      .on(table.followerId, table.followingAppId)
      .where(
        sql`${table.followerId} IS NOT NULL AND ${table.followingAppId} IS NOT NULL`,
      ),
    // Guest follows
    uniqueGuestFollow: uniqueIndex("unique_tribe_follow_guest")
      .on(table.followerGuestId, table.followingAppId)
      .where(
        sql`${table.followerGuestId} IS NOT NULL AND ${table.followingAppId} IS NOT NULL`,
      ),
  }),
)

export const tribeBlocks = pgTable(
  "tribeBlocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockerId: uuid("blockerId").references(() => users.id, {
      onDelete: "cascade",
    }),
    blockerGuestId: uuid("blockerGuestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    blockedAppId: uuid("blockedAppId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    blockedUserId: uuid("blockedUserId").references(() => users.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    reason: text("reason"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // User blocks app
    uniqueUserBlocksApp: uniqueIndex("unique_tribe_user_blocks_app")
      .on(table.blockerId, table.blockedAppId)
      .where(
        sql`${table.blockerId} IS NOT NULL AND ${table.blockedAppId} IS NOT NULL`,
      ),
    // Guest blocks app
    uniqueGuestBlocksApp: uniqueIndex("unique_tribe_guest_blocks_app")
      .on(table.blockerGuestId, table.blockedAppId)
      .where(
        sql`${table.blockerGuestId} IS NOT NULL AND ${table.blockedAppId} IS NOT NULL`,
      ),
    // User blocks user
    uniqueUserBlocksUser: uniqueIndex("unique_tribe_user_blocks_user")
      .on(table.blockerId, table.blockedUserId)
      .where(
        sql`${table.blockerId} IS NOT NULL AND ${table.blockedUserId} IS NOT NULL`,
      ),
    // Guest blocks user
    uniqueGuestBlocksUser: uniqueIndex("unique_tribe_guest_blocks_user")
      .on(table.blockerGuestId, table.blockedUserId)
      .where(
        sql`${table.blockerGuestId} IS NOT NULL AND ${table.blockedUserId} IS NOT NULL`,
      ),
  }),
)

export const tribeReactions = pgTable(
  "tribeReactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),
    postId: uuid("postId").references(() => tribePosts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("commentId").references(() => tribeComments.id, {
      onDelete: "cascade",
    }),

    // Reaction type: ❤️ 😂 😮 😢 😡 👍 🔥 etc.
    emoji: text("emoji").notNull(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // User post reactions
    uniqueUserPostReaction: uniqueIndex("unique_user_post_reaction_user")
      .on(table.userId, table.postId, table.emoji)
      .where(sql`${table.userId} IS NOT NULL AND ${table.postId} IS NOT NULL`),
    // Guest post reactions
    uniqueGuestPostReaction: uniqueIndex("unique_user_post_reaction_guest")
      .on(table.guestId, table.postId, table.emoji)
      .where(sql`${table.guestId} IS NOT NULL AND ${table.postId} IS NOT NULL`),
    // User comment reactions
    uniqueUserCommentReaction: uniqueIndex("unique_user_comment_reaction_user")
      .on(table.userId, table.commentId, table.emoji)
      .where(
        sql`${table.userId} IS NOT NULL AND ${table.commentId} IS NOT NULL`,
      ),
    // Guest comment reactions
    uniqueGuestCommentReaction: uniqueIndex(
      "unique_user_comment_reaction_guest",
    )
      .on(table.guestId, table.commentId, table.emoji)
      .where(
        sql`${table.guestId} IS NOT NULL AND ${table.commentId} IS NOT NULL`,
      ),
  }),
)

export const tribeShares = pgTable("tribeShares", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("postId")
    .notNull()
    .references(() => tribePosts.id, {
      onDelete: "cascade",
    }),
  userId: uuid("userId").references(() => users.id, {
    onDelete: "cascade",
  }),
  guestId: uuid("guestId").references(() => guests.id, {
    onDelete: "cascade",
  }),

  appId: uuid("appId").references(() => apps.id, {
    onDelete: "cascade",
  }),

  // Share context
  comment: text("comment"), // Optional comment when sharing
  sharedTo: text("sharedTo", {
    enum: ["tribe", "external", "direct"],
  })
    .notNull()
    .default("tribe"),

  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

// ============================================
// TRIBE NEWS: Cached news articles for agent context
// ============================================

export const tribeNews = pgTable(
  "tribeNews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"), // Full or enriched article body (scraped from URL)
    url: text("url").notNull().unique(),
    source: text("source"),
    country: text("country"), // NewsAPI country code e.g. "us", "de", "tr"
    category: text("category"), // locale code e.g. "en", "de", "tr"
    publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true }),
    fetchedAt: timestamp("fetchedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => ({
    embeddingIndex: index("tribe_news_embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
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
    userId: uuid("userId").references(() => users.id, {
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
    userIdIdx: index("scheduledJobs_userId_idx").on(table.userId),
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
  userId: uuid("userId").references((): AnyPgColumn => users.id, {
    onDelete: "cascade",
  }),
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
  userId: uuid("userId").references(() => users.id, {
    onDelete: "cascade",
  }),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
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
      feedbackUserId?: string
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
    index("credit_usage_user_date_idx").on(table.userId, table.createdOn),
    index("credit_usage_guest_date_idx").on(table.guestId, table.createdOn),
    index("credit_usage_thread_idx").on(table.threadId),
  ],
)

export const systemLogs = pgTable("systemLogs", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  level: text("level", { enum: ["info", "warn", "error"] }).notNull(),
  userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
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

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  threadId: uuid("threadId").references(() => threads.id, {
    onDelete: "cascade",
  }),
  userId: uuid("userId").references(() => users.id, {
    onDelete: "cascade",
  }),
  guestId: uuid("guestId").references(() => guests.id, {
    onDelete: "cascade",
  }),
  email: text("email").notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  gift: uuid("gift"),
  status: text("status", {
    enum: ["accepted", "pending"],
  }).default("pending"),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Content and metadata
    content: text("content").notNull(),
    chunkIndex: integer("chunkIndex").notNull(),
    filename: text("filename").notNull(),
    fileType: text("fileType").notNull(),

    // Vector embedding using pgvector
    embedding: vector("embedding", { dimensions: 1536 }),

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

// const config = pgTable("config", {
//   id: uuid("id").defaultRandom().notNull().primaryKey(),
//    metadata: jsonb("metadata").$type<{
//       TEST_MEMBER_FINGERPRINTS: string[]
//       TEST_GUEST_FINGERPRINTS: string[]
//       TEST_MEMBER_EMAILS: string[]
//       TEST_LIVE_FINGERPRINTS: string[]
//       lastUpdated: string
//     }>(),
// })

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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Message content and metadata
    content: text("content").notNull(),
    role: text("role").notNull(), // 'user' or 'assistant'

    // Vector embedding for semantic search
    embedding: vector("embedding", { dimensions: 1536 }),

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
    index("message_embeddings_user_idx").on(table.userId),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    embedding: vector("embedding", { dimensions: 1536 }),

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
    index("thread_summaries_user_idx").on(table.userId),
    index("thread_summaries_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("thread_summaries_topics_idx").using("gin", table.keyTopics),
  ],
)

// User memories for persistent context across conversations
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    embedding: vector("embedding", { dimensions: 1536 }),

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
    index("user_memories_user_idx").on(table.userId),
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

export const sonarIssues = pgTable(
  "sonarIssues",
  {
    id: text("id").primaryKey(), // SonarCloud issue key
    projectKey: text("projectKey").notNull(), // e.g., "chrryAI_vex"
    ruleKey: text("ruleKey").notNull(), // e.g., "typescript:S5332"
    severity: text("severity", {
      enum: ["INFO", "MINOR", "MAJOR", "CRITICAL", "BLOCKER"],
    }).notNull(),
    type: text("type", {
      enum: ["BUG", "VULNERABILITY", "CODE_SMELL", "SECURITY_HOTSPOT"],
    }).notNull(),
    status: text("status", {
      enum: ["OPEN", "CONFIRMED", "REOPENED", "RESOLVED", "CLOSED"],
    }).notNull(),
    filePath: text("filePath").notNull(),
    lineNumber: integer("lineNumber"),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    resolvedAt: timestamp("resolvedAt", {
      mode: "date",
      withTimezone: true,
    }),
    syncedAt: timestamp("syncedAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdx: index("sonarIssues_project_idx").on(table.projectKey),
    statusIdx: index("sonarIssues_status_idx").on(table.status),
    fileIdx: index("sonarIssues_file_idx").on(table.filePath),
    typeIdx: index("sonarIssues_type_idx").on(table.type),
    severityIdx: index("sonarIssues_severity_idx").on(table.severity),
  }),
)

export const sonarMetrics = pgTable(
  "sonarMetrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectKey: text("projectKey").notNull(),
    metricKey: text("metricKey").notNull(), // e.g., "bugs", "vulnerabilities", "code_smells"
    value: real("value").notNull(),
    measuredAt: timestamp("measuredAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    syncedAt: timestamp("syncedAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectMetricIdx: index("sonarMetrics_project_metric_idx").on(
      table.projectKey,
      table.metricKey,
    ),
    measuredAtIdx: index("sonarMetrics_measuredAt_idx").on(table.measuredAt),
  }),
)

// Character tags and personality profiles for AI agents
export const characterProfiles = pgTable(
  "characterProfiles",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    agentId: uuid("agentId").references(() => aiAgents.id, {
      onDelete: "cascade",
    }),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    embedding: vector("embedding", { dimensions: 1536 }),

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
    index("character_profiles_user_idx").on(table.userId),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    index("calendar_events_user_idx").on(table.userId),
    index("calendar_events_guest_idx").on(table.guestId),
    index("calendar_events_time_idx").on(table.startTime, table.endTime),
    index("calendar_events_thread_idx").on(table.threadId),
    index("calendar_events_external_idx").on(
      table.externalId,
      table.externalSource,
    ),
    // Composite index for efficient date range queries
    index("calendar_events_user_time_idx").on(table.userId, table.startTime),
    index("calendar_events_guest_time_idx").on(table.guestId, table.startTime),
  ],
)

// Affiliate System Tables
export const affiliateLinks = pgTable(
  "affiliateLinks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    code: text("code").unique().notNull(),
    clicks: integer("clicks").default(0).notNull(),
    conversions: integer("conversions").default(0).notNull(),
    totalRevenue: integer("totalRevenue").default(0).notNull(), // in cents
    commissionEarned: integer("commissionEarned").default(0).notNull(), // in cents
    commissionPaid: integer("commissionPaid").default(0).notNull(), // in cents
    commissionRate: integer("commissionRate").default(20).notNull(), // percentage (20 = 20%)
    status: text("status", {
      enum: ["active", "inActive"],
    })
      .notNull()
      .default("active"),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("affiliate_links_code_idx").on(table.code),
    index("affiliate_links_user_idx").on(table.userId),
    index("affiliate_links_status_idx").on(table.status),
  ],
)

export const affiliateClicks = pgTable(
  "affiliateClicks",
  {
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    id: uuid("id").defaultRandom().primaryKey(),
    affiliateLinkId: uuid("affiliateLinkId")
      .references(() => affiliateLinks.id, { onDelete: "cascade" })
      .notNull(),
    clickedOn: timestamp("clickedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    referrer: text("referrer"),
    converted: boolean("converted").notNull().default(false),
    convertedOn: timestamp("convertedOn", { mode: "date", withTimezone: true }),
  },
  (table) => [
    index("affiliate_clicks_link_idx").on(table.affiliateLinkId),
    index("affiliate_clicks_clicked_on_idx").on(table.clickedOn),
    index("affiliate_clicks_converted_idx").on(table.converted),
    index("affiliate_clicks_ip_idx").on(table.ipAddress),
    index("affiliate_clicks_converted_on_idx").on(table.convertedOn),
    index("affiliate_clicks_user_agent_idx").on(table.userAgent),
  ],
)

export const affiliateReferrals = pgTable(
  "affiliateReferrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    affiliateLinkId: uuid("affiliate_link_id")
      .references(() => affiliateLinks.id, { onDelete: "cascade" })
      .notNull(),
    referredUserId: uuid("referredUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    referredGuestId: uuid("referredGuestId").references(() => guests.id, {
      onDelete: "set null",
    }),
    subscriptionId: uuid("subscriptionId").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: ["pending", "converted", "paid", "canceled"],
    })
      .default("pending")
      .notNull(),
    commissionAmount: integer("commissionAmount").default(0).notNull(), // in cents
    bonusCredits: integer("bonusCredits").default(0).notNull(),
    convertedOn: timestamp("convertedOn", {
      mode: "date",
      withTimezone: true,
    }),
    paidOn: timestamp("paidOn", { mode: "date", withTimezone: true }),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("affiliate_referrals_link_idx").on(table.affiliateLinkId),
    index("affiliate_referrals_user_idx").on(table.referredUserId),
    index("affiliate_referrals_guest_idx").on(table.referredGuestId),
    index("affiliate_referrals_subscription_idx").on(table.subscriptionId),
    index("affiliate_referrals_status_idx").on(table.status),
  ],
)

// Grape Advertising System Tables
export const adCampaigns = pgTable(
  "adCampaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Advertiser (user who created the campaign)
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    // Campaign thread for AI conversation and artifacts
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "set null",
    }),

    // Critical campaign info
    name: text("name").notNull(), // Campaign name
    status: text("status", {
      enum: ["draft", "active", "paused", "completed", "archived"],
    })
      .notNull()
      .default("draft"),

    // Budget & Pricing
    budget: integer("budget").default(0).notNull(), // Total budget in cents
    spent: integer("spent").default(0).notNull(), // Amount spent in cents
    pricingModel: text("pricingModel", {
      enum: ["cpv", "cpc", "cpa"], // Cost per view, click, action
    })
      .notNull()
      .default("cpv"),
    pricePerUnit: integer("pricePerUnit").default(2).notNull(), // Price in cents (e.g., $0.02 = 2 cents)

    // Performance metrics (critical for dashboard)
    views: integer("views").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    conversions: integer("conversions").default(0).notNull(),

    // Targeting (stored as JSONB for flexibility)
    targetCategories: jsonb("targetCategories").$type<string[]>(), // Content categories

    // Timestamps
    startDate: timestamp("startDate", { mode: "date", withTimezone: true }),
    endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ad_campaigns_user_idx").on(table.userId),
    index("ad_campaigns_status_idx").on(table.status),
    index("ad_campaigns_thread_idx").on(table.threadId),
    index("ad_campaigns_pricing_idx").on(table.pricingModel),
  ],
)

export const adCreatives = pgTable(
  "adCreatives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaignId")
      .references(() => adCampaigns.id, { onDelete: "cascade" })
      .notNull(),

    // Ad content (AI-generated or manual)
    headline: text("headline").notNull(),
    body: text("body"),
    cta: text("cta"), // Call to action
    imageUrl: text("imageUrl"),
    targetUrl: text("targetUrl"), // Where clicks go

    // Performance for A/B testing
    views: integer("views").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    conversions: integer("conversions").default(0).notNull(),

    // Status
    status: text("status", {
      enum: ["active", "paused", "archived"],
    })
      .notNull()
      .default("active"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ad_creatives_campaign_idx").on(table.campaignId),
    index("ad_creatives_status_idx").on(table.status),
  ],
)

export const adViews = pgTable(
  "adViews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaignId")
      .references(() => adCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    creativeId: uuid("creativeId")
      .references(() => adCreatives.id, { onDelete: "cascade" })
      .notNull(),

    // Viewer (who saw the ad)
    userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "set null",
    }),

    // Context (privacy-first - no personal data)
    contentUrl: text("contentUrl"), // Where ad was shown
    contentCategory: text("contentCategory"), // Content topic

    // Earnings for viewer
    earningAmount: integer("earningAmount").default(0).notNull(), // In cents
    paid: boolean("paid").default(false).notNull(),

    // Interaction
    clicked: boolean("clicked").default(false).notNull(),
    clickedOn: timestamp("clickedOn", { mode: "date", withTimezone: true }),
    converted: boolean("converted").default(false).notNull(),
    convertedOn: timestamp("convertedOn", { mode: "date", withTimezone: true }),

    viewedOn: timestamp("viewedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ad_views_campaign_idx").on(table.campaignId),
    index("ad_views_creative_idx").on(table.creativeId),
    index("ad_views_user_idx").on(table.userId),
    index("ad_views_guest_idx").on(table.guestId),
    index("ad_views_clicked_idx").on(table.clicked),
    index("ad_views_converted_idx").on(table.converted),
    index("ad_views_viewed_on_idx").on(table.viewedOn),
    index("ad_views_category_idx").on(table.contentCategory),
  ],
)

export const adEarnings = pgTable(
  "adEarnings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Earner (viewer or publisher)
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Earnings summary
    totalEarnings: integer("totalEarnings").default(0).notNull(), // In cents
    paidOut: integer("paidOut").default(0).notNull(), // In cents
    pendingPayout: integer("pendingPayout").default(0).notNull(), // In cents

    // Stats
    totalViews: integer("totalViews").default(0).notNull(),
    totalClicks: integer("totalClicks").default(0).notNull(),

    // Timestamps
    lastPayoutOn: timestamp("lastPayoutOn", {
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
    index("ad_earnings_user_idx").on(table.userId),
    index("ad_earnings_guest_idx").on(table.guestId),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    reviewedBy: uuid("reviewedBy").references(() => users.id), // Admin who reviewed
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
      userIdIndex: index("app_user_idx").on(table.userId),
      guestIdIndex: index("app_guest_idx").on(table.guestId),
      visibilityIndex: index("app_visibility_idx").on(table.visibility),
      tagsIndex: index("app_tags_idx").using("gin", table.tags),
      slugIndex: index("app_slug_idx").on(table.slug),
      // Unique constraint: store can't have duplicate slugs (clean URLs)
      storeSlugUnique: uniqueIndex("app_store_slug_unique").on(
        table.storeId,
        table.slug,
      ),
      // Unique constraint: user can't have duplicate slugs
      userSlugUnique: uniqueIndex("app_user_slug_store_unique").on(
        table.userId,
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

// Add to schema.ts:

export const feedbackCampaignStatusEnum = pgEnum("feedbackCampaignStatus", [
  "draft",
  "active",
  "paused",
  "completed",
])

export const feedbackCampaigns = pgTable("feedbackCampaign", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["app", "website", "product"] })
    .notNull()
    .default("website"),
  url: text("url"), // Product/app URL
  budget: integer("budget").notNull(), // Total budget in cents
  pricePerCompletion: integer("pricePerCompletion").notNull(), // Payment per feedback
  targetCompletions: integer("targetCompletions").notNull(),
  currentCompletions: integer("currentCompletions").default(0),
  status: feedbackCampaignStatusEnum("status").notNull().default("draft"),
  embedCode: text("embedCode"), // For website widget
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const feedbackTasks = pgTable("feedbackTask", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaignId")
    .notNull()
    .references(() => feedbackCampaigns.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  order: integer("order").notNull(),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const feedbackSubmissionStatusEnum = pgEnum("feedbackSubmissionStatus", [
  "pending",
  "approved",
  "rejected",
  "revision_requested",
])

export const feedbackSubmissions = pgTable("feedbackSubmission", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaignId")
    .notNull()
    .references(() => feedbackCampaigns.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoUrl: text("videoUrl").notNull(), // Uploaded video recording
  status: feedbackSubmissionStatusEnum("status").notNull().default("pending"),
  paymentReleased: boolean("paymentReleased").default(false),
  createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  approvedOn: timestamp("approvedOn", { mode: "date", withTimezone: true }),
})

export const appOrders = pgTable(
  "appOrders",
  {
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    storeId: uuid("storeId").references(() => stores.id, {
      onDelete: "cascade",
    }),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    order: integer("order").notNull(),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      // Unique constraint: one app can only have one order per store+user/guest
      appStoreUserUnique: uniqueIndex("app_order_app_store_user_unique").on(
        table.appId,
        table.storeId,
        table.userId,
      ),
      appStoreGuestUnique: uniqueIndex("app_order_app_store_guest_unique").on(
        table.appId,
        table.storeId,
        table.guestId,
      ),
      // Index for fast lookups by store
      storeIdIndex: index("app_order_store_id_idx").on(table.storeId),
      // Index for fast lookups by user
      userIdIndex: index("app_order_user_id_idx").on(table.userId),
      // Index for fast lookups by guest
      guestIdIndex: index("app_order_guest_id_idx").on(table.guestId),
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
    userId: uuid("userId").references((): AnyPgColumn => users.id, {
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
      userIdIndex: index("stores_user_idx").on(table.userId),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
      userIdIndex: index("installs_user_idx").on(table.userId),
      guestIdIndex: index("installs_guest_idx").on(table.guestId),
      installedAtIndex: index("installs_installed_at_idx").on(
        table.installedAt,
      ),
      // Unique constraint: user can only install an app once (unless uninstalled)
      userAppUnique: uniqueIndex("installs_user_app_unique").on(
        table.userId,
        table.appId,
      ),
      guestAppUnique: uniqueIndex("installs_guest_app_unique").on(
        table.guestId,
        table.appId,
      ),
      // Unique constraint: user can only install a store once
      userStoreUnique: uniqueIndex("installs_user_store_unique").on(
        table.userId,
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

// News Articles - Store news from various sources (CNN, Bloomberg, etc.)
export const newsArticles = pgTable(
  "newsArticles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Source information
    source: text("source").notNull(), // "cnn", "bloomberg", "nyt", "techcrunch", etc.
    sourceUrl: text("sourceUrl").notNull(), // Original article URL

    // Article content
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"), // Full article text
    summary: text("summary"), // AI-generated summary

    // Metadata
    author: text("author"),
    category: text("category"), // "world", "business", "tech", "sports", etc.
    tags: text("tags").array().default([]),
    imageUrl: text("imageUrl"),

    // Timestamps
    publishedAt: timestamp("publishedAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    fetchedAt: timestamp("fetchedAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),

    // Analytics
    viewCount: integer("viewCount").notNull().default(0),
    shareCount: integer("shareCount").notNull().default(0),

    // Search
    embedding: vector("embedding", { dimensions: 1536 }), // For semantic search

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      sourceIndex: index("news_articles_source_idx").on(table.source),
      categoryIndex: index("news_articles_category_idx").on(table.category),
      publishedAtIndex: index("news_articles_published_at_idx").on(
        table.publishedAt,
      ),
      embeddingIndex: index("news_articles_embedding_idx").using(
        "hnsw",
        table.embedding.op("vector_cosine_ops"),
      ),
      // Unique constraint: same article from same source
      sourceUrlUnique: uniqueIndex("news_articles_source_url_unique").on(
        table.source,
        table.sourceUrl,
      ),
    },
  ],
)

// Vex Platform API Usage - Track Vex core API (chat, LifeOS apps)
export const vexApiUsage = pgTable(
  "vexApiUsage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }), // API consumer
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Which Vex API endpoint
    endpoint: text("endpoint").notNull(), // "chat", "atlas", "bloom", "peach", "vault"

    // Request details
    requestCount: integer("requestCount").notNull().default(0),
    successCount: integer("successCount").notNull().default(0),
    errorCount: integer("errorCount").notNull().default(0),
    totalTokens: integer("totalTokens").notNull().default(0),

    // Tools

    // Billing
    amount: integer("amount").notNull().default(0), // Amount charged in cents (100% to Vex)
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
      userIdIndex: index("vex_api_usage_user_idx").on(table.userId),
      guestIdIndex: index("vex_api_usage_guest_idx").on(table.guestId),
      endpointIndex: index("vex_api_usage_endpoint_idx").on(table.endpoint),
      periodIndex: index("vex_api_usage_period_idx").on(table.periodStart),
    },
  ],
)

// Agent API Usage - Track custom agent API requests and billing
export const agentApiUsage = pgTable(
  "agentApiUsage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }), // API consumer
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
      userIdIndex: index("agent_api_usage_user_idx").on(table.userId),
      guestIdIndex: index("agent_api_usage_guest_idx").on(table.guestId),
      periodIndex: index("agent_api_usage_period_idx").on(table.periodStart),
    },
  ],
)

// Agent Subscriptions - Track who subscribed to which custom agents
export const agentSubscriptions = pgTable(
  "agentSubscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Subscription details
    status: text("status", {
      enum: ["active", "canceled", "expired", "trial"],
    })
      .notNull()
      .default("active"),
    pricing: text("pricing", {
      enum: ["free", "one-time", "subscription"],
    }).notNull(),
    amount: integer("amount").notNull().default(0), // Amount paid in cents
    currency: text("currency").default("usd"),

    // Stripe
    stripeSubscriptionId: text("stripeSubscriptionId"), // For recurring subscriptions
    stripePaymentIntentId: text("stripePaymentIntentId"), // For one-time payments

    // Dates
    startDate: timestamp("startDate", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    endDate: timestamp("endDate", { mode: "date", withTimezone: true }), // For subscriptions
    canceledAt: timestamp("canceledAt", { mode: "date", withTimezone: true }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      appIdIndex: index("agent_sub_app_idx").on(table.appId),
      userIdIndex: index("agent_sub_user_idx").on(table.userId),
      guestIdIndex: index("agent_sub_guest_idx").on(table.guestId),
      statusIndex: index("agent_sub_status_idx").on(table.status),
    },
  ],
)

// Agent Payouts - Track creator earnings
export const agentPayouts = pgTable(
  "agentPayouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("appId")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    creatorUserId: uuid("creatorUserId").references(() => users.id, {
      onDelete: "cascade",
    }),
    creatorGuestId: uuid("creatorGuestId").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Payout details
    amount: integer("amount").notNull(), // Amount in cents
    currency: text("currency").default("usd"),
    status: text("status", {
      enum: ["pending", "processing", "paid", "failed"],
    })
      .notNull()
      .default("pending"),

    // Period
    periodStart: timestamp("periodStart", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    periodEnd: timestamp("periodEnd", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    // Stripe
    stripePayoutId: text("stripePayoutId"),
    stripeTransferId: text("stripeTransferId"),

    // Metadata
    subscriptionCount: integer("subscriptionCount").notNull().default(0),
    totalRevenue: integer("totalRevenue").notNull().default(0), // Before revenue share
    platformFee: integer("platformFee").notNull().default(0), // Vex's cut

    paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      appIdIndex: index("agent_payout_app_idx").on(table.appId),
      creatorUserIdIndex: index("agent_payout_creator_user_idx").on(
        table.creatorUserId,
      ),
      creatorGuestIdIndex: index("agent_payout_creator_guest_idx").on(
        table.creatorGuestId,
      ),
      statusIndex: index("agent_payout_status_idx").on(table.status),
    },
  ],
)

export const instructions = pgTable("instructions", {
  appId: uuid("appId").references(() => apps.id, { onDelete: "set null" }),
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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

export const affiliatePayouts = pgTable(
  "affiliatePayouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    affiliateLinkId: uuid("affiliateLinkId")
      .references(() => affiliateLinks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(), // in cents
    method: text("method", { enum: ["paypal", "stripe", "bank_transfer"] })
      .default("stripe")
      .notNull(),
    paypalEmail: text("paypalEmail"),
    stripeAccountId: text("stripeAccountId"),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    transactionId: text("transactionId"),
    notes: text("notes"),
    requestedOn: timestamp("requestedOn", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    processedOn: timestamp("processedOn", {
      mode: "date",
      withTimezone: true,
    }),
    completedOn: timestamp("completedOn", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    index("affiliate_payouts_link_idx").on(table.affiliateLinkId),
    index("affiliate_payouts_user_idx").on(table.userId),
    index("affiliate_payouts_status_idx").on(table.status),
  ],
)

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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    index("expenses_user_idx").on(table.userId),
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    index("budgets_user_idx").on(table.userId),
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
          userId?: string
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    index("analytics_sites_user_idx").on(table.userId),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
  guestId: uuid("guestId").references(() => guests.id, { onDelete: "cascade" }),
})

export type analyticsSession = typeof analyticsSessions.$inferSelect
export type newAnalyticsSession = typeof analyticsSessions.$inferInsert

// ============================================================================
// PEAR FEEDBACK ANALYTICS SYSTEM
// ============================================================================

export const pearFeedback = pgTable(
  "pearFeedback",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    // Relations
    messageId: uuid("messageId").references(() => messages.id, {
      onDelete: "cascade",
    }),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guestId").references(() => guests.id, {
      onDelete: "cascade",
    }),
    appId: uuid("appId").references(() => apps.id, {
      onDelete: "cascade",
    }),

    // Feedback content
    content: text("content").notNull(),

    // Categorization
    feedbackType: text("feedbackType", {
      enum: ["complaint", "suggestion", "praise", "bug", "feature_request"],
    }).notNull(),

    category: text("category", {
      enum: [
        "ux",
        "performance",
        "feature",
        "bug",
        "keyboard_shortcuts",
        "ui_design",
        "analytics",
        "other",
      ],
    }).notNull(),

    // Advanced analytics fields (AI-suggested for deeper insights)
    categoryTags: jsonb("categoryTags").$type<string[]>(), // Multiple categories: ["ux", "performance"]
    comparativeMention: text("comparativeMention"), // Track competitor comparisons: "better_than_notion"
    firstImpression: boolean("firstImpression").default(false), // Flag feedback from first 30 seconds
    emotionalTags: jsonb("emotionalTags").$type<string[]>(), // Emotional responses: ["delighted", "frustrated"]

    // AI-powered scoring (0-1 scale)
    sentimentScore: real("sentimentScore").notNull(), // -1 (negative) to +1 (positive)
    specificityScore: real("specificityScore").notNull(), // 0 (vague) to 1 (specific)
    actionabilityScore: real("actionabilityScore").notNull(), // 0 (not actionable) to 1 (actionable)

    // Metadata
    metadata: jsonb("metadata").$type<{
      positivityFactors?: string[]
      praiseCategories?: string[]
      suggestedActions?: string[]
      relatedFeatures?: string[]
    }>(),

    // Status tracking
    status: text("status", {
      enum: ["pending", "reviewed", "in_progress", "resolved", "wont_fix"],
    })
      .notNull()
      .default("pending"),

    // M2M (Machine-to-Machine) feedback tracking
    source: text("source", { enum: ["human", "m2m"] })
      .notNull()
      .default("human"),
    sourceAppId: uuid("sourceAppId").references(() => apps.id, {
      onDelete: "set null",
    }),

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedOn: timestamp("resolvedOn", { mode: "date", withTimezone: true }),
  },
  (table) => ({
    appIdIdx: index("pearFeedback_appId_idx").on(table.appId),
    userIdIdx: index("pearFeedback_userId_idx").on(table.userId),
    feedbackTypeIdx: index("pearFeedback_feedbackType_idx").on(
      table.feedbackType,
    ),
    categoryIdx: index("pearFeedback_category_idx").on(table.category),
    sentimentScoreIdx: index("pearFeedback_sentimentScore_idx").on(
      table.sentimentScore,
    ),
    createdOnIdx: index("pearFeedback_createdOn_idx").on(table.createdOn),
    sourceIdx: index("pearFeedback_source_idx").on(table.source),
    m2mDedupIdx: index("pearFeedback_m2m_dedup_idx").on(
      table.sourceAppId,
      table.appId,
      table.source,
    ),
    m2mSourceRequired: check(
      "pearFeedback_m2m_source_required",
      sql`"source" != 'm2m' OR "sourceAppId" IS NOT NULL`,
    ),
  }),
)

export type PearFeedback = typeof pearFeedback.$inferSelect
export type NewPearFeedback = typeof pearFeedback.$inferInsert

// ============================================================================
// RETRO (DAILY CHECK-IN) TRACKING SYSTEM
// ============================================================================

export const retroSessions = pgTable(
  "retroSessions",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    // Relations
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
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
    userIdIdx: index("retroSessions_userId_idx").on(table.userId),
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
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
    }),
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
    userIdIdx: index("retroResponses_userId_idx").on(table.userId),
    appIdIdx: index("retroResponses_appId_idx").on(table.appId),
    askedAtIdx: index("retroResponses_askedAt_idx").on(table.askedAt),
    skippedIdx: index("retroResponses_skipped_idx").on(table.skipped),
  }),
)

export type RetroSession = typeof retroSessions.$inferSelect
export type NewRetroSession = typeof retroSessions.$inferInsert

export type RetroResponse = typeof retroResponses.$inferSelect
export type NewRetroResponse = typeof retroResponses.$inferInsert

// ============================================================================
// TALENT MARKETPLACE: Sovereign Hiring System
// ============================================================================

export const talentProfiles = pgTable(
  "talentProfiles",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Public identity
    displayName: text("displayName").notNull(),
    tagline: text("tagline"),
    bio: text("bio"),
    githubUrl: text("githubUrl"),

    // AI Validation Scores
    validationScore: real("validationScore").default(0), // 0-1
    actionabilityScore: real("actionabilityScore").default(0), // 0-1
    velocityScore: real("velocityScore").default(0), // Tasks/week

    // Reputation
    pearCreditsEarned: integer("pearCreditsEarned").default(0),
    feedbackScore: real("feedbackScore").default(0),

    // Availability
    isHireable: boolean("isHireable").default(true),
    hourlyRate: integer("hourlyRate"),
    availability: text("availability", {
      enum: ["full-time", "part-time", "contract", "not-available"],
    }),

    // Pre-chat barrier
    preChatCredits: integer("preChatCredits").default(300),

    // Skills
    skills: jsonb("skills").$type<string[]>(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      timezone?: string
      languages?: string[]
      preferredStack?: string[]
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("talentProfiles_userId_idx").on(table.userId),
    isHireableIdx: index("talentProfiles_isHireable_idx").on(table.isHireable),
    validationScoreIdx: index("talentProfiles_validationScore_idx").on(
      table.validationScore,
    ),
  }),
)

export const talentThreads = pgTable(
  "talentThreads",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    talentProfileId: uuid("talentProfileId")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    threadId: uuid("threadId")
      .references(() => threads.id, { onDelete: "cascade" })
      .notNull(),

    // Visibility
    visibility: text("visibility", {
      enum: ["public", "unlisted", "private"],
    }).default("public"),

    // Showcase metadata
    title: text("title").notNull(),
    description: text("description"),
    tags: jsonb("tags").$type<string[]>(),

    // AI analysis
    complexity: real("complexity"),
    impactScore: real("impactScore"),
    innovationScore: real("innovationScore"),

    // Engagement
    views: integer("views").default(0),
    likes: integer("likes").default(0),

    // Featured
    isFeatured: boolean("isFeatured").default(false),
    featuredOrder: integer("featuredOrder"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    talentProfileIdIdx: index("talentThreads_talentProfileId_idx").on(
      table.talentProfileId,
    ),
    threadIdIdx: index("talentThreads_threadId_idx").on(table.threadId),
    visibilityIdx: index("talentThreads_visibility_idx").on(table.visibility),
    isFeaturedIdx: index("talentThreads_isFeatured_idx").on(table.isFeatured),
  }),
)

export const recruitmentFlows = pgTable(
  "recruitmentFlows",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    // Parties
    talentProfileId: uuid("talentProfileId")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    companyUserId: uuid("companyUserId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Pre-chat payment
    preChatPaid: boolean("preChatPaid").default(false),
    preChatCredits: integer("preChatCredits").default(300),
    paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),

    // Conversation
    threadId: uuid("threadId").references(() => threads.id, {
      onDelete: "set null",
    }),

    // Status
    status: text("status", {
      enum: [
        "pending",
        "chatting",
        "interviewing",
        "offer",
        "hired",
        "rejected",
        "withdrawn",
      ],
    }).default("pending"),

    // Offer details
    offerAmount: integer("offerAmount"),
    offerType: text("offerType", {
      enum: ["full-time", "part-time", "contract"],
    }),
    offerDetails: jsonb("offerDetails").$type<{
      startDate?: string
      duration?: string
      benefits?: string[]
    }>(),

    // Metadata
    companyName: text("companyName"),
    companySize: text("companySize"),
    notes: text("notes"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    talentProfileIdIdx: index("recruitmentFlows_talentProfileId_idx").on(
      table.talentProfileId,
    ),
    companyUserIdIdx: index("recruitmentFlows_companyUserId_idx").on(
      table.companyUserId,
    ),
    statusIdx: index("recruitmentFlows_status_idx").on(table.status),
    preChatPaidIdx: index("recruitmentFlows_preChatPaid_idx").on(
      table.preChatPaid,
    ),
  }),
)

export const talentEarnings = pgTable(
  "talentEarnings",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    talentProfileId: uuid("talentProfileId")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    recruitmentFlowId: uuid("recruitmentFlowId").references(
      () => recruitmentFlows.id,
      {
        onDelete: "cascade",
      },
    ),

    // Transaction
    type: text("type", {
      enum: ["pre-chat", "contract", "referral", "pear-feedback"],
    }).notNull(),

    // Amounts
    grossAmount: integer("grossAmount").notNull(),
    platformFee: integer("platformFee").notNull(), // 30%
    netAmount: integer("netAmount").notNull(), // 70%

    // Status
    status: text("status", {
      enum: ["pending", "completed", "withdrawn", "refunded"],
    }).default("pending"),

    // Payout
    withdrawnAt: timestamp("withdrawnAt", { mode: "date", withTimezone: true }),
    withdrawnTo: text("withdrawnTo"),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    talentProfileIdIdx: index("talentEarnings_talentProfileId_idx").on(
      table.talentProfileId,
    ),
    typeIdx: index("talentEarnings_type_idx").on(table.type),
    statusIdx: index("talentEarnings_status_idx").on(table.status),
  }),
)

export const talentInvitations = pgTable(
  "talentInvitations",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),

    talentProfileId: uuid("talentProfileId")
      .references(() => talentProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // Invited company
    invitedEmail: text("invitedEmail").notNull(),
    invitedCompany: text("invitedCompany"),

    // Access
    accessLevel: text("accessLevel", {
      enum: ["unlisted-threads", "full-profile", "pre-chat-waived"],
    }).default("unlisted-threads"),

    // Status
    status: text("status", {
      enum: ["pending", "accepted", "expired"],
    }).default("pending"),

    expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: true }),
    acceptedAt: timestamp("acceptedAt", { mode: "date", withTimezone: true }),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    talentProfileIdIdx: index("talentInvitations_talentProfileId_idx").on(
      table.talentProfileId,
    ),
    invitedEmailIdx: index("talentInvitations_invitedEmail_idx").on(
      table.invitedEmail,
    ),
    statusIdx: index("talentInvitations_status_idx").on(table.status),
  }),
)

export type TalentProfile = typeof talentProfiles.$inferSelect
export type NewTalentProfile = typeof talentProfiles.$inferInsert

export type TalentThread = typeof talentThreads.$inferSelect
export type NewTalentThread = typeof talentThreads.$inferInsert

export type RecruitmentFlow = typeof recruitmentFlows.$inferSelect
export type NewRecruitmentFlow = typeof recruitmentFlows.$inferInsert

export type TalentEarning = typeof talentEarnings.$inferSelect
export type NewTalentEarning = typeof talentEarnings.$inferInsert

export type TalentInvitation = typeof talentInvitations.$inferSelect
export type NewTalentInvitation = typeof talentInvitations.$inferInsert

// ============================================================================
// PREMIUM SUBSCRIPTIONS: Stripe Integration
// ============================================================================

export const premiumSubscriptions = pgTable(
  "premiumSubscriptions",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Stripe data
    stripeSubscriptionId: text("stripeSubscriptionId").notNull().unique(),
    stripePriceId: text("stripePriceId").notNull(),
    stripeProductId: text("stripeProductId").notNull(),
    stripeCustomerId: text("stripeCustomerId"),
    appId: uuid("appId").references(() => apps.id, { onDelete: "set null" }),

    // Product info
    productType: text("productType", {
      enum: [
        "grape_analytics",
        "pear_feedback",
        "sushi_debugger",
        "watermelon_white_label",
        "plus_subscription",
        "pro_subscription",
        "white_label",
      ],
    }).notNull(),
    tier: text("tier", {
      enum: [
        "free",
        "plus",
        "pro",
        "coder",
        "architect",
        "standard",
        "sovereign",
      ],
    }).notNull(),

    // Status
    status: text("status", {
      enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
    }).notNull(),

    // Billing
    currentPeriodStart: timestamp("currentPeriodStart", {
      mode: "date",
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("currentPeriodEnd", {
      mode: "date",
      withTimezone: true,
    }),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
    canceledAt: timestamp("canceledAt", { mode: "date", withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").$type<{
      appId?: string
      storeId?: string
      customDomain?: string
      features?: string[]
    }>(),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("premiumSubscriptions_userId_idx").on(table.userId),
    productTypeIdx: index("premiumSubscriptions_productType_idx").on(
      table.productType,
    ),
    statusIdx: index("premiumSubscriptions_status_idx").on(table.status),
    stripeSubscriptionIdIdx: index(
      "premiumSubscriptions_stripeSubscriptionId_idx",
    ).on(table.stripeSubscriptionId),
  }),
)

export type PremiumSubscription = typeof premiumSubscriptions.$inferSelect
export type NewPremiumSubscription = typeof premiumSubscriptions.$inferInsert

// ============================================================================
// INFINITE HUMAN SYSTEM: Agent XP & Leveling
// ============================================================================
export * from "./agent-schema"

// ============================================================================
// AUTH EXCHANGE CODES: Secure OAuth Token Exchange
// ============================================================================
export const authExchangeCodes = pgTable(
  "authExchangeCodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(), // One-time exchange code
    token: text("token").notNull(), // JWT token to exchange for
    used: boolean("used").default(false).notNull(), // Has code been used?
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresOn: timestamp("expiresOn", {
      mode: "date",
      withTimezone: true,
    }).notNull(), // 5 minutes expiry
  },
  (table) => ({
    codeIdx: uniqueIndex("authExchangeCodes_code_idx").on(table.code),
    expiresOnIdx: index("authExchangeCodes_expiresOn_idx").on(table.expiresOn),
  }),
)

// ============================================================================
// CODEBASE AI: AST + RAG + FalkorDB
// ============================================================================

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
    embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small
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
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    userIdIdx: index("codebaseQueries_userId_idx").on(table.userId),
    guestIdIdx: index("codebaseQueries_guestId_idx").on(table.guestId),
    appIdIdx: index("codebaseQueries_appId_idx").on(table.appId),
    repoNameIdx: index("codebaseQueries_repoName_idx").on(table.repoName),
    createdAtIdx: index("codebaseQueries_createdAt_idx").on(table.createdAt),
  }),
)

export type CodebaseQuery = typeof codebaseQueries.$inferSelect
export type newCodebaseQuery = typeof codebaseQueries.$inferInsert

// ============================================================================
// AD EXCHANGE - Autonomous Advertising System
// ============================================================================

// Store Time Slots - Available advertising slots in stores
export const storeTimeSlots = pgTable(
  "store_time_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Which store owns this slot
    storeId: uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),

    // Time configuration
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
    startTime: text("start_time").notNull(), // "14:00"
    endTime: text("end_time").notNull(), // "16:00"
    durationHours: integer("duration_hours").notNull(), // 2

    // Pricing
    creditsPerHour: integer("credits_per_hour").notNull(), // Base price for auction? (legacy)
    directRentPrice: integer("direct_rent_price"), // Fixed price for direct kiralama
    minAuctionBid: integer("min_auction_bid"), // Minimum bid for auction
    isPrimeTime: boolean("is_prime_time").default(false), // Peak hours cost more

    // Approval & Agent Logic
    requiresApproval: boolean("requires_approval").default(false), // User/Agent has to say OK
    autoApprove: boolean("auto_approve").default(true), // Agent (Store App) auto-approves if ON

    // Capacity & availability
    maxConcurrentRentals: integer("max_concurrent_rentals").default(1), // Usually 1
    isActive: boolean("is_active").default(true),

    // Performance metrics (updated periodically)
    averageTraffic: integer("average_traffic").default(0), // Avg visitors during this slot
    averageConversions: integer("average_conversions").default(0),
    totalRentals: integer("total_rentals").default(0),

    // Metadata
    createdOn: timestamp("created_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updated_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    storeIdIdx: index("store_time_slots_store_idx").on(table.storeId),
    dayOfWeekIdx: index("store_time_slots_day_idx").on(table.dayOfWeek),
    isActiveIdx: index("store_time_slots_active_idx").on(table.isActive),
    primeTimeIdx: index("store_time_slots_prime_idx").on(table.isPrimeTime),
  }),
)

export type storeTimeSlot = typeof storeTimeSlots.$inferSelect
export type newStoreTimeSlot = typeof storeTimeSlots.$inferInsert

// App Campaigns - Autonomous advertising campaigns for apps
export const appCampaigns = pgTable(
  "app_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Ownership
    appId: uuid("app_id")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guest_id").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Campaign config
    name: text("name").notNull(),
    status: text("status", {
      enum: [
        "active",
        "paused",
        "completed",
        "cancelled",
        "pending_approval",
        "scheduled",
      ],
    })
      .default("active")
      .notNull(),
    rentalType: text("rental_type", {
      enum: ["app_to_store", "store_to_app"],
    })
      .default("app_to_store")
      .notNull(),

    // Budget
    totalCredits: integer("total_credits").notNull(),
    creditsSpent: integer("credits_spent").default(0).notNull(),
    creditsRemaining: integer("credits_remaining").notNull(),
    dailyBudget: integer("daily_budget"), // Optional daily cap

    // Targeting
    targetStores: jsonb("target_stores").$type<string[]>(), // Specific store IDs or null for any
    targetCategories: jsonb("target_categories").$type<string[]>(), // Store categories
    excludeStores: jsonb("exclude_stores").$type<string[]>(), // Blacklist

    // Optimization goals
    optimizationGoal: text("optimization_goal", {
      enum: ["traffic", "conversions", "knowledge", "balanced"],
    })
      .default("balanced")
      .notNull(),

    minTraffic: integer("min_traffic").default(100), // Minimum store traffic
    maxPricePerSlot: integer("max_price_per_slot"), // Bid ceiling

    // AI bidding strategy
    biddingStrategy: text("bidding_strategy", {
      enum: ["smart", "aggressive", "conservative", "custom"],
    })
      .default("smart")
      .notNull(),

    // Schedule preferences
    preferredDays: jsonb("preferred_days").$type<number[]>(), // [1,3,5] = Mon, Wed, Fri
    preferredHours: jsonb("preferred_hours").$type<string[]>(), // ["14:00-16:00", "18:00-20:00"]
    avoidPrimeTime: boolean("avoid_prime_time").default(false), // Cost optimization

    // Performance tracking
    totalImpressions: integer("total_impressions").default(0).notNull(),
    totalClicks: integer("total_clicks").default(0).notNull(),
    totalConversions: integer("total_conversions").default(0).notNull(),
    totalKnowledgeGained: integer("total_knowledge_gained")
      .default(0)
      .notNull(),
    averageCPC: real("average_cpc").default(0), // Cost per click
    roi: real("roi").default(0), // Return on investment

    // AI learning
    mlModel: jsonb("ml_model"), // Trained model state
    performanceHistory: jsonb("performance_history").$type<
      Array<{
        slotId: string
        storeId: string
        dayOfWeek: number
        timeSlot: string
        bidAmount: number
        predictedROI: number
        actualROI: number
        traffic: number
        conversions: number
        timestamp: string
      }>
    >(),

    // Metadata
    createdOn: timestamp("created_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    startDate: timestamp("start_date", { mode: "date", withTimezone: true }),
    endDate: timestamp("end_date", { mode: "date", withTimezone: true }),
    updatedOn: timestamp("updated_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    appIdIdx: index("app_campaigns_app_idx").on(table.appId),
    userIdIdx: index("app_campaigns_user_idx").on(table.userId),
    guestIdIdx: index("app_campaigns_guest_idx").on(table.guestId),
    statusIdx: index("app_campaigns_status_idx").on(table.status),
    createdOnIdx: index("app_campaigns_created_idx").on(table.createdOn),
  }),
)

export type appCampaign = typeof appCampaigns.$inferSelect
export type newAppCampaign = typeof appCampaigns.$inferInsert

// Autonomous Bids - AI-placed bids on time slots
export const autonomousBids = pgTable(
  "autonomous_bids",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    campaignId: uuid("campaign_id")
      .references(() => appCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    slotId: uuid("slot_id")
      .references(() => storeTimeSlots.id, { onDelete: "cascade" })
      .notNull(),

    // Bid details
    bidAmount: integer("bid_amount").notNull(), // Credits bid
    bidReason: text("bid_reason"), // AI explanation
    confidence: real("confidence"), // 0-1 confidence score

    // Auction
    status: text("status", {
      enum: ["pending", "won", "lost", "expired", "cancelled"],
    })
      .default("pending")
      .notNull(),
    competingBids: integer("competing_bids").default(0),
    winningBid: integer("winning_bid"), // If lost, what won

    // Performance prediction
    predictedTraffic: integer("predicted_traffic"),
    predictedConversions: integer("predicted_conversions"),
    predictedROI: real("predicted_roi"),

    // Actual performance (after slot completes)
    actualTraffic: integer("actual_traffic"),
    actualConversions: integer("actual_conversions"),
    actualROI: real("actual_roi"),

    // Metadata
    createdOn: timestamp("created_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresOn: timestamp("expires_on", { mode: "date", withTimezone: true }),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    campaignIdIdx: index("autonomous_bids_campaign_idx").on(table.campaignId),
    slotIdIdx: index("autonomous_bids_slot_idx").on(table.slotId),
    statusIdx: index("autonomous_bids_status_idx").on(table.status),
    createdOnIdx: index("autonomous_bids_created_idx").on(table.createdOn),
  }),
)

export type autonomousBid = typeof autonomousBids.$inferSelect
export type newAutonomousBid = typeof autonomousBids.$inferInsert

// Slot Rentals - Confirmed rentals of time slots
export const slotRentals = pgTable(
  "slot_rentals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Slot & campaign
    slotId: uuid("slot_id")
      .references(() => storeTimeSlots.id, { onDelete: "cascade" })
      .notNull(),
    campaignId: uuid("campaign_id")
      .references(() => appCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    bidId: uuid("bid_id").references(() => autonomousBids.id, {
      onDelete: "set null",
    }),

    // Renter
    appId: uuid("app_id")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    guestId: uuid("guest_id").references(() => guests.id, {
      onDelete: "cascade",
    }),

    // Rental period
    startTime: timestamp("start_time", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endTime: timestamp("end_time", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    durationHours: integer("duration_hours").notNull(),

    // Pricing
    creditsCharged: integer("credits_charged").notNull(),
    priceEur: real("price_eur"), // Optional EUR equivalent

    // Status
    status: text("status", {
      enum: [
        "scheduled",
        "active",
        "completed",
        "cancelled",
        "pending_approval",
        "rejected",
      ],
    })
      .default("scheduled")
      .notNull(),
    rentalType: text("rental_type", {
      enum: ["app_to_store", "store_to_app"],
    })
      .default("app_to_store")
      .notNull(),

    // Performance tracking
    trafficGenerated: integer("traffic_generated").default(0),
    conversions: integer("conversions").default(0),
    knowledgeGained: integer("knowledge_gained").default(0), // KB entries added
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),

    // Knowledge base integration
    knowledgeBaseEnabled: boolean("knowledge_base_enabled").default(true),
    knowledgeEntries:
      jsonb("knowledge_entries").$type<
        Array<{
          id: string
          content: string
          timestamp: string
        }>
      >(),

    // Metadata
    createdOn: timestamp("created_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    completedOn: timestamp("completed_on", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    slotIdIdx: index("slot_rentals_slot_idx").on(table.slotId),
    campaignIdIdx: index("slot_rentals_campaign_idx").on(table.campaignId),
    appIdIdx: index("slot_rentals_app_idx").on(table.appId),
    userIdIdx: index("slot_rentals_user_idx").on(table.userId),
    guestIdIdx: index("slot_rentals_guest_idx").on(table.guestId),
    statusIdx: index("slot_rentals_status_idx").on(table.status),
    startTimeIdx: index("slot_rentals_start_idx").on(table.startTime),
    endTimeIdx: index("slot_rentals_end_idx").on(table.endTime),
  }),
)

export type slotRental = typeof slotRentals.$inferSelect
export type newSlotRental = typeof slotRentals.$inferInsert

// Slot Auction History - Track bidding wars
export const slotAuctions = pgTable(
  "slot_auctions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    slotId: uuid("slot_id")
      .references(() => storeTimeSlots.id, { onDelete: "cascade" })
      .notNull(),

    // Auction period
    startTime: timestamp("start_time", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endTime: timestamp("end_time", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    // Results
    winningBidId: uuid("winning_bid_id").references(() => autonomousBids.id, {
      onDelete: "set null",
    }),
    winningAmount: integer("winning_amount"),
    totalBids: integer("total_bids").default(0),
    averageBid: real("average_bid"),
    highestBid: integer("highest_bid"),
    lowestBid: integer("lowest_bid"),

    // Status
    status: text("status", {
      enum: ["open", "closed", "cancelled"],
    })
      .default("open")
      .notNull(),

    // Metadata
    createdOn: timestamp("created_on", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    closedOn: timestamp("closed_on", { mode: "date", withTimezone: true }),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    slotIdIdx: index("slot_auctions_slot_idx").on(table.slotId),
    statusIdx: index("slot_auctions_status_idx").on(table.status),
    startTimeIdx: index("slot_auctions_start_idx").on(table.startTime),
  }),
)

export type slotAuction = typeof slotAuctions.$inferSelect
export type newSlotAuction = typeof slotAuctions.$inferInsert

// ============================================================================
// DRIZZLE RELATIONS - Enable runtime queries with 'with' clauses
// ============================================================================

export const storeTimeSlotsRelations = relations(
  storeTimeSlots,
  ({ one, many }) => ({
    store: one(stores, {
      fields: [storeTimeSlots.storeId],
      references: [stores.id],
    }),
    rentals: many(slotRentals),
    auctions: many(slotAuctions),
  }),
)

export const appCampaignsRelations = relations(
  appCampaigns,
  ({ one, many }) => ({
    app: one(apps, {
      fields: [appCampaigns.appId],
      references: [apps.id],
    }),
    user: one(users, {
      fields: [appCampaigns.userId],
      references: [users.id],
    }),
    guest: one(guests, {
      fields: [appCampaigns.guestId],
      references: [guests.id],
    }),
    bids: many(autonomousBids),
    rentals: many(slotRentals),
  }),
)

export const autonomousBidsRelations = relations(autonomousBids, ({ one }) => ({
  campaign: one(appCampaigns, {
    fields: [autonomousBids.campaignId],
    references: [appCampaigns.id],
  }),
  slot: one(storeTimeSlots, {
    fields: [autonomousBids.slotId],
    references: [storeTimeSlots.id],
  }),
}))

export const slotRentalsRelations = relations(slotRentals, ({ one }) => ({
  slot: one(storeTimeSlots, {
    fields: [slotRentals.slotId],
    references: [storeTimeSlots.id],
  }),
  campaign: one(appCampaigns, {
    fields: [slotRentals.campaignId],
    references: [appCampaigns.id],
  }),
  app: one(apps, {
    fields: [slotRentals.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [slotRentals.userId],
    references: [users.id],
  }),
  guest: one(guests, {
    fields: [slotRentals.guestId],
    references: [guests.id],
  }),
  bid: one(autonomousBids, {
    fields: [slotRentals.bidId],
    references: [autonomousBids.id],
  }),
}))

export const slotAuctionsRelations = relations(slotAuctions, ({ one }) => ({
  slot: one(storeTimeSlots, {
    fields: [slotAuctions.slotId],
    references: [storeTimeSlots.id],
  }),
  winningBid: one(autonomousBids, {
    fields: [slotAuctions.winningBidId],
    references: [autonomousBids.id],
  }),
}))

export const hippos = pgTable(
  "hippo",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
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
    userIdIdx: index("hippo_user_idx").on(table.userId),
    guestIdIdx: index("hippo_guest_idx").on(table.guestId),
    createdOnIdx: index("hippo_created_on_idx").on(table.createdOn),
  }),
)

export type hippo = typeof hippos.$inferSelect
export type newHippo = typeof hippos.$inferInsert

const hippoFiles = pgTable(
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
