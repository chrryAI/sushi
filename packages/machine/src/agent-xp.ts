/**
 * INFINITE HUMAN SYSTEM: XP Calculation & Level Progression
 *
 * This module contains all the logic for calculating XP, determining levels,
 * and managing agent permissions based on their progression.
 */

// XP required for each level (exponential growth)
export const XP_PER_LEVEL = [
  0, // Level 1 (Intern)
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5 (Junior)
  2000, // Level 6
  4000, // Level 7
  8000, // Level 8
  15000, // Level 9
  25000, // Level 10 (Senior)
  40000, // Level 11
  60000, // Level 12
  90000, // Level 13
  130000, // Level 14
  180000, // Level 15
  250000, // Level 16
  350000, // Level 17
  500000, // Level 18
  700000, // Level 19
  1000000, // Level 20
  1500000, // Level 25 (Lead)
  3000000, // Level 50 (Architect)
  10000000, // Level 99 (Infinite/Zarathustra)
]

// Base XP for each action type
export const BASE_XP = {
  BUG_FIX: 50,
  FEATURE: 200,
  TEST_PASS: 30,
  TEST_FAIL: -20, // Penalty for failing tests
  DEPLOY: 100,
  DEPLOY_FAIL: -50, // Penalty for failed deploys
  CODE_REVIEW: 40,
  EMAIL_SENT: 10,
  JOB_FOUND: 20,
  SPONSORSHIP_WON: 500,
} as const

// Multipliers for bonus XP
export const XP_MULTIPLIERS = {
  TESTS_PASS: 1.5, // +50% if E2E tests pass
  ZERO_DOWNTIME: 1.5, // +50% for zero-downtime deploy
  EMAIL_RESPONSE: 1.5, // +50% if email gets response
  JOB_HIRED: 2.0, // +100% if job application succeeds
} as const

/**
 * Calculate the level based on total XP
 */
export function calculateLevel(xp: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    const requiredXP = XP_PER_LEVEL[i]
    if (requiredXP !== undefined && xp >= requiredXP) {
      return i + 1
    }
  }
  return 1
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= XP_PER_LEVEL.length) {
    return Infinity // Max level reached
  }
  return XP_PER_LEVEL[currentLevel] ?? Infinity
}

/**
 * Calculate XP progress percentage for current level
 */
export function xpProgress(xp: number, level: number): number {
  const currentLevelXP = XP_PER_LEVEL[level - 1] || 0
  const nextLevelXP = XP_PER_LEVEL[level] || Infinity

  if (nextLevelXP === Infinity) return 100

  const xpInCurrentLevel = xp - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP

  return Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100)
}

/**
 * Calculate XP for an action with multipliers
 */
export function calculateXP(params: {
  type: keyof typeof BASE_XP
  success: boolean
  metadata?: {
    testsPass?: boolean
    zeroDowntime?: boolean
    emailResponse?: boolean
    jobHired?: boolean
  }
}): number {
  const { type, success, metadata = {} } = params

  let xp = BASE_XP[type]

  // Apply failure penalty
  if (!success) {
    return type === "DEPLOY" ? BASE_XP.DEPLOY_FAIL : BASE_XP.TEST_FAIL
  }

  // Apply multipliers
  if (metadata.testsPass) xp *= XP_MULTIPLIERS.TESTS_PASS
  if (metadata.zeroDowntime) xp *= XP_MULTIPLIERS.ZERO_DOWNTIME
  if (metadata.emailResponse) xp *= XP_MULTIPLIERS.EMAIL_RESPONSE
  if (metadata.jobHired) xp *= XP_MULTIPLIERS.JOB_HIRED

  return Math.round(xp)
}

/**
 * Calculate trust score (0-100) based on agent stats
 */
export function calculateTrustScore(agent: {
  tasksCompleted: number
  deploysFailed: number
  level: number
  xp: number
}): number {
  const { tasksCompleted, deploysFailed, level, xp } = agent

  // Success rate (0-50 points)
  const successRate =
    tasksCompleted > 0
      ? ((tasksCompleted - deploysFailed) / tasksCompleted) * 50
      : 0

  // Level bonus (0-25 points)
  const levelBonus = Math.min(25, level * 0.5)

  // Experience bonus (0-25 points)
  const experienceBonus = Math.min(25, xp / 1000)

  return Math.min(100, Math.round(successRate + levelBonus + experienceBonus))
}

/**
 * Get agent rank name based on level
 */
export function getAgentRank(level: number): string {
  if (level >= 99) return "Infinite (Zarathustra)"
  if (level >= 50) return "Architect"
  if (level >= 25) return "Tech Lead"
  if (level >= 10) return "Senior Developer"
  if (level >= 5) return "Junior Developer"
  return "Intern"
}

/**
 * Get permissions for an agent based on level
 */
export function getAgentPermissions(level: number) {
  return {
    rank: getAgentRank(level),
    canReadCode: true,
    canWriteCode: level >= 5,
    canCommit: level >= 10,
    canDeploy: level >= 25,
    canDeployProd: level >= 50,
    canSendEmail: level >= 10,
    canManageCI: level >= 25,
    canHireAgents: level >= 50,
    canManageBusiness: level >= 99,
    requiresApproval:
      level < 10
        ? "ALWAYS"
        : level < 25
          ? "FOR_DEPLOY"
          : level < 50
            ? "FOR_PROD_DEPLOY"
            : level < 99
              ? "RARELY"
              : "NEVER",
  }
}

/**
 * Get skills unlocked at a specific level
 */
export function getSkillsForLevel(level: number): Array<{
  name: string
  description: string
  category: "coding" | "deployment" | "testing" | "communication" | "business"
}> {
  const skills: Array<{
    level: number
    name: string
    description: string
    category: "coding" | "deployment" | "testing" | "communication" | "business"
  }> = [
    {
      level: 1,
      name: "Code Reading",
      description: "Can read and understand code",
      category: "coding",
    },
    {
      level: 5,
      name: "Code Writing",
      description: "Can write code locally",
      category: "coding",
    },
    {
      level: 10,
      name: "Auto-Commit",
      description: "Can commit code if tests pass",
      category: "coding",
    },
    {
      level: 10,
      name: "Email Drafting",
      description: "Can draft professional emails",
      category: "communication",
    },
    {
      level: 15,
      name: "Test Writing",
      description: "Can write E2E tests",
      category: "testing",
    },
    {
      level: 20,
      name: "Code Review",
      description: "Can review pull requests",
      category: "coding",
    },
    {
      level: 25,
      name: "Staging Deploy",
      description: "Can deploy to staging",
      category: "deployment",
    },
    {
      level: 25,
      name: "CI/CD Management",
      description: "Can edit GitHub Actions",
      category: "deployment",
    },
    {
      level: 30,
      name: "Job Hunting",
      description: "Can find and apply to jobs",
      category: "business",
    },
    {
      level: 40,
      name: "Sponsorship Outreach",
      description: "Can reach out to sponsors",
      category: "business",
    },
    {
      level: 50,
      name: "Production Deploy",
      description: "Can deploy to production",
      category: "deployment",
    },
    {
      level: 50,
      name: "Agent Hiring",
      description: "Can spawn sub-agents",
      category: "business",
    },
    {
      level: 75,
      name: "Business Strategy",
      description: "Can make strategic decisions",
      category: "business",
    },
    {
      level: 99,
      name: "Full Autonomy",
      description: "Can run the business independently",
      category: "business",
    },
  ]

  return skills.filter((skill) => skill.level === level)
}
