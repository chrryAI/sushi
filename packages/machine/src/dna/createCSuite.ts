// ─────────────────────────────────────────────────────────────────
// createCSuite.ts — Seed C-Level agent stores + role knowledge
//
// What this does:
//  1. Creates a private "C-Suite" system store
//  2. Updates each C-level app with role/mission/systemPrompt/rpg stats
//  3. Seeds role knowledge chunks as memories with vector embeddings
//     (semantic RAG — no flat MD files needed)
//
// Usage:
//   pnpm tsx packages/machine/src/dna/createCSuite.ts
//   or call createCSuite({ userId }) from seed.ts
// ─────────────────────────────────────────────────────────────────

import dotenv from "dotenv"
import { eq } from "drizzle-orm"
import {
  createStore,
  db,
  getApp,
  getEmbeddingProvider,
  getStore,
  updateApp,
  updateStore,
} from "../../index"
import { CSUITE, CSUITE_STORE, type CSuiteRole } from "../ai/sushi/csuite"
import { memories, storeInstalls, stores } from "../schema"

dotenv.config({ path: "../../.env" })

// ─────────────────────────────────────────────────────────────────
// Embed + insert a knowledge chunk as a memory
// ─────────────────────────────────────────────────────────────────

async function seedRoleMemory({
  appId,
  userId,
  chunk,
  embedding,
}: {
  appId: string
  userId?: string
  chunk: CSuiteRole["knowledge"][number]
  embedding: Awaited<ReturnType<typeof getEmbeddingProvider>>
}) {
  // Generate embedding vector for semantic retrieval
  let vector: number[] | null = null

  if (embedding.textEmbeddingModel) {
    try {
      const result = await embedding.textEmbeddingModel.doEmbed({
        values: [`${chunk.title}\n\n${chunk.content}`],
      })
      vector = result.embeddings?.[0] ?? null
    } catch (e) {
      console.warn(`⚠️  Embedding failed for "${chunk.title}":`, e)
    }
  }

  // Upsert: delete existing memory with same title+appId, then insert
  await db.delete(memories).where(eq(memories.appId, appId))

  // Insert fresh chunk
  await db.insert(memories).values({
    appId,
    userId,
    content: chunk.content,
    title: chunk.title,
    category: chunk.category,
    importance: chunk.importance,
    tags: chunk.tags,
    embedding: vector as any,
    metadata: {
      extractedBy: "csuite-seed",
      confidence: 1.0,
      relatedMemories: [],
    },
  })
}

// ─────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────

export async function createCSuite({ userId }: { userId?: string } = {}) {
  console.log("🏢 Seeding C-Suite store and role knowledge...")

  // ── 1. Create or find C-Suite store ──────────────────────────────
  let csuiteStore: any = await getStore({ slug: CSUITE_STORE.slug })

  if (!csuiteStore) {
    csuiteStore = (await createStore({
      name: CSUITE_STORE.name,
      slug: CSUITE_STORE.slug,
      title: CSUITE_STORE.title,
      description: CSUITE_STORE.description,
      isSystem: true,
      visibility: "private",
      userId,
    })) as unknown as { id: string } & Record<string, any>
    console.log(`✅ Created store: ${CSUITE_STORE.slug}`)
  } else {
    await updateStore({
      id: (csuiteStore as unknown as { id: string }).id,
      description: CSUITE_STORE.description,
      updatedOn: new Date(),
    })
    console.log(`♻️  Store exists: ${CSUITE_STORE.slug}`)
  }

  if (!csuiteStore) {
    throw new Error("Failed to create/find C-Suite store")
  }

  // ── 2. Get embedding provider (uses system key) ───────────────────
  const embeddingProvider = await getEmbeddingProvider({
    source: "default",
  })

  // ── 3. Process each C-level role ─────────────────────────────────
  for (const role of CSUITE) {
    const app = await getApp({ slug: role.appSlug, isSafe: false })

    if (!app) {
      console.warn(`⚠️  App not found: ${role.appSlug} — skipping`)
      continue
    }

    // Update app with role metadata + rpg stats
    await (updateApp as any)({
      id: app.id,
      role: role.role,
      mission: role.mission,
      systemPrompt: role.systemPrompt,
      ragEnabled: true,
      intelligence: role.rpg.intelligence,
      creativity: role.rpg.creativity,
      empathy: role.rpg.empathy,
      efficiency: role.rpg.efficiency,
      level: role.rpg.level,
      storeId: (csuiteStore as unknown as { id: string }).id,
    })

    // Install app into C-Suite store (upsert)
    const existing = await db
      .select()
      .from(storeInstalls)
      .where(eq(storeInstalls.appId, app.id))
      .limit(1)

    if (!existing.length) {
      await db.insert(storeInstalls).values({
        storeId: (csuiteStore as unknown as { id: string }).id,
        appId: app.id,
        featured: ["chrry", "sushi", "vault"].includes(role.appSlug),
        displayOrder: CSUITE.findIndex((r) => r.appSlug === role.appSlug),
      })
    }

    // Clear old role memories for this app before re-seeding
    await db.delete(memories).where(eq(memories.appId, app.id))

    // Seed each knowledge chunk as a memory with embedding
    let seeded = 0
    for (const chunk of role.knowledge) {
      await seedRoleMemory({
        appId: app.id,
        userId,
        chunk,
        embedding: embeddingProvider,
      })
      seeded++
    }

    console.log(
      `✅ ${role.role.padEnd(6)} ${role.appSlug.padEnd(10)} — ${seeded} knowledge chunks embedded`,
    )
  }

  console.log(
    `\n🎉 C-Suite seeded: ${CSUITE.length} agents, store "${CSUITE_STORE.slug}"\n`,
  )

  return csuiteStore
}

// ─────────────────────────────────────────────────────────────────
// CLI entry point: pnpm tsx src/dna/createCSuite.ts
// ─────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  createCSuite()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("❌ C-Suite seed failed:", e)
      process.exit(1)
    })
}
