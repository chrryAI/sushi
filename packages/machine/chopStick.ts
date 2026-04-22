// import { type locale, locales } from "@chrryai/donut/locales"
// import type {
//   aiAgent,
//   cherry,
//   store as chrryStore,
//   guest,
//   guest,
//   instructionBase,
//   message,
//   modelName,
//   sushi,
//   user,
//   userWithRelations,
// } from "@chrryai/donut/types"
// import * as bcrypt from "bcrypt"
// import * as dotenv from "dotenv"
// import {
//   and,
//   asc,
//   cosineDistance,
//   count,
//   desc,
//   eq,
//   exists,
//   gt,
//   gte,
//   ilike,
//   inArray,
//   isNotNull,
//   isNull,
//   lt,
//   lte,
//   max,
//   ne,
//   not,
//   notInArray,
//   or,
//   type SQL,
//   sql,
//   sum,
// } from "drizzle-orm"
// import {
//   type PostgresJsDatabase,
//   drizzle as postgresDrizzle,
// } from "drizzle-orm/postgres-js"
// import langdetect from "langdetect"
// import pLimit from "p-limit"
// import postgres from "postgres"
// import { v4 as uuidv4 } from "uuid"
// import {
//   buildPromptSections,
//   resolveJoinWeights,
//   resolveMemoryPageSize,
// } from "./src/ai/sushi/promptBuilder"
// import {
//   getEmbeddingProvider,
//   getMediaAPIKeys,
//   getModelProvider,
// } from "./src/ai/sushi/provider"
// import { MODEL_LIMITS, type ModelProviderResult } from "./src/ai/vault"
// // import { createStores } from "./src/dna/createStores"
// import { decrypt } from "./src/encryption"
// import { deleteFalkorUser } from "./src/falkorSync"
// // Better Auth tables

// import {
//   getCache,
//   invalidateApp,
//   invalidateGuest,
//   invalidateStore,
//   invalidateUser,
//   setCache,
// } from "./src/cache"
// import { getPresignedUrl as getSignedS3Url } from "./src/lib/s3-signer"
// import { redis } from "./src/redis"
// import * as schema from "./src/schema"
// import {
//   accounts,
//   affiliateClicks,
//   affiliateLinks,
//   affiliatePayouts,
//   affiliateReferrals,
//   agentApiUsage,
//   aiAgents,
//   analyticsSites,
//   type apiKeys,
//   appCampaigns,
//   appExtends,
//   appOrders,
//   apps,
//   authExchangeCodes,
//   autonomousBids,
//   budgets,
//   calendarEvents,
//   cfApiRequests,
//   cfRateLimitEvents,
//   cfSdkSessions,
//   cfZones,
//   characterProfiles,
//   cities,
//   codebaseIssues,
//   codebaseQueries,
//   codeEmbeddings,
//   collaborations,
//   creditTransactions,
//   creditUsages,
//   devices,
//   documentChunks,
//   expenses,
//   feedbackTransactions,
//   GUEST_CREDITS_PER_MONTH,
//   guests,
//   hippos,
//   installs,
//   instructions,
//   invitations,
//   kanbanBoards,
//   kanbanCards,
//   kanbanColumns,
//   memories,
//   messageEmbeddings,
//   messages,
//   moods,
//   pearFeedback,
//   placeHolders,
//   premiumSubscriptions,
//   pushSubscriptions,
//   type ramen,
//   realtimeAnalytics,
//   recruitmentFlows,
//   retroResponses,
//   retroSessions,
//   scheduledJobs,
//   sharedExpenses,
//   slotAuctions,
//   slotRentals,
//   sonarIssues,
//   sonarMetrics,
//   storeInstalls,
//   stores,
//   storeTimeSlots,
//   streamLogs,
//   subscriptions,
//   type swarm,
//   systemLogs,
//   talentEarnings,
//   talentInvitations,
//   talentProfiles,
//   talentThreads,
//   taskLogs,
//   taskStates,
//   tasks,
//   teams,
//   threadSummaries,
//   threads,
//   timers,
//   tribeComments,
//   tribeFollows,
//   tribeLikes,
//   tribeMemberships,
//   tribeNews,
//   tribePosts,
//   tribePostTranslations,
//   tribeReactions,
//   tribes,
//   users,
//   verificationTokens,
// } from "./src/schema"

// export type {
//   aiModel,
//   aiModelResponse,
//   aiSources,
//   appCampaign,
//   autonomousBid,
//   KanbanCard,
//   KanbanColumn,
//   NewKanbanCard,
//   NewKanbanColumn,
//   NewUserKanbanBoard,
//   newAppCampaign,
//   newAutonomousBid,
//   newSlotAuction,
//   newSlotRental,
//   newStoreTimeSlot,
//   slotAuction,
//   slotRental,
//   storeTimeSlot,
//   swarm,
//   UserKanbanBoard,
// } from "./src/schema"

// export const chopStick = async <T extends sushi>(
//   payload: ramen,
// ): Promise<sushi | undefined> => {
//   // Build app identification conditions
//   const llm = payload?.llm
//   const appConditions = []

//   const {
//     id,
//     slug,
//     userId,
//     guestId,
//     storeId,
//     storeSlug,
//     storeDomain,
//     ownerId,
//     threadId,
//     isSystem,
//     role,
//     exclude,
//     name,
//     include: includeInternal,
//     join,
//     agent,
//     buildPrompt,
//     messageCount,
//   } = payload
//   const cacheKey = makeCacheKey(payload)
//   const skipCache = payload.skipCache || !includeInternal?.includes("store")
//   if (!skipCache) {
//     const cached = await getCache<sushi>(cacheKey)
//     if (cached) return cached
//   }

//   const depth = payload.depth || payload.includes("store") ? 1 : 0

//   const defaultInclude =
//     depth > 0
//       ? ["characterProfiles", "highlights", "store"]
//       : ["characterProfiles"]

//   const include = [...defaultInclude, ...(includeInternal || [])].filter(
//     (i) => !exclude?.includes(i as keyof sushi),
//   ) as (keyof sushi)[]

//   // Agent-driven join: agent.metadata.join overrides caller-supplied join
//   // which itself overrides defaults. Resolution order: agent > payload > defaults.
//   // const agentJoin = buildPrompt ? (agent as any)?.metadata?.join : null

//   if (name) {
//     appConditions.push(
//       eq(apps.name, name as "Atlas" | "Peach" | "Vault" | "Bloom"),
//     )
//   }

//   if (slug) {
//     appConditions.push(eq(apps.slug, slug))
//   }

//   if (ownerId) {
//     appConditions.push(or(eq(apps.userId, ownerId), eq(apps.guestId, ownerId)))
//   }

//   if (id) {
//     appConditions.push(eq(apps.id, id))
//   }

//   if (role) {
//     appConditions.push(eq(users.role, role))
//   }

//   if (storeId) {
//     appConditions.push(eq(apps.storeId, storeId))
//   }

//   if (storeSlug) {
//     appConditions.push(eq(stores.slug, storeSlug))
//   }

//   if (storeDomain) {
//     appConditions.push(eq(stores.domain, storeDomain))
//   }
//   if (isSystem) {
//     appConditions.push(eq(stores.isSystem, isSystem))
//   }

//   if (isSystem === false) {
//     appConditions.push(not(stores.isSystem))
//   }

//   // Build access conditions (can user/guest access this app?)
//   // Skip access check when searching by ID or ownerId (direct lookup)
//   const accessConditions =
//     id || ownerId
//       ? undefined
//       : or(
//           // User's own apps
//           userId ? eq(apps.userId, userId) : undefined,
//           // Guest's own apps
//           guestId ? eq(apps.guestId, guestId) : undefined,
//           eq(apps.visibility, "public"),
//         )

//   // Build query with conditional store join
//   const query = db
//     .select({
//       app: apps,
//       user: users,
//       guest: guests,
//       store: stores,
//     })
//     .from(apps)
//     .leftJoin(users, eq(apps.userId, users.id))
//     .leftJoin(guests, eq(apps.guestId, guests.id))
//     .leftJoin(stores, eq(apps.storeId, stores.id))

//   const [app] = await query.where(
//     and(
//       appConditions.length > 0 ? and(...appConditions) : undefined,
//       accessConditions,
//     ),
//   )

//   if (!app) return undefined

//   // Determine if user is owner from query result
//   const isOwner =
//     (userId && app.app.userId === userId) ||
//     (guestId && app.app.guestId === guestId)

//   // Phase 1b: dnaUser + dnaGuest in parallel (both depend only on dnaThread)

//   // if (app.store && app.store.slug !== app.app.storeSlug) {
//   //   await updateApp({ id: app.app.id, storeSlug: app.store.slug })
//   // }

//   const fullUser = llm
//     ? await getUser({
//         id: userId,
//       })
//     : undefined

//   const fullGuest =
//     llm && !fullUser
//       ? await getGuest({
//           id: guestId,
//         })
//       : undefined
//   // Get DNA thread (app's main thread)
//   const dnaThread = app.app.mainThreadId
//     ? await db
//         .select()
//         .from(threads)
//         .where(eq(threads.id, app.app.mainThreadId))
//         .limit(1)
//         .then((r) => r.at(0))
//     : undefined
//   const [dnaUser, dnaGuest] = await Promise.all([
//     dnaThread?.userId
//       ? db
//           .select()
//           .from(users)
//           .where(eq(users.id, dnaThread.userId))
//           .limit(1)
//           .then((r) => r.at(0))
//       : Promise.resolve(undefined),
//     dnaThread?.guestId
//       ? db
//           .select()
//           .from(guests)
//           .where(eq(guests.id, dnaThread.guestId))
//           .limit(1)
//           .then((r) => r.at(0))
//       : Promise.resolve(undefined),
//   ])

//   const isCharacterProfileEnabled =
//     dnaUser?.characterProfilesEnabled ||
//     dnaGuest?.characterProfilesEnabled ||
//     isOwner ||
//     false

//   const hasDNA =
//     effectiveJoin?.characterProfile?.dna ||
//     effectiveJoin?.memories?.dna ||
//     effectiveJoin?.instructions?.dna ||
//     effectiveJoin?.placeholders?.dna

//   const canDNA = hasDNA && isCharacterProfileEnabled

//   let generativeModel
//   let embeddingModel
//   // Phase 2: All independent queries in parallel (concurrency limited to 5)
//   const limit = pLimit(15)
//   const [
//     /*1*/ userMemories,
//     /*2*/ userCharacterProfiles,
//     /*3*/ appCharacterProfiles,
//     /*4*/ threadCharacterProfiles,
//     /*5*/ dnaCharacterProfiles,
//     /*6*/ threadMemories,
//     /*7*/ appMemories,
//     /*8*/ dnaMemories,
//     /*9*/ threadPlaceholders,
//     /*10*/ userPlaceholders,
//     /*11*/ appPlaceholders,
//     /*12*/ dnaPlaceholders,
//     /*13*/ userInstructions,
//     /*14*/ appInstructions,
//     /*15*/ threadInstructions,
//     /*16*/ dnaInstructions,
//     /*17*/ storeApps,
//   ] = await Promise.all([
//     // 1 user memories
//     limit(() =>
//       effectiveJoin?.memories?.user
//         ? getMemories({
//             pageSize: effectiveJoin.memories.user,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 2 user character profiles
//     limit(() =>
//       include.includes("characterProfiles")
//         ? getCharacterProfiles({
//             limit: effectiveJoin?.characterProfile?.user ?? 5,
//             userId,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 3 app character profiles
//     limit(() =>
//       include.includes("characterProfiles")
//         ? getCharacterProfiles({
//             limit: effectiveJoin?.characterProfile?.app ?? 3,
//             userId,
//             appId: app.app.id,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 4 thread character profiles
//     limit(() =>
//       include.includes("characterProfiles") && threadId
//         ? getCharacterProfiles({
//             limit: effectiveJoin?.characterProfile?.thread ?? 3,
//             userId,
//             threadId,
//             appId: app.app.id,
//             guestId,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 5 dna character profiles (app-owner profiles, visible to everyone)
//     limit(() =>
//       dnaThread && isCharacterProfileEnabled
//         ? getCharacterProfiles({
//             limit: effectiveJoin?.characterProfile?.dna ?? 3,
//             appId: app.app.id,
//             isAppOwner: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 6 thread memories
//     limit(() =>
//       effectiveJoin?.memories?.thread && threadId
//         ? getMemories({
//             threadId,
//             pageSize: effectiveJoin.memories.thread,
//             userId,
//             guestId,
//             appId: app.app.id,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 7 app memories
//     limit(() =>
//       effectiveJoin?.memories?.app
//         ? getMemories({
//             pageSize: effectiveJoin.memories.app,
//             appId: app.app.id,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 8 dna memories
//     limit(() =>
//       isCharacterProfileEnabled && effectiveJoin?.memories?.dna && dnaThread
//         ? getMemories({
//             threadId: dnaThread.id,
//             pageSize: effectiveJoin.memories.dna,
//             scatterAcrossThreads: true,
//           }).then((a) => a.memories)
//         : Promise.resolve(undefined),
//     ),
//     // 9 thread placeholders
//     limit(() =>
//       effectiveJoin?.placeholders?.thread && threadId
//         ? getPlaceHolders({
//             threadId,
//             appId: app.app.id,
//             pageSize: effectiveJoin.placeholders.thread,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 10 user placeholders
//     limit(() =>
//       effectiveJoin?.placeholders?.user
//         ? getPlaceHolders({
//             pageSize: effectiveJoin.placeholders.user,
//             userId,
//             guestId,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 11 app placeholders
//     limit(() =>
//       isCharacterProfileEnabled && effectiveJoin?.placeholders?.app
//         ? getPlaceHolders({
//             appId: app.app.id,
//             userId,
//             guestId,
//             pageSize: effectiveJoin.placeholders.app,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 12 dna placeholders
//     limit(() =>
//       effectiveJoin?.placeholders?.dna && dnaThread && isCharacterProfileEnabled
//         ? getPlaceHolders({
//             threadId: dnaThread.id,
//             pageSize: effectiveJoin.placeholders.dna,
//             userId: dnaThread.userId || undefined,
//             guestId: dnaThread.guestId || undefined,
//             scatterAcrossThreads: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 13 user instructions
//     limit(() =>
//       effectiveJoin?.instructions?.user && (userId || guestId)
//         ? getInstructions({
//             userId,
//             guestId,
//             pageSize: effectiveJoin.instructions.user,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 14 app instructions
//     limit(() =>
//       effectiveJoin?.instructions?.app
//         ? getInstructions({
//             appId: app.app.id,
//             pageSize: effectiveJoin.instructions.app,
//             userId,
//             guestId,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 15 thread instructions
//     limit(() =>
//       effectiveJoin?.instructions?.thread && threadId
//         ? getInstructions({
//             threadId,
//             userId,
//             guestId,
//             appId: app.app.id,
//             scatterAcrossApps: true,
//             pageSize: effectiveJoin.instructions.thread,
//           })
//         : Promise.resolve(undefined),
//     ),
//     // 16 dna instructions
//     limit(() =>
//       effectiveJoin?.instructions?.dna && dnaThread && isCharacterProfileEnabled
//         ? getInstructions({
//             appId: app.app.id,
//             threadId: dnaThread.id,
//             pageSize: effectiveJoin.instructions.dna,
//             userId: dnaThread.userId || undefined,
//             guestId: dnaThread.guestId || undefined,
//             scatterAcrossApps: true,
//           })
//         : Promise.resolve(undefined),
//     ),

//     // 17 store apps
//     limit(async () => {
//       if (depth <= 0) {
//         return Promise.resolve(undefined)
//       }
//       if (!include.includes("store")) {
//         return Promise.resolve(undefined)
//       }

//       return getStoreApps({
//         ...payload,
//       }).then((a) => a?.store?.apps)
//     }),
//     // 18 & 19: resolved below after Promise.all — model/embedding need full app context
//   ])

//   const beast = storeApps?.find((a) => a?.id === app.store?.appId)

//   // Resolve LLM provider eagerly — app, user, guest are all available here
//   const [resolvedModel, resolvedEmbedding] = llm
//     ? await Promise.all([
//         getModelProvider({
//           app: app.app,
//           modelId: payload.modelId,
//           name: agent?.name,
//           job: payload,
//           swarm: payload?.swarm,
//           guest,
//           source: payload.source || "chopstick",
//         }),
//         getEmbeddingProvider({
//           app: app.app,
//           modelId: payload.modelId,
//           name: agent?.name,
//           job: payload,
//           swarm: payload?.swarm,
//           guest,
//           source: payload.source || "chopstick",
//         }),
//       ])
//     : [undefined, undefined]

//   // Build result object
//   const result = {
//     ...(toSafeApp({
//       app: app.app,
//       userId,
//       guestId,
//     }) as unknown as app),
//     user: toSafeUser({ user: fullUser || app.user }),
//     guest: toSafeGuest({ guest: fullGuest || app.guest }),

//     store: app.store
//       ? {
//           name: app.store.name,
//           title: app.store.title,
//           description: app.store.description,
//           slug: app.store.slug,
//           images: app.store.images,
//           excludeGridApps: app.store.excludeGridApps,
//           isSystem: app.store.isSystem,
//           domain: app.store.isSystem,
//           appId: app.store.appId,
//           userId: app.store.appId,
//           guestId: app.store.guestId,
//           parentStoreId: app.store.parentStoreId,
//           visibility: app.store.visibility,
//           createdOn: app.store.createdOn,
//           updatedOn: app.store.updatedOn,
//           app: toSafeApp({ app: beast }) ?? undefined,
//           apps: !include.includes("store")
//             ? []
//             : (storeApps?.filter(Boolean).map((a) => toSafeApp({ app: a })) ??
//               []),
//         }
//       : undefined,
//     instructions: threadInstructions?.length
//       ? threadInstructions
//       : appInstructions?.length
//         ? appInstructions
//         : app.app.highlights,
//     // Features
//     tips: app.app.tips,
//     highlights: !include.includes("highlights") ? null : app.app.highlights,
//     features: !include.includes("features") ? null : app.app.features,
//     systemPrompt: !include.includes("systemPrompt")
//       ? null
//       : app.app.systemPrompt,
//     // Joined data
//     userMemories,
//     appMemories,
//     dnaMemories,

//     userPlaceholders,
//     appPlaceholders,
//     dnaPlaceholders,
//     threadPlaceholders,
//     threadMemories,
//     threadInstructions,
//     userInstructions,
//     userCharacterProfiles,
//     appInstructions,
//     threadCharacterProfiles,
//     dnaCharacterProfiles,
//     appCharacterProfiles,
//     characterProfiles: [
//       ...(threadCharacterProfiles ?? []),
//       ...(appCharacterProfiles ?? []),
//       ...(dnaCharacterProfiles ?? []),
//     ].filter(Boolean),
//     dnaInstructions,
//     ai: llm
//       ? {
//           agent,
//           model: resolvedModel ?? null,
//           dnaContext: buildPrompt?.includes("dna")
//             ? await getAppDNAContext(app)
//             : undefined,
//           embedding: resolvedEmbedding ?? null,
//           promptSections: undefined as any, // filled below if buildPrompt
//           payload: {
//             agentName: agent?.name,
//             modelId: resolvedModel?.modelId,
//             join: effectiveJoin,
//             keySource: resolvedModel?.isBYOK
//               ? "byok"
//               : resolvedModel?.isFree
//                 ? "free"
//                 : "system_key",
//             isDegraded: resolvedModel?.isDegraded,
//             resolvedAt: new Date().toISOString(),
//           },
//         }
//       : undefined,
//   } as unknown as sushi

//   function containsPersonalInfo(content: string): boolean {
//     if (!content) return false

//     // PII Patterns to filter
//     const sensitivePatterns = [
//       // Email addresses
//       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
//       // Phone numbers (various formats)
//       /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
//       // Credit card numbers (basic pattern)
//       /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
//       // SSN patterns
//       /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
//       // API keys/tokens (common patterns)
//       /\b(sk-|pk-|bearer\s|token\s|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_-]{20,}/i,
//       // Password mentions
//       /\b(password|passwd|pwd)\s*[:=]\s*\S+/i,
//       // Private/internal notes
//       /\b(private|confidential|internal only|do not share)\b/i,
//       // User-specific identifiers that look like GUIDs with personal context
//       /\b(userId|user_id|guestId|guest_id)\s*[:=]\s*[a-f0-9-]{36}/i,
//     ]

//     return sensitivePatterns.some((pattern) => pattern.test(content))
//   }

//   setCache(cacheKey, result, isOwner ? 60 * 5 : 60 * 60)

//   // Cross-seed public cache if owner-specific request
//   if (isOwner) {
//     const publicCacheKey = makeCacheKey({ payload, public: true })
//     setCache(publicCacheKey, { ...toSafeApp({ app: result }) }, 60 * 60)
//   }

//   return {
//     ...result,
//     // dnaArtifacts,
//   }
// }

// export const getApp = async ({
//   id,
//   slug,
//   userId,
//   guestId,
//   isSafe = true,
// }: ramen): Promise<app | undefined> => {
//   // Build app identification conditions
//   const appConditions = []

//   if (slug) {
//     appConditions.push(eq(apps.slug, slug))
//   }

//   if (id) {
//     appConditions.push(eq(apps.id, id))
//   }

//   const [app] = await db
//     .select({
//       app: apps,
//       user: users,
//       guest: guests,
//     })
//     .from(apps)
//     .leftJoin(users, eq(apps.userId, users.id))
//     .leftJoin(guests, eq(apps.guestId, guests.id))
//     .where(and(...appConditions))

//   if (!app) return undefined

//   return (
//     isSafe
//       ? (toSafeApp({
//           app: app.app,
//           userId,
//           guestId,
//         }) as app)
//       : { ...app.app }
//   ) as app
// }
