import { randomInt } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { db } from "../../index"

import {
  aiAgents,
  apps,
  creditUsages,
  feedbackTransactions,
  pearFeedback,
  users,
} from "../schema"

// Helper for random picking
function pick<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("Cannot pick from empty array")
  return arr[randomInt(arr.length)]!
}

function getRandomInt(min: number, max: number): number {
  return randomInt(min, max + 1)
}

// ─── Feedback pool ─────────────────────────────────────────────────────────────
const FEEDBACK_POOL: Array<{
  content: string
  feedbackType:
    | "complaint"
    | "suggestion"
    | "praise"
    | "bug"
    | "feature_request"
  category:
    | "ux"
    | "performance"
    | "feature"
    | "bug"
    | "keyboard_shortcuts"
    | "ui_design"
    | "analytics"
    | "other"
  sentimentScore: number
  specificityScore: number
  actionabilityScore: number
  credits: number
  emotionalTags?: string[]
  firstImpression?: boolean
}> = [
  // 5 credits
  {
    content:
      "I really like the clean design and the color scheme feels modern.",
    feedbackType: "praise",
    category: "ui_design",
    sentimentScore: 0.2,
    specificityScore: 0.5,
    actionabilityScore: 0.4,
    credits: 5,
  },
  {
    content: "The app feels fast and responsive on my machine.",
    feedbackType: "praise",
    category: "performance",
    sentimentScore: 0.2,
    specificityScore: 0.5,
    actionabilityScore: 0.4,
    credits: 5,
  },
  {
    content: "Love the dark mode option — easy on the eyes at night.",
    feedbackType: "praise",
    category: "ui_design",
    sentimentScore: 0.2,
    specificityScore: 0.5,
    actionabilityScore: 0.4,
    credits: 5,
    emotionalTags: ["comfortable"],
  },
  {
    content: "Navigation feels intuitive. Everything is where I expect it.",
    feedbackType: "praise",
    category: "ux",
    sentimentScore: 0.2,
    specificityScore: 0.5,
    actionabilityScore: 0.4,
    credits: 5,
  },

  // 10 credits
  {
    content:
      "The fire icon in the top menu is confusing — I thought it was a delete button. A tooltip would help.",
    feedbackType: "complaint",
    category: "ux",
    sentimentScore: 0.5,
    specificityScore: 0.7,
    actionabilityScore: 0.7,
    credits: 10,
  },
  {
    content:
      "The font size in the settings panel is too small on mobile. Hard to read without zooming in.",
    feedbackType: "complaint",
    category: "ui_design",
    sentimentScore: 0.5,
    specificityScore: 0.7,
    actionabilityScore: 0.7,
    credits: 10,
  },
  {
    content:
      "The loading spinner has no timeout — if network is slow it just spins forever with no message.",
    feedbackType: "bug",
    category: "performance",
    sentimentScore: 0.5,
    specificityScore: 0.7,
    actionabilityScore: 0.7,
    credits: 10,
  },
  {
    content:
      "Empty state screens show nothing. Even a short 'No items yet' message would improve clarity.",
    feedbackType: "complaint",
    category: "ui_design",
    sentimentScore: 0.5,
    specificityScore: 0.7,
    actionabilityScore: 0.7,
    credits: 10,
  },

  // 15 credits
  {
    content:
      "Adding keyboard shortcuts (like Cmd+K for search) would speed up workflow for power users.",
    feedbackType: "suggestion",
    category: "keyboard_shortcuts",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 15,
  },
  {
    content:
      "You should add bulk actions to the list view. Deleting items one by one is very tedious.",
    feedbackType: "feature_request",
    category: "ux",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 15,
  },
  {
    content:
      "The export to CSV is missing date filters. I'd like to export only the last 30 days.",
    feedbackType: "feature_request",
    category: "feature",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 15,
  },
  {
    content:
      "Please add a 'copy to clipboard' button on code blocks. I find myself manually selecting text every time.",
    feedbackType: "suggestion",
    category: "ux",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 15,
  },

  // 20 credits
  {
    content:
      "The checkout flow has 5 steps but 3 and 4 could be combined. Users drop off heavily at step 3 in typical patterns.",
    feedbackType: "suggestion",
    category: "ux",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 20,
  },
  {
    content:
      "Camera permission fires immediately on app open before context. Showing it only when first needed would increase opt-in.",
    feedbackType: "suggestion",
    category: "ux",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 20,
  },
  {
    content:
      "Search uses full-text exact matching. Adding fuzzy search (Fuse.js) would handle typos and improve usability.",
    feedbackType: "feature_request",
    category: "feature",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 20,
  },
  {
    content:
      "Mobile nav has 6 bottom tabs — too many. Settings and Help could move into a profile menu.",
    feedbackType: "suggestion",
    category: "ui_design",
    sentimentScore: 0.8,
    specificityScore: 0.9,
    actionabilityScore: 0.9,
    credits: 20,
  },
]

export async function seedPearFeedback() {
  console.log("🍐 Seeding Pear feedback data (Flooding the desert)...")

  try {
    const allApps = await db
      .select({ id: apps.id, slug: apps.slug, userId: apps.userId })
      .from(apps)
      .limit(30)
    const allUsers = await db.select({ id: users.id }).from(users).limit(100)
    const agents = await db.select({ id: aiAgents.id }).from(aiAgents).limit(5)

    if (allApps.length === 0 || allUsers.length === 0 || agents.length === 0) {
      console.log(
        "⚠️ Core tables (Apps/Users/Agents) missing. Run seed.ts first.",
      )
      return
    }

    let inserted = 0
    const TOTAL = 500

    for (let i = 0; i < TOTAL; i++) {
      const app = pick(allApps)
      const feedbackUser = pick(allUsers)
      const template = pick(FEEDBACK_POOL)
      const agent = pick(agents)

      // Time randomization (last 60 days)
      const daysBack = randomInt(60)
      const hoursBack = randomInt(24)
      const minutesBack = randomInt(60)
      const createdOn = new Date(
        Date.now() -
          (daysBack * 24 * 60 + hoursBack * 60 + minutesBack) * 60 * 1000,
      )

      // Wrap all dependent writes in a single transaction
      await db.transaction(async (tx) => {
        // 1. Insert Pear Feedback
        const [feedback] = await tx
          .insert(pearFeedback)
          .values({
            appId: app.id,
            userId: feedbackUser.id,
            content: template.content,
            feedbackType: template.feedbackType,
            category: template.category,
            sentimentScore: template.sentimentScore,
            specificityScore: template.specificityScore,
            actionabilityScore: template.actionabilityScore,
            emotionalTags: template.emotionalTags ?? undefined,
            firstImpression: template.firstImpression ?? randomInt(10) > 7,
            status: pick(["reviewed", "in_progress", "resolved"]),
            createdOn,
            updatedOn: createdOn,
          })
          .returning()

        // 2. Insert Credit Usage (Reward for User)
        const commission = Math.floor(template.credits * 0.1)
        const userReward = template.credits - commission

        await tx.insert(creditUsages).values({
          userId: feedbackUser.id,
          appId: app.id,
          agentId: agent.id,
          creditCost: String(-userReward),
          messageType: "pear_feedback_reward",
          metadata: {
            appId: app.id,
            credits: userReward,
            commission,
          },
        })

        // 3. Insert Feedback Transaction (Cross-reference for analytics)
        await tx.insert(feedbackTransactions).values({
          appId: app.id,
          appOwnerId: app.userId || feedbackUser.id,
          feedbackUserId: feedbackUser.id,
          amount: userReward,
          commission: commission,
          createdOn,
        })

        // 4. Update User Profile Counter
        await tx
          .update(users)
          .set({ pearFeedbackCount: sql`${users.pearFeedbackCount} + 1` })
          .where(eq(users.id, feedbackUser.id))
      })

      inserted++
      if (inserted % 100 === 0) {
        console.log(`🍐 [${inserted}/${TOTAL}] Still pumping water...`)
      }
    }

    console.log(
      `\n✅ Mission accomplished. ${inserted} feedback entries seeded.`,
    )
  } catch (error) {
    console.error("❌ Error seeding Pear feedback:", error)
    throw error
  }
}
