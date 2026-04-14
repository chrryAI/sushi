// Re-export shared upstream types
export type { aiModel, ramen, swarm } from "@chrryai/donut/types"

// Custom application-level types (originally in schema.ts)
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

// Inferred Drizzle types from PG schema (single source of truth)
import type {
  agentApiUsage,
  aiAgents,
  aiModelPricing,
  analyticsEvents,
  analyticsSessions,
  analyticsSites,
  appExtends,
  apps,
  budgets,
  calendarEvents,
  characterProfiles,
  cities,
  codebaseQueries,
  codeEmbeddings,
  creditUsages,
  devices,
  documentChunks,
  documentSummaries,
  expenses,
  guests,
  hippoFiles,
  hippos,
  installs,
  instructions,
  kanbanBoards,
  memories,
  messageEmbeddings,
  messages,
  moods,
  placeHolders,
  realtimeAnalytics,
  retroResponses,
  retroSessions,
  scheduledJobRuns,
  scheduledJobs,
  sharedExpenses,
  storeInstalls,
  stores,
  systemLogs,
  taskLogs,
  taskStates,
  tasks,
  threadSummaries,
  threads,
  timers,
} from "./schema"

export type Guest = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert

export type City = typeof cities.$inferSelect
export type NewCity = typeof cities.$inferInsert

export type Thread = typeof threads.$inferSelect
export type NewThread = typeof threads.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type AiAgent = typeof aiAgents.$inferSelect
export type NewAiAgent = typeof aiAgents.$inferInsert

export type ScheduledJob = typeof scheduledJobs.$inferSelect
export type NewScheduledJob = typeof scheduledJobs.$inferInsert

export type ScheduledJobRun = typeof scheduledJobRuns.$inferSelect
export type NewScheduledJobRun = typeof scheduledJobRuns.$inferInsert

export type AiModelPricing = typeof aiModelPricing.$inferSelect
export type NewAiModelPricing = typeof aiModelPricing.$inferInsert

export type PlaceHolder = typeof placeHolders.$inferSelect
export type NewPlaceHolder = typeof placeHolders.$inferInsert

export type RealtimeAnalytics = typeof realtimeAnalytics.$inferSelect
export type NewRealtimeAnalytics = typeof realtimeAnalytics.$inferInsert

export type CreditUsage = typeof creditUsages.$inferSelect
export type NewCreditUsage = typeof creditUsages.$inferInsert

export type SystemLog = typeof systemLogs.$inferSelect
export type NewSystemLog = typeof systemLogs.$inferInsert

export type DocumentChunk = typeof documentChunks.$inferSelect
export type NewDocumentChunk = typeof documentChunks.$inferInsert

export type DocumentSummary = typeof documentSummaries.$inferSelect
export type NewDocumentSummary = typeof documentSummaries.$inferInsert

export type MessageEmbedding = typeof messageEmbeddings.$inferSelect
export type NewMessageEmbedding = typeof messageEmbeddings.$inferInsert

export type ThreadSummary = typeof threadSummaries.$inferSelect
export type NewThreadSummary = typeof threadSummaries.$inferInsert

export type Memory = typeof memories.$inferSelect
export type NewMemory = typeof memories.$inferInsert

export type CharacterProfile = typeof characterProfiles.$inferSelect
export type NewCharacterProfile = typeof characterProfiles.$inferInsert

export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert

export type App = typeof apps.$inferSelect
export type NewApp = typeof apps.$inferInsert

export type AppExtend = typeof appExtends.$inferSelect
export type NewAppExtend = typeof appExtends.$inferInsert

export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert

export type Install = typeof installs.$inferSelect
export type NewInstall = typeof installs.$inferInsert

export type StoreInstall = typeof storeInstalls.$inferSelect
export type NewStoreInstall = typeof storeInstalls.$inferInsert

export type AgentApiUsage = typeof agentApiUsage.$inferSelect
export type NewAgentApiUsage = typeof agentApiUsage.$inferInsert

export type Instruction = typeof instructions.$inferSelect
export type NewInstruction = typeof instructions.$inferInsert

export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert

export type SharedExpense = typeof sharedExpenses.$inferSelect
export type NewSharedExpense = typeof sharedExpenses.$inferInsert

export type AnalyticsSite = typeof analyticsSites.$inferSelect
export type NewAnalyticsSite = typeof analyticsSites.$inferInsert

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert

export type AnalyticsSession = typeof analyticsSessions.$inferSelect
export type NewAnalyticsSession = typeof analyticsSessions.$inferInsert

export type Timer = typeof timers.$inferSelect
export type NewTimer = typeof timers.$inferInsert

export type Mood = typeof moods.$inferSelect
export type NewMood = typeof moods.$inferInsert

export type KanbanBoard = typeof kanbanBoards.$inferSelect
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert

export type TaskState = typeof taskStates.$inferSelect
export type NewTaskState = typeof taskStates.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

export type TaskLog = typeof taskLogs.$inferSelect
export type NewTaskLog = typeof taskLogs.$inferInsert

export type RetroSession = typeof retroSessions.$inferSelect
export type NewRetroSession = typeof retroSessions.$inferInsert

export type RetroResponse = typeof retroResponses.$inferSelect
export type NewRetroResponse = typeof retroResponses.$inferInsert

export type CodeEmbedding = typeof codeEmbeddings.$inferSelect
export type NewCodeEmbedding = typeof codeEmbeddings.$inferInsert

export type CodebaseQuery = typeof codebaseQueries.$inferSelect
export type newCodebaseQuery = typeof codebaseQueries.$inferInsert

export type Hippo = typeof hippos.$inferSelect
export type NewHippo = typeof hippos.$inferInsert

export type HippoFile = typeof hippoFiles.$inferSelect
export type NewHippoFile = typeof hippoFiles.$inferInsert
