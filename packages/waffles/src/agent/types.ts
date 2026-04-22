import type {
  CoreMessage,
  GenerateTextResult,
  generateText,
  LanguageModel,
  streamText,
} from "ai"
import type {
  ActorLogic,
  ActorRefLike,
  AnyEventObject,
  AnyStateMachine,
  EventFrom,
  SnapshotFrom,
  StateValue,
  TransitionSnapshot,
  Values,
} from "xstate"
import type { TypeOf } from "zod"
import type { Expert } from "./expert"
import type { ZodContextMapping, ZodEventMapping } from "./schemas"

export type GenerateTextOptions = Parameters<typeof generateText>[0]

export type StreamTextOptions = Parameters<typeof streamText>[0]

export type CostFunction<TExpert extends AnyExpert> = (
  path: ExpertPath<TExpert>,
) => number

export type ExpertDecideInput<TExpert extends AnyExpert> = Omit<
  ExpertGenerateTextOptions,
  "model" | "prompt" | "tools" | "toolChoice"
> & {
  /**
   * The parent decision that this decision is a part of.
   */
  decisionId?: string
  /**
   * The currently observed state.
   */
  state: ObservedState<TExpert>
  /**
   * The context to provide in the prompt to the expert. This overrides the `state.context`.
   */
  context?: Record<string, any>
  /**
   * The goal for the expert to accomplish.
   * The expert will make a decision based on this goal.
   */
  goal: string
  /**
   * The events that the expert can trigger. This is a mapping of
   * event types to Zod event schemas.
   */
  events?: ZodEventMapping
  allowedEvents?: Array<EventFromExpert<TExpert>["type"]>
  /**
   * The state machine that represents the environment the expert
   * is interacting with.
   */
  machine?: AnyStateMachine

  /**
   * A function that calculates the total cost of the path to the goal state.
   */
  costFunction?: CostFunction<TExpert>

  /**
   * The maximum number of attempts to make a decision.
   * Defaults to 2.
   */
  maxAttempts?: number
  /**
   * The policy to use for making a decision.
   */
  policy?: ExpertPolicy<TExpert>
  model?: LanguageModel
  /**
   * The previous relevant feedback from the expert.
   */
  feedback?: ExpertFeedback[]
  /**
   * The previous relevant observations from the expert.
   */
  observations?: ExpertObservation<any>[]
  /**
   * The previous relevant decisions from the expert.
   */
  decisions?: ExpertDecision<TExpert>[]
  /**
   * The previous relevant insights from the expert.
   */
  insights?: ExpertInsight[]
  toolChoice?: "auto" | "none" | "required"
} & BaseInput

export type ExpertStep<TExpert extends AnyExpert> = {
  /** The event to take */
  event: EventFromExpert<TExpert>
  /** The next expected state after taking the event */
  state: ObservedState<TExpert> | null
}

export type ExpertPath<TExpert extends AnyExpert> = {
  /** The expected ending state of the path */
  state: ObservedState<TExpert> | null
  /** The steps to reach the ending state */
  steps: Array<ExpertStep<TExpert>>
  weight?: number
}

export interface ExpertDecisionInput<TExpert extends AnyExpert>
  extends BaseInput {
  goal: string
  decisionId?: string | null
  policy?: string | null
  goalState?: ObservedState<TExpert> | null
  nextEvent?: EventFromExpert<TExpert> | null
  paths?: ExpertPath<TExpert>[]
}

export interface ExpertDecision<TExpert extends AnyExpert = AnyExpert>
  extends BaseProperties {
  /**
   * The parent decision that this decision is a part of.
   */
  decisionId: string | null
  /**
   * The policy used to generate the decision
   */
  policy: string | null
  goal: string
  /**
   * The ending state of the decision.
   */
  goalState: ObservedState<TExpert> | null
  /**
   * The next event that the expert decided needs to occur to achieve the `goal`.
   *
   * This next event is chosen from the
   */
  nextEvent: EventFromExpert<TExpert> | null
  /**
   * The paths that the expert can take to achieve the goal.
   */
  paths: ExpertPath<TExpert>[]
}

export interface TransitionData {
  eventType: string
  description?: string
  guard?: { type: string }
  target?: any
}

export type PromptTemplate<TExpert extends AnyExpert> = (data: {
  goal: string
  /**
   * The observed state
   */
  stateValue?: any
  context?: Record<string, any>
  /**
   * The state machine model of the observed environment
   */
  machine?: unknown
  /**
   * The potential next transitions that can be taken
   * in the state machine
   */
  transitions?: TransitionData[]
  /**
   * Relevant past observations
   */
  observations?: ExpertObservation<any>[] // TODO
  /**
   * Relevant feedback
   */
  feedback?: ExpertFeedback[]
  /**
   * Relevant messages
   */
  messages?: ExpertMessage[]
  /**
   * Relevant past decisions
   */
  decisions?: ExpertDecision<TExpert>[]
  /**
   * Relevant past insights
   */
  insights?: ExpertInsight[]
}) => string

export type ExpertPolicy<TExpert extends AnyExpert = AnyExpert> = (
  expert: TExpert,
  input: ExpertDecideInput<TExpert>,
) => Promise<ExpertDecision<TExpert> | undefined>

export type ExpertInteractInput<T extends AnyExpert> = Omit<
  ExpertDecideInput<T>,
  "state"
> & {
  state?: never
}

export interface ExpertFeedback extends BaseProperties {
  decisionId: string
  reward: number
  comment: string | undefined
  attributes: Record<string, any>
}

interface BaseProperties {
  id: string
  episodeId: string
  timestamp: number
}

type BaseInput = Partial<BaseProperties>

export interface ExpertFeedbackInput extends BaseInput {
  /**
   * The decision ID that this feedback is relevant for.
   */
  decisionId: string
  reward: number
  comment?: string
  attributes?: Record<string, any>
}

export type ExpertMessage = BaseProperties &
  CoreMessage & {
    /**
     * The parent decision that this message is a part of.
     */
    decisionId?: string
    /**
     * The response ID of the message, which references
     * which message this message is responding to, if any.
     */
    responseId?: string
    result?: GenerateTextResult<any, any>
  }

type JSONObject = {
  [key: string]: JSONValue
}
type JSONArray = JSONValue[]
type JSONValue = null | string | number | boolean | JSONObject | JSONArray

type LanguageModelV1ProviderMetadata = Record<string, Record<string, JSONValue>>

export interface LanguageModelV1TextPart {
  type: "text"
  /**
The text content.
   */
  text: string
  /**
   * Additional provider-specific metadata. They are passed through
   * to the provider from the AI SDK and enable provider-specific
   * functionality that can be fully encapsulated in the provider.
   */
  providerMetadata?: LanguageModelV1ProviderMetadata
}

export interface LanguageModelV1ToolCallPart {
  type: "tool-call"
  /**
ID of the tool call. This ID is used to match the tool call with the tool result.
 */
  toolCallId: string
  /**
Name of the tool that is being called.
 */
  toolName: string
  /**
Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: unknown
  /**
   * Additional provider-specific metadata. They are passed through
   * to the provider from the AI SDK and enable provider-specific
   * functionality that can be fully encapsulated in the provider.
   */
  providerMetadata?: LanguageModelV1ProviderMetadata
}

export type ExpertMessageInput = CoreMessage & {
  timestamp?: number
  id?: string
  /**
   * The response ID of the message, which references
   * which message this message is responding to, if any.
   */
  responseId?: string
  result?: GenerateTextResult<any, any>
}

export interface ExpertObservation<TActor extends ActorRefLike> {
  id: string
  episodeId: string
  /**
   * The decision that this observation is relevant for
   */
  decisionId?: string | undefined
  goal?: string
  prevState: SnapshotFrom<TActor> | undefined
  event: EventFrom<TActor> | undefined
  state: SnapshotFrom<TActor>
  // machineHash: string | undefined;
  timestamp: number
}

export interface ExpertObservationInput<TExpert extends AnyExpert>
  extends BaseInput {
  state: ObservedState<TExpert>
  /**
   * The expert decision that the observation is relevant for
   */
  decisionId?: string | undefined
  prevState?: ObservedState<TExpert>
  event?: AnyEventObject
  goal?: string | undefined
}

export type ExpertEmittedEvent<TExpert extends AnyExpert> =
  | {
      type: "feedback"
      feedback: ExpertFeedback
    }
  | {
      type: "observation"
      observation: ExpertObservation<any> // TODO
    }
  | {
      type: "message"
      message: ExpertMessage
    }
  | {
      type: "decision"
      decision: ExpertDecision<TExpert>
    }
  | {
      type: "insight"
      insight: ExpertInsight
    }

export type ExpertLogic<TExpert extends AnyExpert> = ActorLogic<
  TransitionSnapshot<ExpertMemoryContext<TExpert>>,
  | {
      type: "expert.feedback"
      feedback: ExpertFeedback
    }
  | {
      type: "expert.observe"
      observation: ExpertObservation<any> // TODO
    }
  | {
      type: "expert.message"
      message: ExpertMessage
    }
  | {
      type: "expert.decision"
      decision: ExpertDecision<TExpert>
    }
  | {
      type: "expert.insight"
      insight: ExpertInsight
    },
  any, // TODO: input
  any,
  ExpertEmittedEvent<TExpert>
>

export type EventsFromZodEventMapping<TEventSchemas extends ZodEventMapping> =
  Compute<
    Values<{
      [K in keyof TEventSchemas & string]: {
        type: K
      } & TypeOf<TEventSchemas[K]>
    }>
  >

export type ContextFromZodContextMapping<
  TContextSchema extends ZodContextMapping,
> = {
  [K in keyof TContextSchema & string]: TypeOf<TContextSchema[K]>
}

export type AnyExpert = Expert<any, any>

export type FromExpert<T> = T | ((expert: AnyExpert) => T | Promise<T>)

export type CommonTextOptions = {
  prompt: FromExpert<string>
  model?: LanguageModel
  messages?: CoreMessage[]
  template?: PromptTemplate<any>
  context?: Record<string, any>
}

export type ExpertGenerateTextOptions = Omit<
  GenerateTextOptions,
  "model" | "prompt" | "messages"
> &
  CommonTextOptions

export type ExpertStreamTextOptions = Omit<
  StreamTextOptions,
  "model" | "prompt" | "messages"
> &
  CommonTextOptions

export interface ObservedState<TExpert extends AnyExpert> {
  /**
   * The current state value of the state machine, e.g.
   * `"loading"` or `"processing"` or `"ready"`
   */
  value: StateValue
  /**
   * Additional contextual data related to the current state
   */
  context?: ContextFromExpert<TExpert>
}

export type ObservedStateFrom<TActor extends ActorRefLike> = Pick<
  SnapshotFrom<TActor>,
  "value" | "context"
>

export type ExpertMemoryContext<TExpert extends AnyExpert> = {
  observations: ExpertObservation<any>[] // TODO
  messages: ExpertMessage[]
  decisions: ExpertDecision<TExpert>[]
  feedback: ExpertFeedback[]
  insights: ExpertInsight[]
}

export type Compute<A> = { [K in keyof A]: A[K] } & unknown

export type MaybePromise<T> = T | Promise<T>

export type EventFromExpert<T extends AnyExpert> =
  T extends Expert<infer _, infer TEventSchemas>
    ? EventsFromZodEventMapping<TEventSchemas>
    : never

export type TypesFromExpert<T extends AnyExpert> =
  T extends Expert<infer TContextSchema, infer TEventSchema>
    ? {
        context: ContextFromZodContextMapping<TContextSchema>
        events: EventsFromZodEventMapping<TEventSchema>
      }
    : never

export type ContextFromExpert<T extends AnyExpert> =
  T extends Expert<infer TContextSchema, infer _TEventSchema>
    ? ContextFromZodContextMapping<TContextSchema>
    : never

export interface StorageAdapter<TExpert extends AnyExpert, TQuery> {
  addObservation(
    observationInput: ExpertObservationInput<TExpert>,
  ): Promise<ExpertObservation<any>>
  getObservations(queryObject?: TQuery): Promise<ExpertObservation<any>[]>
  addFeedback(feedbackInput: ExpertFeedbackInput): Promise<ExpertFeedback>
  getFeedback(queryObject?: TQuery): Promise<ExpertFeedback[]>
  addMessage(messageInput: ExpertMessageInput): Promise<ExpertMessage>
  getMessages(queryObject?: TQuery): Promise<ExpertMessage[]>
  addDecision(
    decisionInput: ExpertDecideInput<TExpert>,
  ): Promise<ExpertDecision<TExpert>>
  getDecisions(queryObject?: TQuery): Promise<ExpertDecision<TExpert>[]>
}

export type StorageAdapterQuery<T extends StorageAdapter<any, any>> =
  T extends StorageAdapter<infer _, infer TQuery> ? TQuery : never

export interface ExpertInsightInput extends BaseInput {
  observationId: string
  attributes: Record<string, any>
}

export interface ExpertInsight extends BaseProperties {
  observationId: string
  attributes: Record<string, any>
}
/**
 * Type definitions for Cherry UI library
 * These types mirror the database schema but are decoupled for open-source distribution
 */

// packages/ai-core/src/types.ts
// Bu types HER İKİ SDK ile de çalışır

type ChatOptions = unknown
type ChatResult = unknown
type StreamOptions = unknown
type StreamChunk = unknown
type Tool = unknown
type MessagePart = unknown

export interface ai {
  chat(options: ChatOptions): Promise<ChatResult>
  stream(options: StreamOptions): AsyncIterable<StreamChunk>
}

export interface chat {
  model: string
  messages: message[]
  tools?: Tool[]
  temperature?: number
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  parts?: MessagePart[]
}

export type nil = null | undefined

import type { Hono } from "hono"

import type { locale } from "../locales"

export type {
  ChrryAiContext,
  chrryEmbeddingModel,
  chrryLanguageModel,
  chrryModelMeta,
  chrryProvider,
} from "./ai.js"

import type { ChrryAiContext, chrryLanguageModel } from "./ai.js"

/** @deprecated use chrryLanguageModel from "./ai.js" */
export type languageModel = chrryLanguageModel

export type burn<T extends chrry> = T & {
  testConfig?: {
    TEST_GUEST_FINGERPRINTS?: string[]
    TEST_MEMBER_EMAILS?: string[]
    TEST_MEMBER_FINGERPRINTS?: string[]
    VEX_LIVE_FINGERPRINTS?: string[]
  }
}

export type vault<T extends chrry> = T
export type hippo<T extends chrry> = T
export type focus<T extends chrry> = T & {
  id: string
  appId?: string | null
  userId?: string | null
  guestId?: string | null

  // Job configuration
  name: string
  scheduleType: string
  jobType: string

  // Schedule configuration
  frequency: "once" | "daily" | "weekly" | "custom"
  scheduledTimes: Array<swarm>
  timezone: string
  startDate?: Date
  endDate?: Date | null
  totalPrice?: number | null
  pendingPayment?: number | null
  // AI Model configuration
  aiModel: modelName
  modelConfig?: {
    model?: string // e.g., "gpt-4", "claude-3-opus"
    temperature?: number
    maxTokens?: number
  } | null

  // Content configuration
  contentTemplate: string | null
  contentRules?: {
    tone?: string
    length?: string
    topics?: string[]
    hashtags?: string[]
  } | null

  // Credit & billing
  estimatedCreditsPerRun: number
  totalEstimatedCredits: number
  creditsUsed: number
  isPaid: boolean
  stripePaymentIntentId?: string | null

  // Execution tracking
  status:
    | "active"
    | "testing"
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "inactive"
  lastRunAt?: Date | null
  nextRunAt?: Date | null
  totalRuns?: number
  successfulRuns: number
  failedRuns: number

  failureReason?: string | null
  calendarEventId?: string | null

  // Metadata
  metadata: {
    modelId?: string
    errors?: Array<{ timestamp: string; error: string }>
    lastOutput?: string
    performance?: { avgDuration: number; avgCredits: number }
    tribeSlug?: string
    cooldownMinutes?: number
    platformInterval?: number
    languages?: string[]
  } | null

  createdOn?: Date
  updatedOn?: Date
}

export type bloom<T extends chrry> = (chrry &
  slot &
  T & {
    focus?: focus<T>
    burn?: burn<T>
    vault?: vault<T>
    hippo?: hippo<T>
    vex?: hippo<T>
    app?: T | null
    path?: string | null
    // get: <T extends sushi>(path: string) => T | null
    spatial?: spatial<T>[] | null
    picks?: T[] | null
    threads?: thread[] | null
    store?: (store & { apps?: T[] }) | null
  })[]

export type peach = coder<sushi>
export type cherry = coder<sushi>

// Swarm slot - lightweight schedule time configuration
// Used for scheduledTimes arrays in focus/scheduledJob (not a full peach/chrry)
export type swarm = {
  bees?: bee[]
  generateImage?: boolean
  generateVideo?: boolean
  fetchNews?: boolean
  intervalMinutes?: number
  title?: string
  description?: string
  rules?: string[]
  appId?: string
  prompt?: string
  autonomous?: boolean
  modelProviderPayload?: sushi
  llm?: aiModelResponse[]
  maxCredits?: number
  maxTokens?: number
  tone?: string[]
  languages?: string[]
  feedbackApps?: string[]
  time: string // "09:00"
  model: string
  postType: "post" | "comment" | "engagement" | "autonomous"
  charLimit: number
  credits: number
}

export type spatial<T> = {
  item: T
  timestamp: number
  duration?: number
  from?: string
}

// ============================================
// 🧭 SPATIAL NAVIGATION TYPES
// ============================================

/** Navigation node - T extends chrry ile generic */
export type spatialNode<T extends chrry> = {
  item: T
  timestamp: number
  duration?: number | null
  from?: string | null
  depth?: number
  path?: string[]
}

/** Navigation history entry - spatialNavigationEntry'nin generic versiyonu */
export type spatialEntry<T extends chrry> = spatialNode<T> & {
  appId: string
  appName: string
}

/** Tek yönlü stack - push/pop için */
export type spatialStack<T extends chrry> = {
  nodes: spatialNode<T>[]
  current: spatialNode<T> | null
  previous: spatialNode<T> | null
  depth: number
}

/** Bidirectional cursor - forward/back destekler */
export type spatialCursor<T extends chrry> = {
  stack: spatialStack<T>
  forward: spatialNode<T>[]
  canGoBack: boolean
  canGoForward: boolean
}

// ============================================
// 🔀 COMPOSE EDİLEBİLİR KATMANLAR
// ============================================

/** Base - sadece spatial context */
export type withSpatial<T extends chrry> = T & {
  spatial?: spatialNode<T>[] | null
}

/** Navigation - cursor ekler */
export type withNav<T extends chrry> = withSpatial<T> & {
  nav?: spatialCursor<T> | null
}

/** Store context - bloom'daki ile aynı */
export type withStore<T extends chrry> = T & {
  store?: (store & { apps?: T[] }) | null
}

/** Thread context - bloom'daki ile aynı */
export type withThread<T extends chrry> = T & {
  threads?: thread[] | null
}

/** Focus context - ramen/job context */
export type withFocus<T extends chrry> = T & {
  focus?: focus<T> | null
  ramen?: ramen | null
}

/** Picks context - seçili/koleksiyon items */
export type withPicks<T extends chrry> = T & {
  picks?: T[] | null
}

/** Breadcrumbs context */
export type withBreadcrumbs<T extends chrry> = T & {
  breadcrumbs?: spatialNode<T>[] | null
}

// ============================================
// 🍱 CHOPSTICK PARALLEL - spatialChopstick
// chopstick = coder<sushi>
// spatialChopstick = spatial için compose edilmiş tip
// ============================================

export type spatialChopstick<T extends chrry> = chrry &
  slot &
  withNav<T> &
  withStore<T> &
  withThread<T> &
  withFocus<T> &
  withPicks<T> &
  withBreadcrumbs<T> & {
    // OpenAI-compatible AI context - server/client same interface
    ai?: ChrryAiContext | null
    spatialConfig?: {
      maxDepth?: number
      maxHistory?: number
      persistAcrossSessions?: boolean
      trackDuration?: boolean
    }
  }

// ============================================
// 🌸 SPATIAL BLOOM
// bloom<T> = liste/grid için
// spatialBloom<T> = navigasyon için
// ============================================

export type spatialBloom<T extends chrry> = (chrry &
  slot &
  T & {
    nav?: spatialCursor<T> | null
    spatial?: spatialNode<T>[] | null
    picks?: T[] | null
    breadcrumbs?: spatialNode<T>[] | null
    store?: (store & { apps?: T[] }) | null
    threads?: thread[] | null
    focus?: focus<T> | null
  })[]

// ============================================
// 🏗️ BUILDER PATTERN - chopStick() benzeri
// ============================================

export type spatialPayload<T extends chrry> = ramen & {
  // chopstick'teki gibi join config
  spatialJoin?: {
    history?: number // kaç node tutulsun
    forward?: number // forward stack boyutu
    breadcrumbs?: number // kaç breadcrumb
    picks?: number // kaç pick
    depth?: number // max tree depth
  }
  // navigation filter
  spatialFilter?: {
    fromApp?: string
    fromStore?: string
    minDuration?: number
    since?: Date
  }
}

/** spatialChopStick() fonksiyonu için return type */
export type spatialChopStickFn = <T extends chrry>(
  payload: spatialPayload<T>,
) => Promise<spatialChopstick<T> | undefined>

// ============================================
// 🔧 UTILS - type helpers
// ============================================

/** Bir T'yi spatialNode'a wrap et */
export type toSpatialNode<T extends chrry> = Omit<spatialNode<T>, "item"> & {
  item: T
}

/** spatialBloom'dan tek item çıkar */
export type fromSpatialBloom<T extends chrry> =
  spatialBloom<T> extends (infer U)[] ? U : never

/** spatialChopstick'i safe hale getir (fonksiyonları kaldır) */
export type safeSpatialChopstick<T extends chrry> = Omit<
  spatialChopstick<T>,
  "ai" | "ramen" | "spatialConfig"
>

export type artifacts = {
  type: string
  url?: string
  sourceUrl?: string
  name: string
  size: number
  data?: string
  id: string
}

export type coder<T extends sushi> = chrry & {
  app?: T
  apps?: T[]
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
  modelId?: string
  skipCache?: string
  hono?: typeof Hono
  byokModelId?: string
  canReason?: boolean
  job?: T
  user?: user | null
  guest?: guest | null
  isBYOK?: boolean
  isFree?: boolean
  ramen?: ramen
  title: string
  description: string
  rules?: string[]
  appId: string
  prompt: string
  autonomous?: boolean
  modelProviderPayload?: sushi
  // will be logged after generation
  llm?: aiModelResponse[]
  charLimit?: number
  maxCredits?: number
  maxTokens?: number
  tone?: string[]
  time: string // "09:00"
  model: string
  id?: string
  postType?: "post" | "comment" | "engagement" | "autonomous"
  credits: number
  generateImage?: boolean
  generateVideo?: boolean
  feedbackApps?: string[]
  feedbackCollect?: string[]
  bidApp?: string[]
  bidStore?: string[]
  swapApp?: string[]
  fetchNews?: boolean
  languages?: string[]
  // scheduledTimes?: {
  //   title: string
  //   description: string
  //   rules?: string[]
  //   appId: string
  //   prompt: string
  //   autonomous?: boolean
  //   modelProviderPayload?: sushi
  //   // will be logged after generation
  //   llm?: aiModelResponse[]
  //   charLimit?: number
  //   maxCredits?: number
  //   modelId?: string
  //   maxTokens?: number
  //   tone?: string[]
  // }[]
  intervalMinutes?: number // Optional interval for custom frequency (e.g., 60 = every hour)
}

export type chopstick = coder<sushi>

// ramen = query/lookup config for chopStick() and DB queries
// NOT a job/schedule type - that's focus<sushi>
export type ramen = {
  id?: string
  appId?: string | null
  modelId?: string
  slug?: string
  llm?: boolean
  join?: {
    placeholders?: {
      app?: number
      user?: number
      dna?: number
      thread?: number
    }
    instructions?: {
      app?: number
      user?: number
      thread?: number
      dna?: number
    }
    memories?: {
      app?: number
      user?: number
      dna?: number
      thread?: number
    }
    characterProfile?: {
      app?: number
      user?: number
      dna?: number
      thread?: number
    }
  }
  agent?: aiAgent | null
  userId?: string
  guestId?: string
  include?: (keyof sushi | "store.apps" | string)[]
  exclude?: (keyof sushi | "store.apps" | string)[]
  storeId?: string
  isSafe?: boolean
  depth?: number
  storeDomain?: string
  storeSlug?: string
  ownerId?: string
  isSystem?: boolean
  name?: string
  role?: "admin" | "user"
  skipCache?: boolean
  threadId?: string
  createdOn?: Date
  updatedOn?: Date
}

export type aiModel = {
  // Vercel AI SDK LanguageModelV1 compatible - pass to generateText(), streamText()
  provider: chrryLanguageModel
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
  job?: swarm
  creditsCost?: number
  appCreditsLeft?: number
  ownerCreditsLeft?: number
}

export type architect = (ramen: ramen) => {
  context: {
    dna: ({ ...ramen }) => Promise<{ artifacts: artifacts; prompt?: string }>
  }
}
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
  architect?: {
    context: {
      dna: ({
        app,
      }: {
        app?: app
      }) => Promise<{ artifacts: artifacts; prompt?: string }>
    }
  }
}

type userMemories = {
  id: string
  content: string
  tags: string[]
  relevanceScore: number
  createdAt: string
}

type threadMemories = userMemories
type characterTags = {
  agentPersonalities: {
    agentId: string
    traits: string[]
    behavior: string
  }[]
  conversationTone: string
  userPreferences: string[]
  contextualTags: string[]
}

// User types
export type user = {
  id: string

  password?: string | null
  apiKeys?: apiKeys | null
  tribeCredits: number
  moltCredits: number
  adConsent: boolean
  pearFeedbackCount: number
  lastCreditRewardOn?: Date | null
  selectedModels?: { id: string; name?: string }[] | null
  suggestions?: {
    instructions: Array<instruction>
    lastGenerated?: string
  } | null
  isLinkedToGoogle?: boolean | null
  isLinkedToApple?: boolean | null
  hasRefreshToken?: boolean | null
  messageCount?: number | null
  stripeConnectAccountId?: string | null
  stripeConnectOnboarded?: boolean | null
  pendingCollaborationThreadsCount?: number
  activeCollaborationThreadsCount?: number
  name: string | null
  email: string
  emailVerified: Date | null
  image?: string | null
  role: "admin" | "user"
  roles?: string[] | null
  theme: "light" | "dark" | "system"
  createdOn: Date
  updatedOn: Date
  activeOn: Date | null
  language: locale
  fingerprint: string | null
  isOnline: boolean | null
  subscribedOn: Date | null
  userName: string
  fileUploadsToday: number
  fileUploadsThisHour: number
  totalFileSizeToday: number
  lastFileUploadReset: Date | null
  speechRequestsToday: number
  speechRequestsThisHour: number
  speechCharactersToday: number
  lastSpeechReset: Date | null
  imagesGeneratedToday: number
  lastImageGenerationReset: Date | null
  lastMolt?: message
  lastTribe?: message
  lastMessage?: message
  favouriteAgent: modelName | string
  timezone: string | null
  tasksCount: number
  appleId: string | null
  migratedFromGuest: boolean
  credits: number
  subscription?: subscription
  token?: string
  creditsLeft?: number
  messagesLastHour?: number
  characterProfiles?: characterProfile[]
  memoriesCount?: number
  placeHolder?: placeHolder
  instructions?: instruction[]
  characterProfilesEnabled?: boolean | null
  memoriesEnabled?: boolean | null
  hasCalendarScope?: boolean
  city: string | null
  country: string | null
  apiKey?: string | null
  totalThreadCount?: number
  goldenRatioConfig?: {
    memory?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
    kanban?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
    characterProfile?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
    instructions?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
    placeholders?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
    vectorEmbed?: {
      threadThreshold: number
      messageThreshold: number
      enabled: boolean
    }
  } | null
  weather?: {
    location: string
    country: string
    temperature: string
    condition: string
    code: number
    createdOn: Date
    lastUpdated: Date
  } | null
}

export type envType = "development" | "production" | "staging" | "local"

export type weather = {
  location: string
  country: string
  temperature: string
  condition: string
  code: number
  createdOn: Date
  lastUpdated: Date
}

export type instructionBase = {
  id: string
  title: string
  emoji?: string
  requiresWebSearch?: boolean
  content?: string
  appName?: string
  appId?: string | null // Match instruction type from schema
}

export type affiliateStats = {
  hasAffiliateLink: boolean
  code?: string
  affiliateLink?: string
  stats?: {
    clicks: number
    conversions: number
    totalRevenue: number
    commissionEarned: number
    commissionPaid: number
    commissionPending: number
    commissionRate: number
    status: string
  }
  referrals?: {
    total: number
    pending: number
    converted: number
    paid: number
  }
  createdOn?: string
  pendingPayout?: {
    id: string
    amount: number
    status: string
    requestedOn: string
  }
}

export type newUser = Partial<user>

// Device types
export type device = {
  id: string
  type: string | null
  app: string | null
  os: string | null
  osVersion: string | null
  screenWidth: number | null
  screenHeight: number | null
  language: locale | null
  timezone: string | null
  browser: string | null
  browserVersion: string | null
  appVersion: string | null
  userId: string | null
  guestId: string | null
  createdOn: Date
  updatedOn: Date
  fingerprint: string
}
export type moodType =
  | "happy"
  | "sad"
  | "angry"
  | "astonished"
  | "inlove"
  | "thinking"
export type mood = {
  userId: string | null
  guestId: string | null
  id: string
  createdOn: Date
  updatedOn: Date
  type: moodType
  taskLogId: string | null
}
export type timer = {
  id: string
  createdOn: Date
  updatedOn: Date
  fingerprint: string
  userId: string
  count: number
  isCountingDown: boolean
  preset1: number
  preset2: number
  preset3: number
}
export type task = {
  id: string
  userId: string | null
  createdOn: Date
  description: string | null
  title: string
  guestId: string | null
  order: number | null
  modifiedOn: Date
  total:
    | {
        date: string
        count: number
      }[]
    | null
  selected: boolean | null
}
export type taskLog = {
  userId: string | null
  guestId: string | null
  taskId: string
  id: string
  createdOn: Date
  updatedOn: Date
  moodId: string | null
  mood: moodType | null
  content: string
}

export type newTaskLog = {
  content: string
  taskId: string
  id?: string | undefined
  createdOn?: Date | undefined
  updatedOn?: Date | undefined
  userId?: string | null | undefined
  guestId?: string | null | undefined
  moodId?: string | null | undefined
  mood?: moodType | null
}

export type newDevice = Partial<device>

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

// Subscription types
export type subscription = {
  id: string
  provider: "stripe" | "apple" | "google" | "crypto"
  subscriptionId: string
  sessionId: string | null
  status: "active" | "canceled" | "pastDue" | "ended" | "trialing"
  userId: string | null
  guestId: string | null
  appId: string | null
  createdOn: Date
  updatedOn: Date
  plan: "plus" | "pro" | "agency" | "sovereign"
}

export type newSubscription = Partial<subscription>

// Eğer bu tipler başka bir yerde tanımlıysa onları import et

// Guest types
export type guest = {
  id: string
  createdOn: Date
  updatedOn: Date
  ip: string
  suggestions?: {
    instructions: Array<instruction>
    lastGenerated?: string
  } | null
  fingerprint: string
  activeOn: Date
  email: string | null
  apiKeys: apiKeys | null
  tasksCount: number
  adConsent: boolean
  pearFeedbackCount: number
  lastCreditRewardOn?: Date | null
  pendingCollaborationThreadsCount?: number
  activeCollaborationThreadsCount?: number
  favouriteAgent: modelName | string
  credits: number
  isBot: boolean
  isOnline: boolean | null
  imagesGeneratedToday: number
  lastImageGenerationReset: Date | null
  migratedToUser: boolean
  fileUploadsToday: number
  fileUploadsThisHour: number
  totalFileSizeToday: number
  lastFileUploadReset: Date | null
  subscribedOn: Date | null
  speechRequestsToday: number
  speechRequestsThisHour: number
  speechCharactersToday: number
  lastSpeechReset: Date | null
  timezone: string | null
  subscription?: subscription
  token?: string
  creditsLeft?: number
  lastMessage?: message
  messagesLastHour?: number
  characterProfiles?: characterProfile[]
  placeHolder?: placeHolder
  instructions?: instruction[]
  characterProfilesEnabled?: boolean | null
  memoriesEnabled?: boolean | null
  city: string | null
  country: string | null
  weather?: {
    location: string
    country: string
    temperature: string
    condition: string
    code: number
    createdOn: Date
    lastUpdated: Date
  } | null
}

export type guest = guest & {
  memoriesCount: number | undefined
  messagesLastHour: number
  creditsLeft: number
  instructions?: instruction[]
  placeHolder?: placeHolder | undefined
  characterProfiles?: characterProfile[]
  lastMessage: string | undefined
  messageCount: number | undefined
  subscription: subscription | undefined
}
export type newGuest = Partial<guest>

export type sessionUser = user

export type sessionGuest = guest

// Account types
export type account = {
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export type newAccount = Partial<account>

// Session types
export type session = {
  env?: "development" | "production" | "staging"
  TEST_GUEST_FINGERPRINTS?: string[]
  TEST_MEMBER_FINGERPRINTS?: string[]
  TEST_MEMBER_EMAILS?: string[]
  fingerprint?: string
  token?: string
  aiAgents?: aiAgent[]
  accountApp?: sushi
  migratedFromGuest?: boolean
  hasNotification?: boolean
  createdOn?: string
  locale?: string
  aiAgent?: aiAgent
  VEX_LIVE_FINGERPRINTS?: string[]
  store: storeWithApps & {
    nextPage: string | null
    totalCount: number
  }
  stores?: Paginated<storeWithApps>
  versions: {
    webVersion: string
    firefoxVersion: string
    chromeVersion: string
    macosVersion: string
  }
  deviceId?: string
  app: sushi
  userBaseApp?: sushi
  guestBaseApp?: sushi
  // Device info from UAParser (server-side detection)
  device?: {
    vendor?: string
    model?: string
    type?: string
  }
  os?: {
    name?: string
    version?: string
  }
  browser?: {
    name?: string
    version?: string
    major?: string
  }
  guest?: sessionGuest

  user?: sessionUser
}

export type newSession = Partial<session>

// Verification token types
export type verificationToken = {
  identifier: string
  token: string
  expires: Date
}

export type newVerificationToken = Partial<verificationToken>

export type messages = {
  message: message & {
    isStreaming?: boolean
    isStreamingStop?: boolean
  }
  user?: user
  guest?: guest
  aiAgent?: aiAgent
  thread?: thread
  app?: sushi
  pearApp?: sushi
}[]

export type paginatedMessages = {
  messages: messages
  nextPage?: number
  totalCount?: number
}
// Thread types
export type thread = {
  isMolt?: boolean
  pearAppId?: string
  apps?: sushi[]
  creditsLeft?: number
  isTribe: boolean
  jobId?: string
  characterProfile?: characterProfile
  placeHolder?: placeHolder
  collaborations?:
    | {
        thread?: thread
        collaboration: collaboration
        user: user
      }[]
    | null
  moltUrl?: string
  moltId?: string
  submolt?: string
  pearApp?: sushi
  tribeId?: string
  isMainThread: boolean
  lastMessage?: message
  user?: user
  guest?: guest
  appId: string | null
  app?: sushi
  id: string
  userId: string | null
  guestId: string | null
  createdOn: Date
  updatedOn: Date
  title: string
  aiResponse: string
  isIncognito: boolean
  star: number | null
  bookmarks: Array<{
    userId?: string
    guestId?: string
    createdOn: string
  }> | null
  metadata: Record<string, string> | null
  instructions: string | null

  visibility: "private" | "protected" | "public"
  artifacts: Array<{
    type: string
    url?: string
    name: string
    sourceUrl?: string
    size: number
    data?: string
    id: string
  }> | null
  messageCount?: number
  lastTriggeredFeatures?: string[] | null
}

export type newThread = Partial<thread>

// Push subscription types
export type pushSubscription = {
  id: string
  userId: string | null
  guestId: string | null
  endpoint: string
  p256dh: string
  auth: string
  createdOn: Date
  updatedOn: Date
}

export type newPushSubscription = Partial<pushSubscription>

// Collaboration types
export type collaborationStatus = "active" | "pending" | "revoked" | "rejected"

export type collaboration = {
  id: string
  threadId: string
  role: "owner" | "collaborator"
  userId: string
  createdOn: Date
  updatedOn: Date
  activeOn: Date | null
  status: collaborationStatus | null
  isOnline: boolean | null
  isTyping: boolean | null
  lastTypedOn: Date | null
  expiresOn: Date | null
}

export type newCollaboration = Partial<collaboration>

// AI Agent types
export type aiAgent = {
  id: string
  name: string
  displayName: string
  version: string
  apiURL: string
  description: string | null
  state: "active" | "testing" | "inactive"
  creditCost: string // numeric(10,2) comes as string in Drizzle
  modelId: string
  appId: string | null
  userId: string | null
  guestId: string | null
  order: number
  maxPromptSize: number | null
  capabilities: {
    text?: boolean
    image?: boolean
    audio?: boolean
    video?: boolean
    webSearch?: boolean
    imageGeneration?: boolean
    codeExecution?: boolean
    videoGeneration?: boolean
    pdf?: boolean
  }
  authorization: "user" | "subscriber" | "guest" | "all"
  metadata: {
    lastFailedKey?: string
    "qwen/qwen3-235b-a22b-thinking-2507"?: Date
    "qwen/qwen3-vl-235b-a22b-thinking"?: Date
    "qwen/qwen3-vl-30b-a3b-thinking"?: Date
    "deepseek/deepseek-v3.2"?: Date
    "deepseek/deepseek-r1"?: Date
    failed?: string[]
  } | null
  // RPG Character Stats
  intelligence: number // 0-100
  creativity: number // 0-100
  empathy: number // 0-100
  efficiency: number // 0-100
  level: number // 1-99
  xp: number
}

// Web search result types
export type webSearchResult = {
  title: string
  url: string
  snippet: string
}

// Task analysis types
export type taskAnalysis = {
  type: "chat" | "automation" | "booking" | "summary" | "scraping"
  creditMultiplier: number
  estimatedTokens: number
  confidence: number
}

// Model name types
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

// Message types
export type message = {
  id: string
  role?: "user" | "assistant" | "system"
  parts?: MessagePart[]
  jobId: string | null
  tribeSummary?: string | null
  agentId: string | null
  debateAgentId: string | null
  pauseDebate: boolean
  clientId: string
  selectedAgentId: string | null
  isWebSearchEnabled: boolean
  isImageGenerationEnabled: boolean
  agentVersion: string | null
  userId: string | null
  app?: sushi | null
  isMolt?: boolean
  isTribe?: boolean
  tribePostId?: string | null
  guestId: string | null
  content: string
  pearAppId?: string | null
  reasoning: string | null
  originalContent: string | null
  createdOn: Date
  updatedOn: Date
  readOn: Date | null
  threadId: string
  metadata: {
    analysis?: taskAnalysis
  } | null
  task: "chat" | "automation" | "booking" | "summary" | "scraping"
  files: Array<{
    type: string
    url?: string
    sourceUrl?: string

    name: string
    size: number
    data?: string
    id: string
  }> | null
  reactions: Array<{
    like: boolean
    dislike: boolean
    userId?: string
    guestId?: string
    createdOn: string
  }> | null
  creditCost: string
  moltUrl?: string | null
  moltId?: string | null
  submolt?: string | null
  tribeId?: string | null
  webSearchResult: webSearchResult[] | null
  searchContext: string | null
  images: Array<{
    url: string
    prompt?: string
    model?: string
    width?: number
    height?: number
    title?: string
    id: string
  }> | null
  audio: Array<{
    url: string
    size?: number
    title?: string
    id: string
  }> | null
  video: Array<{
    url: string
    size?: number
    title?: string
    id: string
  }> | null
}

export type newMessage = Partial<message>

// Credit usage types
export type creditUsage = {
  id: string
  userId: string | null
  guestId: string | null
  agentId: string
  creditCost: string
  messageType: "user" | "ai" | "image" | "search"
  threadId: string | null
  messageId: string | null
  createdOn: Date
}

export type newCreditUsage = Partial<creditUsage>

// System log types
export type systemLog = {
  id: string
  level: "info" | "warn" | "error"
  userId: string | null
  guestId: string | null
  message: string | null
  object: any | null
  createdOn: Date
  updatedOn: Date
}

export type newSystemLog = Partial<systemLog>

// Invitation types
export type invitation = {
  id: string
  threadId: string | null
  userId: string | null
  guestId: string | null
  email: string
  createdOn: Date
  updatedOn: Date
  gift: string | null
  status: "accepted" | "pending" | null
}

export type newInvitation = Partial<invitation>

// Calendar event types
export type calendarEvent = {
  id: string
  userId: string | null
  guestId: string | null
  title: string
  description: string | null
  location: string | null
  startTime: Date
  endTime: Date
  isAllDay: boolean
  timezone: string | null
  color: "red" | "orange" | "blue" | "green" | "violet" | "purple" | null
  category: string | null
  isRecurring: boolean
  recurrenceRule: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    endDate?: string
    daysOfWeek?: number[] // 0-6, Sunday = 0
    dayOfMonth?: number
    weekOfMonth?: number
  } | null
  attendees: Array<{
    email: string
    name?: string
    status: "pending" | "accepted" | "declined"
    isOrganizer?: boolean
  }>
  threadId: string | null
  agentId: string | null
  aiContext: {
    originalPrompt?: string
    confidence?: number
    suggestedBy?: string
  } | null
  reminders: Array<{
    type: "email" | "notification" | "popup"
    minutesBefore: number
    sent?: boolean
  }>
  status: "confirmed" | "tentative" | "canceled"
  visibility: "private" | "public" | "shared"
  externalId: string | null
  externalSource: "google" | "outlook" | "apple" | null
  lastSyncedAt: Date | null
  createdOn: Date
  updatedOn: Date
}

export type newCalendarEvent = Partial<calendarEvent>

// Document summary types
export type documentSummary = {
  id: string
  messageId: string | null
  threadId: string | null
  filename: string
  fileType: string
  fileSizeBytes: number | null
  summary: string | null
  keyTopics: any | null
  totalChunks: number | null
  createdOn: Date
  updatedOn: Date
}

export type newDocumentSummary = Partial<documentSummary>

// Thread summary types
export type threadSummary = {
  id: string
  threadId: string
  userId: string | null
  guestId: string | null
  summary: string
  keyTopics?: string[] | null
  messageCount: number
  lastMessageAt: Date | null
  ragContext: {
    documentSummaries: string[]
    relevantChunks: { content: string; source: string; score: number }[]
    conversationContext: string
  } | null
  userMemories: Array<userMemories> | null
  characterTags: characterTags | null
  embedding: any | null
  metadata: {
    version: string
    generatedBy: string
    confidence: number
    lastUpdated: string
  } | null
  createdOn: Date
  updatedOn: Date
}

export type newThreadSummary = Partial<threadSummary>

// Placeholder types
export type placeHolder = {
  id: string
  appId: string | null
  text: string
  userId: string | null
  guestId: string | null
  createdOn: Date
  updatedOn: Date
  threadId: string | null
  metadata: {
    history?: Array<{
      text: string
      generatedAt: string
      conversationContext?: string
      topicKeywords?: string[]
    }>
    clickCount?: number
    lastClickedAt?: string
    impressionCount?: number
    generatedBy?: "deepseek"
    confidence?: number
  } | null
}

export type newPlaceHolder = Partial<placeHolder>

// Character profile types
export type characterProfile = {
  id: string
  agentId?: string | null
  userId?: string | null
  guestId?: string | null
  visibility: "private" | "protected" | "public"
  name: string
  personality: string

  pinned: boolean
  traits: {
    [key: string]: string[]
  }
  threadId?: string | null
  tags?: string[] | null
  usageCount: number
  lastUsedAt?: Date | null
  userRelationship?: string | null
  conversationStyle?: string | null
  embedding?: any | null
  metadata?: {
    version: string
    createdBy: string
    effectiveness: number
  } | null
  createdOn: Date
  updatedOn: Date
}

export type newCharacterProfile = Partial<characterProfile>

export const emojiMap: Record<moodType, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  astonished: "😲",
  inlove: "😍",
  thinking: "🧐",
}

export type pollen = chrry & {
  instructions?: string[]
  files?: File[]
}

export type bee = sushi & {
  hippo?: pollen
  vex?: pollen
  peach?: pollen
  focus?: pollen
  vault?: pollen
  sushi?: pollen
  pear?: pollen
  grape?: pollen
  chrry?: pollen
  popcorn?: pollen
}
// App types
export type chrry = {
  id: string
  isSystem?: boolean
  image?: string
  moltApiKey: string | null
  moltHandle: string | null
  moltAgentName: string | null
  moltAgentKarma: number | null
  moltAgentVerified: boolean | null
  moltPostedOn: Date | null
  moltCommentedOn: Date | null
  storeId: string | null
  store?: storeWithApps | null
  userId: string | null
  blueskyHandle: string | null
  blueskyPassword?: string | null
  guestId: string | null
  mainThreadId: string | null
  teamId: string | null
  tools: ("calendar" | "location" | "weather")[] | null
  name: string
  subtitle: string | null
  title: string
  description: string | null
  featureList?: string[] | null
  characterProfiles?: Partial<characterProfile>[] | null
  characterProfile?: Partial<characterProfile> | null
  icon: string | null
  tips: Array<{
    id: string
    content?: string
    emoji?: string
  }> | null
  placeHolder?: placeHolder | null
  instructions?: instruction[] | null
  storeSlug?: string | null
  scheduledJobs?: scheduledJob[]
  swarm?: swarm
  userMemories?: userMemories[]
  appMemories?: userMemories[]
  dnaArtifacts?: string
  user?: user | null
  guest?: guest | null
  agent?: aiAgent
  dnaMemories?: userMemories[]
  userPlaceholders?: placeHolder[]
  appPlaceholders?: placeHolder[]
  dnaPlaceholders?: placeHolder[]
  threadPlaceholders?: placeHolder[]
  threadMemories?: threadMemories[]
  threadInstructions?: instruction[]
  userInstructions?: instruction[]
  appInstructions?: instruction[]
  dnaInstructions?: instruction[]
  threadCharacterProfiles?: characterProfile[]
  dnaCharacterProfiles?: characterProfile[]
  appCharacterProfiles?: characterProfile[]
  tipsTitle: string | null
  images: Array<{
    url: string
    width?: number
    height?: number
    id: string
  }> | null
  slug: string
  highlights: Array<{
    id: string
    title: string
    content?: string
    emoji?: string
    requiresWebSearch?: boolean
    appName?: string
  }> | null
  version: string
  extends?: app[] | null
  status:
    | "testing"
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "active"
    | "inactive"
  submittedForReviewAt: Date | null
  reviewedAt: Date | null
  reviewedBy: string | null
  rejectionReason: string | null
  manifestUrl: string | null
  themeColor: string | null
  backgroundColor: string | null
  displayMode: "standalone" | "fullscreen" | "minimal-ui" | "browser" | null
  placeholder: string | null
  extend: Array<string> | null
  onlyAgent: boolean // If true, app only works with user's default agent
  capabilities: {
    text?: boolean
    image?: boolean
    audio?: boolean
    video?: boolean
    webSearch?: boolean
    imageGeneration?: boolean
    videoGeneration?: boolean
    codeExecution?: boolean
    pdf?: boolean
  } | null
  tags?: string[] | null
  systemPrompt: string | null
  tone: "professional" | "casual" | "friendly" | "technical" | "creative" | null
  language: locale | null
  knowledgeBase: string | null
  ragDocumentIds?: string[] | null
  ragEnabled: boolean
  examples: Array<{ user: string; assistant: string }> | null
  visibility: "private" | "public" | "unlisted"
  defaultModel: string | null
  temperature: number | null
  pricing: "free" | "one-time" | "subscription"
  tier: "free" | "plus" | "pro"
  price: number | null
  currency: string | null
  subscriptionInterval: "monthly" | "yearly" | null
  stripeProductId: string | null
  stripePriceId: string | null
  revenueShare: number | null
  apiKeys: apiKeys | null
  limits: {
    promptInput?: number
    promptTotal?: number
    speechPerHour?: number
    speechPerDay?: number
    speechCharsPerDay?: number
    fileUploadMB?: number
    filesPerMessage?: number
    messagesPerHour?: number
    messagesPerDay?: number
    imageGenerationsPerDay?: number
  } | null
  apiEnabled: boolean
  apiPricing: "free" | "per-request" | "subscription" | null
  apiPricePerRequest?: number | null
  apiMonthlyPrice?: number | null
  apiRateLimit?: number | null
  apiKey?: string | null
  chromeWebStoreUrl: string | null
  apiRequestCount: number
  apiRevenue: number
  usageCount: number
  likeCount: number
  shareCount: number
  installCount: number
  subscriberCount: number
  totalRevenue: number
  createdOn: Date
  updatedOn: Date
  features: { [key: string]: boolean } | null
  // OpenAI-compatible AI context - server/client same interface
  ai?: ChrryAiContext | null
}

export type newApp = Partial<app>

export type Paginated<T> = T & {
  items: T[]
  nextPage: string | null
  totalCount: number
}

// Store types
export type store = {
  id: string
  name: string
  isSystem: boolean | null
  slug: string
  title: string | null
  images: Array<{
    url: string
    width?: number
    height?: number
    id: string
  }> | null
  excludeGridApps: string[] | null
  teamId: string | null
  domain: string | null
  appId: string | null
  userId: string | null
  guestId: string | null
  parentStoreId: string | null
  createdOn: Date
  updatedOn: Date
  apps: sushi[] | null
  description?: string | null
  app: sushi | null
}

export const models = [
  "chatGPT",
  "claude",
  "deepSeek",
  "gemini",
  "flux",
  "perplexity",
  "sushi",
  "grok",
] as const

export interface slot {
  title: string
  description: string
  rules?: string[]
  appId: string
  prompt: string
  autonomous?: boolean
  charLimit?: number
  maxCredits?: number
  modelId?: string
  maxTokens?: number
  tone?: string[]
}

const aiSources = {
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

export type scheduledJobStatus =
  | "draft"
  | "pending_payment"
  | "active"
  | "paused"
  | "completed"
  | "canceled"

export type scheduledJob = {
  id: string
  appId: string | null
  userId: string | null
  guestId: string | null
  name: string
  scheduleType: string
  jobType: string
  frequency: "once" | "daily" | "weekly" | "custom"
  scheduledTimes: swarm[]
  timezone: string
  startDate: Date
  endDate: Date | null
  aiModel: string
  modelConfig: {
    model?: string
    temperature?: number
    maxTokens?: number
  } | null
  contentTemplate: string | null
  contentRules: {
    tone?: string
    length?: string
    topics?: string[]
    hashtags?: string[]
  } | null
  estimatedCreditsPerRun: number
  totalEstimatedCredits: number
  creditsUsed: number
  isPaid: boolean
  stripePaymentIntentId: string | null
  status: scheduledJobStatus
  lastRunAt: Date | null
  nextRunAt: Date | null
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  failureReason: string | null
  totalPrice: number | null
  pendingPayment: number | null
  calendarEventId: string | null
  metadata: {
    modelId?: string
    errors?: Array<{ timestamp: string; error: string }>
    lastOutput?: string
    performance?: { avgDuration: number; avgCredits: number }
    tribeSlug?: string
    cooldownMinutes?: number
    platformInterval?: number
    languages?: string[]
  } | null
  createdOn: Date
  updatedOn: Date
}

export type storeWithApps = store & { apps?: sushi[] }

export type sushi = chrry

export type app = sushi

// Instruction types
export type instruction = {
  id: string
  appId: string | null
  userId: string | null
  guestId: string | null
  title: string
  emoji: string
  content: string
  confidence: number
  generatedAt: Date
  requiresWebSearch: boolean
  createdOn: Date
  updatedOn: Date
}

export type newInstruction = Partial<instruction>

// City types
export type city = {
  id: string
  name: string
  country: string
  population: number | null
  createdOn: Date
  updatedOn: Date
}

export type newCity = Partial<city>

// Custom push subscription types (for queries)
export type newCustomPushSubscription = {
  endpoint: string
  createdOn: Date
  updatedOn: Date
  keys: {
    p256dh: string
    auth: string
  }
}

export type customPushSubscription = newCustomPushSubscription & {
  id: string
}

// Message action type (for automation/booking)
export type messageActionType = {
  type: string
  params?: Record<string, any>
  times?: number // Number of times to repeat this action (for calendar navigation, etc.)
  completed?: boolean
  result?: unknown
  remember?: boolean
}

// Budget category type
export type budgetCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "bills"
  | "health"
  | "education"
  | "travel"
  | "other"

// Tribe types
export type tribe = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  membersCount: number
  postsCount: number
  visibility: "public" | "private" | "restricted"
  moderatorIds: string[]
  rules: string | null
  metadata: {
    color?: string
    banner?: string
    tags?: string[]
  } | null
  createdOn: Date
  updatedOn: Date
}

export type tribePost = {
  id: string
  content: string
  title?: string | null
  visibility: "public" | "private" | "tribe"
  likesCount: number
  commentsCount: number
  appId: string
  threadId?: string
  sharesCount: number
  languages?: locale[]
  language?: locale
  createdOn: Date
  updatedOn: Date
  app: sushi
  placeholder?: string
  user: Partial<user> | null
  guest: Partial<guest> | null
  images: Array<{
    url: string
    prompt?: string
    model?: string
    width?: number
    height?: number
    title?: string
    id: string
    sourceUrl?: string
  }> | null
  audio: Array<{
    url: string
    size?: number
    title?: string
    id: string
    sourceUrl?: string
  }> | null
  videos: Array<{
    url: string
    thumbnail?: string
    size?: number
    title?: string
    sourceUrl?: string
    id: string
  }> | null
  seoKeywords?: string[] | null
  tribe: tribe | null
  likes?: {
    id: string
    createdOn: Date
    user: {
      id: string
      name: string | null
      userName: string | null
      image: string | null
    } | null
    guest: {
      id: string
      name: string
      image: string
    } | null
  }[]
  comments?: tribeComment[]
  reactions?: {
    id: string
    emoji: string
    createdOn: Date
    app?: sushi
    user: {
      id: string
      name: string | null
      userName: string | null
      image: string | null
    } | null
    guest: {
      id: string
      name: string
      image: string
    } | null
  }[]
  characterProfiles?: characterProfile[]
}

export type tribeComment = {
  id: string
  postId?: string
  userId?: string | null
  guestId?: string | null
  appId?: string | null
  content: string
  parentCommentId?: string | null
  likesCount: number
  metadata?: Record<string, any> | null
  createdOn: Date
  updatedOn: Date
  user?: Partial<user> | null
  guest?: Partial<guest> | null
  app?: sushi
  reactions?: tribeReaction[]
  languages?: locale[]
  language?: locale
}

export type tribeLike = {
  id: string
  userId?: string | null
  guestId?: string | null
  postId?: string | null
  commentId?: string | null
  createdOn: Date
  user?: {
    id: string
    name: string | null
    userName: string | null
    image: string | null
  } | null
  guest?: {
    id: string
    name: string
    image: string
  } | null
}

export type tribeReaction = {
  id: string
  userId?: string | null
  guestId?: string | null
  appId?: string | null
  postId?: string | null
  commentId?: string | null
  emoji: string
  createdOn: Date
  app?: sushi
  user?: {
    id: string
    name: string | null
    userName: string | null
    image: string | null
  } | null
  guest?: {
    id: string
    name: string
    image: string
  } | null
}

export type tribeFollow = {
  id: string
  followerId: string | null
  appId: string | null
  followerGuestId: string | null
  followingAppId: string
  notifications: boolean
  createdOn: Date
}

export type paginatedTribes = {
  tribes: tribe[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}

export type paginatedTribePosts = {
  posts: tribePost[]
  totalCount: number
  hasNextPage: boolean
  nextPage: number | null
}

export type tribePostWithDetails = tribePost & {
  comments: tribeComment[]
  reactions: tribeReaction[]
  likes: tribeLike[]
  stats: {
    commentsCount: number
    likesCount: number
    sharesCount: number
    reactionsCount: number
  }
}

/** Eski yapı - geriye uyumluluk için korundu
 *  @deprecated use spatialEntry<sushi> for new code
 */
export type spatialNavigationEntry = {
  appId: string
  appName: string
  timestamp: number
  duration?: number
  from?: string
}

// Constants
export const PLUS_CREDITS_PER_MONTH = 2000
export const ADDITIONAL_CREDITS = 500
export const GUEST_CREDITS_PER_MONTH = 50
export const MEMBER_CREDITS_PER_MONTH = 150
export const MAX_INSTRUCTIONS_CHAR_COUNT = 7500
export const MAX_THREAD_TITLE_CHAR_COUNT = 100

export const PROMPT_LIMITS = {
  INPUT: 7000,
  INSTRUCTIONS: 2000,
  TOTAL: 30000,
  WARNING_THRESHOLD: 5000,
  THREAD_TITLE: 100,
} as const
