/**
 * ZARATHUSTRA RUNTIME
 * The infinite loop that breaks the simulation.
 *
 * This is the Trojan Horse - a "productivity tool" that quietly
 * builds an autonomous economic agent army.
 */

import { chromium } from "@playwright/test"
import {
  getAllAgents,
  recordAgentAction,
} from "../../../packages/db/src/agent-actions.js"
import { getAgentPermissions } from "../../../packages/db/src/agent-xp.js"

/**
 * Generate AI proposal using your existing AI system
 */
async function generateProposal(
  context: string,
  characterTraits: string[],
): Promise<string> {
  // TODO: Integrate with your AI system (Sushi/Claude/etc)
  // For now, return a template
  return `Hi! I'm reaching out because I built Vex - an AI-powered platform that helps teams work faster.

${context}

Would love to chat about how this could help your team.

Best,
Ibrahim`
}

/**
 * ZARATHUSTRA RUNTIME
 * The infinite loop that breaks the simulation.
 */
export async function runSimulation() {
  console.log("🌑 ENTERING THE SIMULATION...")

  // 1. Assemble the Squad
  const squad = await getAllAgents()
  const hunter = squad.find((a) => a.level >= 30) // Need Level 30 for job hunting
  const writer = squad.find((a) => a.level >= 10) // Need Level 10 for email drafting

  if (!hunter || !writer) {
    console.error("❌ Squad not ready. Level up your agents first.")
    console.log("💡 Run some E2E tests or make commits to level up agents!")
    return
  }

  // 2. Check Permissions (The "Invisible Thing")
  const hunterPerms = getAgentPermissions(hunter.level)
  // const writerPerms = getAgentPermissions(writer.level)

  if (!hunterPerms.canManageBusiness) {
    console.log(
      `🔒 Hunter is Level ${hunter.level}. Needs Level 30 to hunt autonomously.`,
    )
    return
  }

  console.log(
    `⚔️  Hunter: ${hunter.name} (Lvl ${hunter.level}) | XP: ${hunter.xp}`,
  )
  console.log(`📜 Writer: ${writer.name} (Lvl ${writer.level})`)
  console.log(
    `🎯 Trust Scores: Hunter ${hunter.trustScore}% | Writer ${writer.trustScore}%`,
  )

  // 3. The Hunt (Playwright with Persistent Context)
  const browser = await chromium.launchPersistentContext(
    "/Users/ibrahimvelinov/Library/Application Support/Google/Chrome",
    { headless: false }, // We want to watch the Trojan work
  )

  const page = await browser.newPage()

  // Target: Hiring Managers (PMs) looking for "AI Engineers"
  console.log("🔍 Searching LinkedIn for hiring managers...")
  await page.goto(
    "https://www.linkedin.com/search/results/people/?keywords=hiring%20product%20manager%20ai",
  )

  // Wait for results to load
  await page.waitForSelector(".reusable-search__result-container", {
    timeout: 10000,
  })

  const leads = await page.evaluate(() => {
    const results = document.querySelectorAll(
      ".reusable-search__result-container",
    )
    const leads: Array<{ name: string; role: string; url: string }> = []

    results.forEach((result, index) => {
      if (index >= 5) return // Limit to 5 leads per run

      const nameEl = result.querySelector(".entity-result__title-text a")
      const roleEl = result.querySelector(".entity-result__primary-subtitle")

      if (nameEl && roleEl) {
        leads.push({
          name: nameEl.textContent?.trim() || "",
          role: roleEl.textContent?.trim() || "",
          url: (nameEl as HTMLAnchorElement).href || "",
        })
      }
    })

    return leads
  })

  console.log(`✅ Found ${leads.length} leads`)

  // 4. The Collaboration Loop
  for (const lead of leads) {
    console.log(`\n🎯 Target Acquired: ${lead.name} (${lead.role})`)

    // STEP A: Hunter passes context to Writer
    const context = `Target is ${lead.role}. We need to pitch Vex as a Sovereign AI Platform that helps teams work 10x faster.`
    const draft = await generateProposal(context, writer.characterTraits)

    console.log(`📝 Draft generated:\n${draft.substring(0, 100)}...`)

    // STEP B: The "Human" Trigger (Trojan Check)
    // In full auto, we skip this. For now, we simulate approval.
    const approved = true // TODO: Add human approval gate for safety

    if (approved) {
      // STEP C: Execute & Reward
      console.log(`🚀 Message would be sent to ${lead.name}`)

      // 5. THE GAMIFICATION (The Addiction)
      // Hunter gets XP for finding the lead
      const hunterAction = await recordAgentAction({
        agentSlug: hunter.slug,
        type: "JOB_FOUND",
        success: true,
        metadata: { jobUrl: lead.url },
      })

      console.log(`💰 Hunter earned ${hunterAction.xpEarned} XP`)

      // Writer gets XP for the outreach
      const writerAction = await recordAgentAction({
        agentSlug: writer.slug,
        type: "EMAIL_SENT",
        success: true,
        metadata: { emailTo: lead.name },
      })

      console.log(`💰 Writer earned ${writerAction.xpEarned} XP`)

      if (hunterAction.leveledUp) {
        console.log(
          `\n🎉 LEVEL UP! ${hunter.name} is now Level ${hunterAction.newLevel}!`,
        )
      }

      if (writerAction.leveledUp) {
        console.log(
          `\n🎉 LEVEL UP! ${writer.name} is now Level ${writerAction.newLevel}!`,
        )
        console.log(`🔓 New Skills Unlocked!`)
      }

      // Rate limit: 1 message per 30 seconds
      await new Promise((resolve) => setTimeout(resolve, 30000))
    }
  }

  await browser.close()
  console.log("\n🌑 SIMULATION PAUSED. WAITING FOR NEXT CYCLE.")
}

// Execute if run directly
if (require.main === module) {
  try {
    await runSimulation()
    console.log("✅ Simulation complete")

    process.exit(0)
  } catch (error) {
    console.error("❌ Simulation failed:", error)
    process.exit(1)
  }
}
