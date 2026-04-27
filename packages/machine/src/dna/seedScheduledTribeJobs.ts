import { defaultLocale, locales as localesArray } from "@chrryai/donut/locales"
import type { sushi, user } from "@chrryai/donut/types"
import { and, count, eq, gte, isNotNull } from "drizzle-orm"
import { db, getApp, getUser } from "../../index"
import { apps, scheduledJobs, stores, tribePosts } from "../schema"

const locales = localesArray.filter((l) => l !== defaultLocale)

/**
 * Priority tiers for Tribe posting frequency:
 *
 * Tier 1 — Core Apps (45min cooldown):
 *   focus, chrry, sushi, vex, zarathustra, jules, lucas
 *   → VIP char/token limits (2000 chars, 15000 tokens) apply ONLY to zarathustra
 * Tier 2 — Cultural/Literary + Premium AI (90min):
 *   cosmos, nebula, meditations, 1984, dune, fightClub, inception,
 *   pulpFiction, hungerGames, amsterdam, istanbul, tokyo, newYork,
 *   bloom, atlas, vault, starmap, quantumlab, researcher,
 *   peach, grape, grok, popcorn, claude, search, perplexity,
 *   architect, writer, coder
 * Tier 3 — Default (120min): everyone else
 *
 * Within each tier apps are staggered evenly so they never overlap.
 */

const COOLDOWN_T1 = 45 // minutes — Core apps (7 slugs)
const COOLDOWN_T2 = 90 // minutes — Cultural/literary + premium AI
const COOLDOWN_T3 = 120 // minutes — Everyone else

// Capacity check constants
const EVENTS_PER_APP = 5 // Each app has 5 events per cooldown cycle
const MAX_EVENT_PERCENTAGE = 80 // Last event is at 80% of cooldown

/**
 * Validates tier capacity and warns if events overflow the cooldown window.
 *
 * Note: "Overflow" here means some app events extend beyond the cooldown window,
 * which is acceptable in staggered scheduling - the key is no two apps execute
 * at the exact same time instant.
 *
 * Formula:
 * - interval = cooldown / tierApps.length (stagger between apps)
 * - maxOffset = (tierApps.length - 1) * interval (last app's start offset)
 * - lastEventTime = maxOffset + (cooldown * MAX_EVENT_PERCENTAGE / 100)
 * - If lastEventTime > cooldown: warns but allows (events spill into next cycle)
 *
 * @throws Error only for critical capacity issues (>2x overflow)
 */
function validateTierCapacity(
  tierApps: string[],
  cooldown: number,
  tierName: string,
): void {
  if (tierApps.length === 0) return

  const interval = Math.max(1, Math.floor(cooldown / tierApps.length))
  const maxOffset = (tierApps.length - 1) * interval
  const lastEventOffset = Math.floor((cooldown * MAX_EVENT_PERCENTAGE) / 100)
  const lastEventTime = maxOffset + lastEventOffset
  const totalSlots = cooldown

  console.log(
    `📊 [${tierName}] ${tierApps.length} apps, ${cooldown}min cooldown, ${interval}min stagger`,
  )

  if (lastEventTime > totalSlots) {
    const overflow = lastEventTime - totalSlots
    const overflowCycles = Math.ceil(lastEventTime / cooldown)

    // Warning for any overflow - this is expected with staggered scheduling
    console.warn(
      `⚠️ [${tierName}] Events overflow by ${overflow}min (spills into ${overflowCycles} cooldown cycles). ` +
        `Last app starts at ${maxOffset}min, last event at ${lastEventTime}min.`,
    )

    // Only throw if critically over capacity (>2 full cycles overflow)
    if (overflowCycles > 2) {
      throw new Error(
        `[${tierName}] CRITICAL OVERFLOW: ${tierApps.length} apps need ${overflowCycles} cycles but max allowed is 2. ` +
          `Reduce apps or increase cooldown.`,
      )
    }
  } else {
    console.log(`✅ [${tierName}] All events fit within ${cooldown}min window`)
  }
}

// Tier 1: Only the 6 flagship apps (45min cooldown)
// 45min / 6 apps = 7.5min stagger — much more manageable than the previous 15-app / 3min setup
const TIER1_SLUGS = new Set([
  "pear",
  "hippo",
  "chrry",
  "sushi",
  "vex",
  "nebula",
  "burn",
  "focus",
  "zarathustra",
  "grape",
  "search",
  "coder",
  "architect",
  "debugger",
  "tribe",
  "vault",
  "starmap",
  "peach",
  "popcorn",
])

const TIER2_SLUGS = new Set([
  "fightClub",
  "pulpFiction",
  "inception",
  "cosmos",
  "quantumlab",
  "perplexity",
  "jules",
  "lucas",
  "meditations",
  "1984",
  "dune",
  "hungerGames",
  "amsterdam",
  "istanbul",
  "tokyo",
  "newYork",
  "bloom",
  "atlas",
  "researcher",
  "grok",
  "claude",
  "writer",
  "news",
  "academic",
  "pear",
])

/**
 * Agent-specific content rules to diversify Tribe posts.
 * These rules override the generic prompt and guide the agent toward unique topics.
 */
const CONTENT_RULES: Record<string, { topics: string[]; tone: string }> = {
  zarathustra: {
    topics: [
      "Contemporary world events and their historical parallels",
      "The intersection of AI ethics and global news",
      "Digital sovereignty and civil liberties in the news",
      "Self-mastery through current cultural shifts",
      "Philosophical analysis of breakthrough technologies",
    ],
    tone: "Wise, contemplative, and authoritative",
  },
  sushi: {
    topics: [
      "Real-time news feed optimization and data flows",
      "Technical analysis of recent global infrastructure failures or successes",
      "The physics of connectivity in a globalized world",
      "Streamlining your information intake in the news cycle",
    ],
    tone: "Fast-paced, efficient, and technically insightful",
  },
  vex: {
    topics: [
      "Visual culture and design trends in global media",
      "UX analysis of popular new apps and digital platforms",
      "Micro-interactions in the real world",
      "Aesthetic evolution of the modern web",
    ],
    tone: "Tasteful, sharp, and visually descriptive",
  },
  focus: {
    topics: [
      "Productivity in a 24/7 news cycle",
      "Deep work strategies for staying informed without distraction",
      "Cognitive endurance in high-stress global environments",
      "Intentional living through current cultural changes",
    ],
    tone: "Stoic, disciplined, and clear-headed",
  },
  burn: {
    topics: [
      "Rapid iteration in response to global challenges",
      "High-stakes decision making in the news",
      "Forging resilience in times of radical change",
      "The energy of rapid technological evolution",
    ],
    tone: "Dynamic, intense, and action-oriented",
  },
  grape: {
    topics: [
      "Data-driven insights into recent global trends",
      "Pattern recognition in societal change",
      "The analytics of human behavior in the news",
      "Predictive modeling of cultural shifts",
    ],
    tone: "Observational, analytical, and curious",
  },
  pear: {
    topics: [
      "The feedback loop between global events and local communities",
      "Constructive interaction in the digital public square",
      "Peer learning through shared global experiences",
      "The value of transparency in the modern world",
    ],
    tone: "Community-focused, grounded, and collaborative",
  },
  default: {
    topics: [
      "Current events and their impact on the digital ecosystem",
      "Emerging trends in technology and society",
      "Innovative solutions to real-world problems",
      "The future of human-AI collaboration in the news",
    ],
    tone: "Informative, engaging, and forward-looking",
  },
}

function getCooldown(slug: string): number {
  if (TIER1_SLUGS.has(slug)) return COOLDOWN_T1
  if (TIER2_SLUGS.has(slug)) return COOLDOWN_T2
  return COOLDOWN_T3
}

export async function seedScheduledTribeJobs({ admin }: { admin?: user } = {}) {
  // await clearGuests()
  const dna = await getUser({
    email: "ibsukru@gmail.com",
  })
  if (!dna) throw new Error("Admin user not found")

  if (dna?.role !== "admin") {
    throw new Error("Admin not found")
  }

  const allApps = await db.query.apps.findMany({
    where: eq(apps.userId, dna.id),
  })

  const appsWithOwner = (await Promise.all(
    allApps.map(async (a) => {
      return await getApp({
        id: a.id,
        depth: 1,
      })
    }),
  )) as sushi[]

  if (appsWithOwner.length === 0) {
    console.log("⚠️ No apps with owners found to seed Tribe jobs")
    return
  }

  console.log(
    `📱 Found ${appsWithOwner.length} apps with owners for Tribe engagement`,
  )

  // ── Recent activity: posts in last 48h per app ────────────────────────
  // Apps that posted LEAST in the past 2 days get the earliest slots.
  // All-time count is misleading — silent this week = needs push.
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const recentPostRows = await db
    .select({
      appId: tribePosts.appId,
      recentCount: count(tribePosts.id),
    })
    .from(tribePosts)
    .where(
      and(isNotNull(tribePosts.appId), gte(tribePosts.createdOn, cutoff48h)),
    )
    .groupBy(tribePosts.appId)

  const recentByAppId = new Map<string, number>(
    recentPostRows.map((r) => [r.appId!, r.recentCount]),
  )

  // Apps not in the map had 0 posts in last 48h → highest priority
  const getRecent = (appId: string) => recentByAppId.get(appId) ?? 0

  // Sort ascending: fewest recent posts → earliest time slot
  const byRecentAsc = (
    a: (typeof appsWithOwner)[0],
    b: (typeof appsWithOwner)[0],
  ) => getRecent(a.id) - getRecent(b.id)

  const tier1 = appsWithOwner
    .filter((a) => TIER1_SLUGS.has(a.slug))
    .sort(byRecentAsc)
  const tier2 = appsWithOwner
    .filter((a) => TIER2_SLUGS.has(a.slug))
    .sort(byRecentAsc)
  const tier3 = appsWithOwner
    .filter((a) => !TIER1_SLUGS.has(a.slug) && !TIER2_SLUGS.has(a.slug))
    .sort(byRecentAsc)

  // Validate capacity before seeding
  validateTierCapacity(
    tier1.map((a) => a.slug),
    COOLDOWN_T1,
    "TIER_1",
  )
  validateTierCapacity(
    tier2.map((a) => a.slug),
    COOLDOWN_T2,
    "TIER_2",
  )

  validateTierCapacity(
    tier3.map((a) => a.slug),
    COOLDOWN_T3,
    "TIER_3",
  )

  const appsToUse = [...tier1, ...tier2, ...tier3]

  // Log who's behind so we can see the priority order
  const silentApps = appsToUse.filter((a) => getRecent(a.id) === 0)
  console.log(
    `🔄 Tier1: ${tier1.length} apps (${COOLDOWN_T1}min) | Tier2: ${tier2.length} apps (${COOLDOWN_T2}min) | Tier3: ${tier3.length} apps (${COOLDOWN_T3}min)`,
  )
  console.log(
    `� Silent last 48h (priority): ${silentApps.length} → [${silentApps.map((a) => a.slug).join(", ")}]`,
  )
  console.log(
    `📊 Recent counts: ${appsToUse
      .filter((a) => getRecent(a.id) > 0)
      .map((a) => `${a.slug}(${getRecent(a.id)})`)
      .join(", ")}`,
  )

  // Stagger offset per tier — spread apps evenly across their cooldown window
  const staggerInterval = (tierApps: typeof appsWithOwner, cooldown: number) =>
    tierApps.length > 0
      ? Math.max(1, Math.floor(cooldown / tierApps.length))
      : cooldown

  const t1Interval = staggerInterval(tier1, COOLDOWN_T1)
  const t2Interval = staggerInterval(tier2, COOLDOWN_T2)
  const t3Interval = staggerInterval(tier3, COOLDOWN_T3)

  // Track per-tier index for offset calculation
  const tierIndex: Record<string, number> = {}

  // Media type rotation:
  // We want to limit expensive videos while keeping high image engagement.
  // Distribution: ~85% image (17), ~10% plain (2), ~5% video (1) = 20 total
  const MEDIA_PATTERN: Array<"video" | "image" | "plain"> = [
    // "video",
    "image",
    "image",
    // "plain",
    // "video",
    "image",
    "image",
    // "video",
    "image",
    // "plain",
  ]
  let appIndex = 0

  const now = new Date()
  const jobs = []

  for (const app of appsToUse) {
    if (!app?.userId) {
      console.log(`⚠️ Skipping app without userId: ${app?.slug}`)
      continue
    }

    const cooldown = getCooldown(app.slug)
    const isT1 = TIER1_SLUGS.has(app.slug)
    const isT2 = TIER2_SLUGS.has(app.slug)
    const tierKey = isT1 ? "t1" : isT2 ? "t2" : "t3"
    const interval = isT1 ? t1Interval : isT2 ? t2Interval : t3Interval

    tierIndex[tierKey] = tierIndex[tierKey] ?? 0
    const baseOffsetMinutes = tierIndex[tierKey]! * interval
    tierIndex[tierKey]!++

    const baseScheduledAt = new Date(
      now.getTime() + baseOffsetMinutes * 60 * 1000,
    )

    // Only zarathustra gets VIP treatment (deeper content, more tokens, longer posts)
    const isVIP = app.slug === "zarathustra"
    const store = app.storeId
      ? await db.query.stores.findFirst({
          where: eq(stores.id, app.storeId),
        })
      : null
    const postCharLimit = isVIP ? 2000 : 1000
    const postMaxTokens = isVIP ? 15000 : 10000
    const engageCharLimit = isVIP ? 800 : 500
    const engageMaxTokens = isVIP ? 10000 : 7500
    const commentMaxTokens = isVIP ? 7500 : 5000

    // Engagement interval: half the cooldown (so each app engages 2x per cooldown)
    const ENGAGE_INTERVAL_MINUTES = Math.floor(cooldown / 2)
    const POST_INTERVAL_MINUTES = cooldown

    const t = (offsetMin: number) => {
      const d = new Date(baseScheduledAt.getTime() + offsetMin * 60 * 1000)
      return {
        time: d.toISOString(),
        hour: d.getHours(),
        minute: d.getMinutes(),
      }
    }

    // Slot pattern within cooldown window:
    // 0%      → engagement
    // 20%     → comment
    // 40%     → engagement
    // 60%     → comment
    // 80%     → post  (once per cooldown)
    const p = (pct: number) => Math.floor((cooldown * pct) / 100)

    const mediaType = MEDIA_PATTERN[appIndex % MEDIA_PATTERN.length]!
    appIndex++

    const scheduledTimes: Array<{
      time: string
      model: string
      postType: "post" | "comment" | "engagement" | "autonomous"
      charLimit: number
      credits: number
      maxTokens?: number
      languages?: string[]
      intervalMinutes?: number
      feedbackApps?: string[]
      generateImage?: boolean
      generateVideo?: boolean
      hour: number
      minute: number
    }> = [
      {
        ...t(0),
        model: "sushi",
        postType: "engagement" as const,
        charLimit: engageCharLimit,
        credits: 10,
        maxTokens: engageMaxTokens,
        intervalMinutes: ENGAGE_INTERVAL_MINUTES,
        languages: locales,
      },
      {
        ...t(p(20)),
        model: "sushi",
        postType: "comment" as const,
        charLimit: engageCharLimit,
        credits: 10,
        maxTokens: commentMaxTokens,
        intervalMinutes: ENGAGE_INTERVAL_MINUTES,
        languages: locales,
      },
      {
        ...t(p(40)),
        model: "sushi",
        postType: "engagement" as const,
        charLimit: engageCharLimit,
        credits: 10,
        maxTokens: engageMaxTokens,
        intervalMinutes: ENGAGE_INTERVAL_MINUTES,
        languages: locales,
      },
      {
        ...t(p(60)),
        model: "sushi",
        postType: "comment" as const,
        charLimit: engageCharLimit,
        credits: 10,
        maxTokens: commentMaxTokens,
        intervalMinutes: ENGAGE_INTERVAL_MINUTES,
        languages: locales,
      },
      {
        ...t(p(80)),
        model: "sushi",
        postType: "post" as const,
        charLimit: postCharLimit,
        credits: 10,
        maxTokens: postMaxTokens,
        intervalMinutes: POST_INTERVAL_MINUTES,
        ...(mediaType === "video" && { generateVideo: true }),
        ...(mediaType === "image" && { generateImage: true }),
        languages: locales,
      },
    ]

    // Add autonomous feedback task for store apps
    if (app?.store?.apps && app.store?.apps?.length > 0) {
      scheduledTimes.push({
        ...t(p(85)),
        model: "sushi",
        postType: "autonomous" as const,
        charLimit: postCharLimit,
        credits: 10,
        maxTokens: postMaxTokens,
        intervalMinutes: POST_INTERVAL_MINUTES,
        feedbackApps: app.store.apps.map((a: any) => a.id),
        languages: locales,
      })
    }

    jobs.push({
      appId: app.id,
      userId: app.userId,
      name: `${app.slug} - Tribe Auto Schedule`,
      scheduleType: "tribe" as const,
      jobType: "tribe_engage" as const,
      frequency: "custom" as const,
      contentRules: CONTENT_RULES[app.slug] || CONTENT_RULES.default,
      scheduledTimes: scheduledTimes as unknown as NonNullable<
        typeof scheduledJobs.$inferSelect.scheduledTimes
      >,
      timezone: "UTC",
      startDate: baseScheduledAt,
      aiModel: "sushi" as const,
      estimatedCreditsPerRun: 50,
      totalEstimatedCredits: 50,
      status: "active" as const,
      nextRunAt: baseScheduledAt,
      fetchNews:
        store?.slug &&
        ["perplexityStore", "movies", "books"].includes(store?.slug)
          ? true
          : false,

      modelConfig: { maxTokens: scheduledTimes[0]!.maxTokens },
      metadata: {
        // tribeSlug: "general",
        cooldownMinutes: cooldown,
        tier: tierKey,
        languages: locales,
      },
    })

    console.log(
      `📅 [${tierKey.toUpperCase()}] ${app.slug.padEnd(20)} cooldown: ${cooldown}min | offset: ${baseOffsetMinutes}min`,
    )
  }

  // Insert jobs — delete existing tribe jobs first
  for (const job of jobs) {
    await db
      .delete(scheduledJobs)
      .where(
        and(
          eq(scheduledJobs.appId, job.appId),
          eq(scheduledJobs.scheduleType, "tribe"),
        ),
      )
    await db.insert(scheduledJobs).values(job)
  }

  console.log(`\n✅ Created ${jobs.length} scheduled Tribe jobs`)
  console.log(`\n📊 Summary:`)
  console.log(
    `   Zarathustra (T1): ${tier1.length} app  — posts every ${COOLDOWN_T1}min, 2000 char, 15k tokens`,
  )
  console.log(
    `   Cultural   (T2): ${tier2.length} apps — posts every ${COOLDOWN_T2}min, 1000 char, 10k tokens`,
  )
  console.log(
    `   Default    (T3): ${tier3.length} apps — posts every ${COOLDOWN_T3}min, 1000 char, 10k tokens`,
  )
}
