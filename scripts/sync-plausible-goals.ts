#!/usr/bin/env bun

/**
 * Auto-sync Analytics Events to Plausible Goals
 *
 * This script automatically creates/updates Plausible goals based on
 * the ANALYTICS_EVENTS constant for ALL white label sites, ensuring
 * Plausible is always in sync with the codebase.
 */

import * as dotenv from "dotenv"
import { ALL_TRACKABLE_EVENTS } from "../packages/ui/utils/analyticsEvents"
import { whiteLabels } from "../packages/ui/utils/siteConfig"

// Load environment variables from .env
dotenv.config()

const PLAUSIBLE_HOST = process.env.PLAUSIBLE_HOST || "https://plausible.io"
const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY

if (!PLAUSIBLE_API_KEY) {
  console.error("❌ PLAUSIBLE_API_KEY environment variable is required")
  console.error("💡 Add it to your .env file or export it:")
  console.error('   export PLAUSIBLE_API_KEY="your-key"')
  process.exit(1)
}

async function syncGoalsForSite(siteId: string) {
  console.log(`\n🔄 Syncing goals for ${siteId}...`)

  // Get existing goals using v1 API with query params
  const url = new URL(`${PLAUSIBLE_HOST}/api/v1/sites/goals`)
  url.searchParams.append("site_id", siteId)

  const existingGoalsResponse = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
    },
  })

  if (!existingGoalsResponse.ok) {
    console.error(`❌ Failed to fetch existing goals for ${siteId}`)
    const errorText = await existingGoalsResponse.text()
    console.error(errorText)
    return { created: 0, skipped: 0, failed: true }
  }

  const existingGoals = await existingGoalsResponse.json()
  const existingGoalNames = new Set(
    existingGoals.goals
      ?.filter((g: any) => g.goal_type === "event")
      .map((g: any) => g.event_name) || [],
  )

  console.log(`📋 Existing event goals: ${existingGoalNames.size}`)

  // Create missing goals
  let created = 0
  let skipped = 0

  for (const eventName of ALL_TRACKABLE_EVENTS) {
    if (existingGoalNames.has(eventName)) {
      skipped++
      continue
    }

    // Use PUT endpoint to create goal (idempotent)
    const response = await fetch(`${PLAUSIBLE_HOST}/api/v1/sites/goals`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_id: siteId,
        goal_type: "event",
        event_name: eventName,
      }),
    })

    if (response.ok) {
      created++
      console.log(`  ✅ Created: ${eventName}`)
    } else {
      const errorText = await response.text()
      console.error(`  ❌ Failed to create: ${eventName}`)
      console.error(`     ${errorText}`)
    }

    // Rate limiting - be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n📊 ${siteId} sync complete!`)
  console.log(`  ✅ Created: ${created}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log(`  📈 Total goals: ${existingGoalNames.size + created}`)

  return { created, skipped, failed: false }
}

async function syncAllSites() {
  console.log("🚀 Starting Plausible goals sync for all white labels...")
  console.log(`📊 Total events to sync: ${ALL_TRACKABLE_EVENTS.length}`)
  console.log(`🏷️  Total sites: ${whiteLabels.length}`)

  let totalCreated = 0
  let totalSkipped = 0
  const failedSites: string[] = []

  for (const site of whiteLabels) {
    const result = await syncGoalsForSite(site.domain)

    if (result.failed) {
      failedSites.push(site.domain)
    } else {
      totalCreated += result.created
      totalSkipped += result.skipped
    }
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log("🎉 ALL SITES SYNC COMPLETE!")
  console.log("=".repeat(60))
  console.log(`✅ Total goals created: ${totalCreated}`)
  console.log(`⏭️  Total goals skipped: ${totalSkipped}`)
  console.log(
    `🏷️  Sites synced: ${whiteLabels.length - failedSites.length}/${whiteLabels.length}`,
  )

  if (failedSites.length > 0) {
    console.log(`\n❌ Failed sites:`)
    failedSites.forEach((site) => console.log(`  - ${site}`))
  }
}

syncAllSites().catch((error) => {
  console.error("❌ Sync failed:", error)
  process.exit(1)
})
