/**
 * INFINITE HUMAN SYSTEM: Agent Action Tracking & XP Management
 *
 * This module provides functions to track agent actions, award XP,
 * and manage agent progression.
 */

import { eq } from "drizzle-orm"
import { db } from "../../index"
import { agentActions, agents, skills } from "../agent-schema"
import {
  calculateLevel,
  calculateTrustScore,
  calculateXP,
  getSkillsForLevel,
} from "../agent-xp"

/**
 * Record an agent action and award XP
 */
export async function recordAgentAction(params: {
  agentSlug: string
  type:
    | "BUG_FIX"
    | "FEATURE"
    | "DEPLOY"
    | "TEST_PASS"
    | "TEST_FAIL"
    | "CODE_REVIEW"
    | "EMAIL_SENT"
    | "JOB_FOUND"
    | "SPONSORSHIP_WON"
  success: boolean
  metadata?: {
    pr?: string
    commit?: string
    files?: string[]
    testName?: string
    emailTo?: string
    jobUrl?: string
    sponsorAmount?: number
    errorMessage?: string
    testsPass?: boolean
    zeroDowntime?: boolean
    emailResponse?: boolean
    jobHired?: boolean
  }
}) {
  const { agentSlug, type, success, metadata = {} } = params

  // Get agent
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1)

  if (!agent) {
    throw new Error(`Agent not found: ${agentSlug}`)
  }

  // Calculate XP
  const xpEarned = calculateXP({ type, success, metadata })

  // Update agent stats
  const updates: any = {
    xp: agent.xp + xpEarned,
    tasksCompleted: agent.tasksCompleted + 1,
    updatedOn: new Date(),
    lastActiveOn: new Date(),
  }

  // Update specific stats based on action type
  if (type === "BUG_FIX" && success) {
    updates.bugsFixed = agent.bugsFixed + 1
  } else if (type === "FEATURE" && success) {
    updates.featuresBuilt = agent.featuresBuilt + 1
  } else if (type === "TEST_PASS") {
    updates.testsWritten = agent.testsWritten + 1
  } else if (type === "DEPLOY" && success) {
    updates.deploysSucceeded = agent.deploysSucceeded + 1
  } else if (type === "DEPLOY" && !success) {
    updates.deploysFailed = agent.deploysFailed + 1
  }

  // Calculate new level
  const oldLevel = agent.level
  const newLevel = calculateLevel(updates.xp)
  updates.level = newLevel

  // Calculate new trust score
  updates.trustScore = calculateTrustScore({
    tasksCompleted: updates.tasksCompleted,
    deploysFailed: updates.deploysFailed || agent.deploysFailed,
    level: newLevel,
    xp: updates.xp,
  })

  // Update agent
  const [updatedAgent] = await db
    .update(agents)
    .set(updates)
    .where(eq(agents.id, agent.id))
    .returning()

  // Record action
  await db.insert(agentActions).values({
    agentId: agent.id,
    type,
    xpEarned,
    success,
    metadata,
  })

  // Check for level up and unlock skills
  if (newLevel > oldLevel) {
    await handleLevelUp(agent.id, oldLevel, newLevel)
  }

  return {
    agent: updatedAgent,
    xpEarned,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  }
}

/**
 * Handle level up - unlock new skills
 */
async function handleLevelUp(
  agentId: string,
  oldLevel: number,
  newLevel: number,
) {
  // Unlock skills for all levels between old and new
  for (let level = oldLevel + 1; level <= newLevel; level++) {
    const skillsToUnlock = getSkillsForLevel(level)

    for (const skill of skillsToUnlock) {
      await db.insert(skills).values({
        agentId,
        name: skill.name,
        slug: skill.name.toLowerCase().replace(/\s+/g, "-"),
        description: skill.description,
        requiredLevel: level,
        category: skill.category,
      })
    }
  }

  // TODO: Send notification to user about level up
  console.log(`🎉 Agent leveled up! ${oldLevel} → ${newLevel}`)
}

/**
 * Get agent with all stats
 */
export async function getAgent(agentSlug: string) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1)

  if (!agent) {
    return null
  }

  // Get skills
  const agentSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.agentId, agent.id))

  // Get recent actions
  const recentActions = await db
    .select()
    .from(agentActions)
    .where(eq(agentActions.agentId, agent.id))
    .orderBy(agentActions.createdOn)
    .limit(10)

  return {
    ...agent,
    skills: agentSkills,
    recentActions,
  }
}

/**
 * Create a new agent
 */
export async function createAgent(params: {
  name: string
  slug: string
  displayName: string
  description?: string
  avatar?: string
}) {
  const [agent] = await db
    .insert(agents)
    .values({
      ...params,
      level: 1,
      xp: 0,
      tasksCompleted: 0,
      bugsFixed: 0,
      featuresBuilt: 0,
      testsWritten: 0,
      deploysSucceeded: 0,
      deploysFailed: 0,
      linesOfCode: 0,
      trustScore: 0,
      characterTraits: [],
      preferences: {},
    })
    .returning()

  if (!agent) {
    throw new Error("Failed to create agent")
  }

  // Unlock Level 1 skills
  const level1Skills = getSkillsForLevel(1)
  for (const skill of level1Skills) {
    await db.insert(skills).values({
      agentId: agent.id,
      name: skill.name,
      slug: skill.name.toLowerCase().replace(/\s+/g, "-"),
      description: skill.description,
      requiredLevel: 1,
      category: skill.category,
    })
  }

  return agent
}

/**
 * Get all agents with their stats
 */
export async function getAllAgents() {
  return await db.select().from(agents).orderBy(agents.level)
}
