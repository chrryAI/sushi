/**
 * Seed FalkorDB with data from PostgreSQL
 * Run this script to populate the graph database with stores, apps, threads,
 * memories, and character profiles.
 *
 * PostgreSQL = source of truth. FalkorDB = fast local graph for offline/agent use.
 * All writes use MERGE so re-runs are idempotent (safe after re-install).
 */

import { db } from "../../index"
import { graph } from "../graph/client"

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export async function seedStoresToFalkorDB() {
  if (!db) throw new Error("PostgreSQL DB not initialized")

  const { stores } = await import("../schema")
  const rows = await db.select().from(stores)
  console.log(`📦 Seeding ${rows.length} stores…`)

  for (const s of rows) {
    await graph.query(
      `
      MERGE (store:Store {id: $id})
      SET store.slug = $slug, store.name = $name,
          store.title = $title, store.description = $description
      `,
      {
        params: {
          id: s.id,
          slug: s.slug,
          name: s.name,
          title: s.title ?? null,
          description: s.description ?? null,
        },
      },
    )
  }
  console.log(`✅ ${rows.length} stores seeded`)
}

// ---------------------------------------------------------------------------
// Apps
// ---------------------------------------------------------------------------

export async function seedAppsToFalkorDB() {
  if (!db) throw new Error("PostgreSQL DB not initialized")

  const { apps } = await import("../schema")
  const rows = await db.select().from(apps)
  console.log(`🤖 Seeding ${rows.length} apps…`)

  for (const a of rows) {
    await graph.query(
      `
      MERGE (app:App {id: $id})
      SET app.slug = $slug, app.name = $name,
          app.title = $title, app.subtitle = $subtitle,
          app.description = $description, app.systemPrompt = $systemPrompt,
          app.placeholder = $placeholder, app.visibility = $visibility,
          app.status = $status, app.themeColor = $themeColor,
          app.backgroundColor = $backgroundColor, app.icon = $icon,
          app.version = $version, app.userId = $userId, app.storeId = $storeId
      `,
      {
        params: {
          id: a.id,
          slug: a.slug,
          name: a.name,
          title: a.title ?? null,
          subtitle: a.subtitle ?? null,
          description: a.description ?? null,
          systemPrompt: a.systemPrompt ?? null,
          placeholder: a.placeholder ?? null,
          visibility: a.visibility ?? "public",
          status: a.status ?? "active",
          themeColor: a.themeColor ?? null,
          backgroundColor: a.backgroundColor ?? null,
          icon: a.icon ?? null,
          version: a.version ?? "1.0.0",
          userId: a.userId ?? null,
          storeId: a.storeId ?? null,
        },
      },
    )

    if (a.storeId) {
      await graph.query(
        `
        MATCH (app:App {id: $appId})
        MATCH (store:Store {id: $storeId})
        MERGE (app)-[:BELONGS_TO]->(store)
        `,
        { params: { appId: a.id, storeId: a.storeId } },
      )
    }

    if (a.userId) {
      await graph.query(
        `
        MATCH (app:App {id: $appId})
        MERGE (user:User {id: $userId})
        MERGE (user)-[:OWNS]->(app)
        `,
        { params: { appId: a.id, userId: a.userId } },
      )
    }
  }
  console.log(`✅ ${rows.length} apps seeded`)
}

// ---------------------------------------------------------------------------
// Memories  (pass userId to limit to one user's data on desktop)
// ---------------------------------------------------------------------------

export async function seedMemoriesToFalkorDB(userId?: string) {
  if (!db) throw new Error("PostgreSQL DB not initialized")

  const { memories } = await import("../schema")
  const { eq } = await import("drizzle-orm")

  const rows = userId
    ? await db.select().from(memories).where(eq(memories.userId, userId))
    : await db.select().from(memories)

  console.log(`🧠 Seeding ${rows.length} memories…`)

  for (const m of rows) {
    await graph.query(
      `
      MERGE (mem:Memory {id: $id})
      SET mem.title = $title, mem.content = $content,
          mem.category = $category, mem.importance = $importance,
          mem.usageCount = $usageCount, mem.tags = $tags
      `,
      {
        params: {
          id: m.id,
          title: m.title,
          content: m.content,
          category: m.category,
          importance: m.importance,
          usageCount: m.usageCount,
          tags: JSON.stringify(m.tags ?? []),
        },
      },
    )

    if (m.userId) {
      await graph.query(
        `
        MATCH (mem:Memory {id: $memId})
        MERGE (u:User {id: $userId})
        MERGE (mem)-[:BELONGS_TO]->(u)
        `,
        { params: { memId: m.id, userId: m.userId } },
      )
    }

    if (m.appId) {
      await graph.query(
        `
        MATCH (mem:Memory {id: $memId})
        MATCH (a:App {id: $appId})
        MERGE (mem)-[:ABOUT]->(a)
        `,
        { params: { memId: m.id, appId: m.appId } },
      )
    }

    if (m.sourceThreadId) {
      await graph.query(
        `
        MATCH (mem:Memory {id: $memId})
        MERGE (t:Thread {id: $threadId})
        MERGE (mem)-[:SOURCED_FROM]->(t)
        `,
        { params: { memId: m.id, threadId: m.sourceThreadId } },
      )
    }
  }
  console.log(`✅ ${rows.length} memories seeded`)
}

// ---------------------------------------------------------------------------
// Character Profiles  (pass userId to limit to one user's data on desktop)
// ---------------------------------------------------------------------------

export async function seedCharacterProfilesToFalkorDB(userId?: string) {
  if (!db) throw new Error("PostgreSQL DB not initialized")

  const { characterProfiles } = await import("../schema")
  const { eq } = await import("drizzle-orm")

  const rows = userId
    ? await db
        .select()
        .from(characterProfiles)
        .where(eq(characterProfiles.userId, userId))
    : await db.select().from(characterProfiles)

  console.log(`🎭 Seeding ${rows.length} character profiles…`)

  for (const p of rows) {
    await graph.query(
      `
      MERGE (c:CharacterProfile {id: $id})
      SET c.name = $name, c.personality = $personality,
          c.userRelationship = $userRelationship, c.tags = $tags
      `,
      {
        params: {
          id: p.id,
          name: p.name ?? null,
          personality: p.personality ?? null,
          userRelationship: p.userRelationship ?? null,
          tags: JSON.stringify(p.tags ?? []),
        },
      },
    )

    // CharacterProfile relates to a specific App (agentId)
    if (p.agentId) {
      await graph.query(
        `
        MATCH (c:CharacterProfile {id: $profileId})
        MATCH (a:App {id: $agentId})
        MERGE (c)-[:PERSONA_OF]->(a)
        `,
        { params: { profileId: p.id, agentId: p.agentId } },
      )
    }

    if (p.userId) {
      await graph.query(
        `
        MATCH (c:CharacterProfile {id: $profileId})
        MERGE (u:User {id: $userId})
        MERGE (c)-[:KNOWS]->(u)
        `,
        { params: { profileId: p.id, userId: p.userId } },
      )
    }
  }
  console.log(`✅ ${rows.length} character profiles seeded`)
}

// ---------------------------------------------------------------------------
// Threads  (pass userId to limit to one user's data on desktop)
// ---------------------------------------------------------------------------

export async function seedThreadsToFalkorDB(userId?: string) {
  if (!db) throw new Error("PostgreSQL DB not initialized")

  const { threads } = await import("../schema")
  const { eq } = await import("drizzle-orm")

  const rows = userId
    ? await db.select().from(threads).where(eq(threads.userId, userId))
    : await db.select().from(threads)

  console.log(`💬 Seeding ${rows.length} threads…`)

  for (const t of rows) {
    await graph.query(
      `
      MERGE (th:Thread {id: $id})
      SET th.title = $title, th.createdOn = $createdOn
      `,
      {
        params: {
          id: t.id,
          title: t.title ?? null,
          createdOn: t.createdOn?.toISOString() ?? null,
        },
      },
    )

    if (t.userId) {
      await graph.query(
        `
        MATCH (th:Thread {id: $threadId})
        MERGE (u:User {id: $userId})
        MERGE (th)-[:OWNED_BY]->(u)
        `,
        { params: { threadId: t.id, userId: t.userId } },
      )
    }

    if (t.appId) {
      await graph.query(
        `
        MATCH (th:Thread {id: $threadId})
        MATCH (a:App {id: $appId})
        MERGE (th)-[:USES_APP]->(a)
        `,
        { params: { threadId: t.id, appId: t.appId } },
      )
    }
  }
  console.log(`✅ ${rows.length} threads seeded`)
}

// ---------------------------------------------------------------------------
// Ecosystem
// ---------------------------------------------------------------------------

export async function seedEcosystemToFalkorDB() {
  await graph.query(`
    MERGE (lifeos:Ecosystem {id: 'lifeos'})
    SET lifeos.name = 'LifeOS',
        lifeos.description = 'Suite of specialized AI agents and apps',
        lifeos.url = 'https://chrry.ai'
  `)

  await graph.query(`
    MATCH (lifeos:Ecosystem {id: 'lifeos'})
    MATCH (store:Store)
    MERGE (store)-[:PART_OF]->(lifeos)
  `)
  console.log("✅ LifeOS ecosystem connected")
}

// ---------------------------------------------------------------------------
// Composite helpers
// ---------------------------------------------------------------------------

/** Full public seed: stores + apps + ecosystem */
export async function seedChrryToFalkorDB() {
  console.log("🌱 Starting FalkorDB full seed…")
  await seedStoresToFalkorDB()
  await seedAppsToFalkorDB()
  await seedEcosystemToFalkorDB()
  console.log("✅ Chrry ecosystem seeding complete")
}

/**
 * Per-user seed for desktop setup wizard.
 * Call after seedChrryToFalkorDB() so App/Store nodes already exist.
 */
export async function seedUserToFalkorDB(userId: string) {
  console.log(`👤 Seeding user data for ${userId}…`)
  await seedMemoriesToFalkorDB(userId)
  await seedCharacterProfilesToFalkorDB(userId)
  await seedThreadsToFalkorDB(userId)
  console.log(`✅ User ${userId} seeded to FalkorDB`)
}

// ---------------------------------------------------------------------------
// Overview / diagnostics
// ---------------------------------------------------------------------------

export async function getFalkorDBOverview() {
  const counts: Record<string, number> = {}

  for (const [label, cypher] of [
    ["Store", "MATCH (n:Store) RETURN COUNT(n) AS c"],
    ["App", "MATCH (n:App) RETURN COUNT(n) AS c"],
    ["Memory", "MATCH (n:Memory) RETURN COUNT(n) AS c"],
    ["CharacterProfile", "MATCH (n:CharacterProfile) RETURN COUNT(n) AS c"],
    ["Thread", "MATCH (n:Thread) RETURN COUNT(n) AS c"],
    ["Relationship", "MATCH ()-[r]->() RETURN COUNT(r) AS c"],
  ] as const) {
    const res = (await graph.query(cypher)) as any
    counts[label] = res?.data?.[0]?.c ?? 0
  }

  console.log("\n📊 FalkorDB Overview")
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`)
  }
  console.log()
}

export async function closeFalkorDB() {
  // Connection managed by src/graph/client
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  ;(async () => {
    await seedChrryToFalkorDB()
    await getFalkorDBOverview()
  })().catch(console.error)
}
