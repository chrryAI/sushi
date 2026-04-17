import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

// ============================================================================
// INFINITE HUMAN SYSTEM: Agent XP & Leveling
// ============================================================================
// This system allows AI agents to gain experience, level up, and earn
// permissions based on successful work - just like humans do.

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(), // "Sushi", "Atlas", "Claude"
    slug: text("slug").notNull().unique(),
    displayName: text("displayName").notNull(),

    // Progression System
    level: integer("level").default(1).notNull(),
    xp: integer("xp").default(0).notNull(),

    // The "Soul" - What makes them unique
    characterTraits: jsonb("characterTraits").$type<string[]>().default([]), // ["Cautious", "Detail-oriented", "Fast"]
    preferences: jsonb("preferences")
      .$type<{
        codeStyle?: "functional" | "oop" | "mixed"
        testFramework?: "playwright" | "jest" | "vitest"
        communicationStyle?: "concise" | "detailed" | "friendly"
      }>()
      .default({}),

    // The "Resume" - Proof of work
    tasksCompleted: integer("tasksCompleted").default(0).notNull(),
    bugsFixed: integer("bugsFixed").default(0).notNull(),
    featuresBuilt: integer("featuresBuilt").default(0).notNull(),
    testsWritten: integer("testsWritten").default(0).notNull(),
    deploysSucceeded: integer("deploysSucceeded").default(0).notNull(),
    deploysFailed: integer("deploysFailed").default(0).notNull(),
    linesOfCode: integer("linesOfCode").default(0).notNull(),

    // Trust Score (0-100) - calculated based on success rate
    trustScore: real("trustScore").default(0).notNull(),

    // Metadata
    description: text("description"),
    avatar: text("avatar"), // URL to agent avatar

    // Timestamps
    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedOn: timestamp("updatedOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActiveOn: timestamp("lastActiveOn", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    index("agent_slug_idx").on(table.slug),
    index("agent_level_idx").on(table.level),
  ],
)

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agentId")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),

  name: text("name").notNull(), // "Auto-Deploy", "Database Migration"
  slug: text("slug").notNull(),
  description: text("description"),
  requiredLevel: integer("requiredLevel").notNull(),

  // Skill metadata
  category: text("category", {
    enum: ["coding", "deployment", "testing", "communication", "business"],
  }).notNull(),

  unlockedOn: timestamp("unlockedOn", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const agentActions = pgTable(
  "agentActions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agentId")
      .references(() => agents.id, { onDelete: "cascade" })
      .notNull(),

    type: text("type", {
      enum: [
        "BUG_FIX",
        "FEATURE",
        "DEPLOY",
        "TEST_PASS",
        "TEST_FAIL",
        "CODE_REVIEW",
        "EMAIL_SENT",
        "JOB_FOUND",
        "SPONSORSHIP_WON",
      ],
    }).notNull(),

    xpEarned: integer("xpEarned").notNull(),
    success: boolean("success").notNull(),

    // Action details
    metadata: jsonb("metadata")
      .$type<{
        pr?: string
        commit?: string
        files?: string[]
        testName?: string
        emailTo?: string
        jobUrl?: string
        sponsorAmount?: number
        errorMessage?: string
      }>()
      .default({}),

    createdOn: timestamp("createdOn", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agent_action_agent_idx").on(table.agentId),
    index("agent_action_type_idx").on(table.type),
    index("agent_action_created_idx").on(table.createdOn),
  ],
)

export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type AgentAction = typeof agentActions.$inferSelect
export type NewAgentAction = typeof agentActions.$inferInsert
