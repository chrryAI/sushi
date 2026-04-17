/**
 * FalkorDB Read-Only Query Helpers
 *
 * Safe server-side helpers for reading graph data.
 * All functions return typed results and silently return empty arrays when
 * FalkorDB is unavailable (graceful degradation, same pattern as graph/client).
 *
 * Usage:
 *   import { getMemoriesForUser } from "@/src/graph/queries"
 *   const memories = await getMemoriesForUser(userId)
 */

import { graph, isGraphAvailable } from "./client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphMemory {
  id: string
  title: string
  content: string
  category: string
  importance: number
  tags: string[]
}

export interface GraphCharacterProfile {
  id: string
  name: string
  personality: string
  userRelationship: string | null
  tags: string[]
}

export interface GraphThread {
  id: string
  title: string | null
  createdOn: string | null
  appSlug: string | null
  appName: string | null
}

export interface GraphApp {
  id: string
  slug: string
  name: string
  icon: string | null
  depth: number
}

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

/**
 * Get all memories for a user, ordered by importance desc.
 */
export async function getMemoriesForUser(
  userId: string,
  limit: number = 50,
): Promise<GraphMemory[]> {
  if (!isGraphAvailable) return []
  // Ensure limit is a positive integer
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 50))
  try {
    const res = (await graph.query(
      `
      MATCH (m:Memory)-[:BELONGS_TO]->(u:User {id: $userId})
      RETURN m.id AS id, m.title AS title, m.content AS content,
             m.category AS category, m.importance AS importance, m.tags AS tags
      ORDER BY m.importance DESC
      LIMIT $limit
      `,
      { params: { userId, limit: safeLimit } },
    )) as any
    return (res?.data ?? []).map((row: any) => ({
      ...row,
      tags: safeParseJson(row.tags, []),
    }))
  } catch {
    return []
  }
}

/**
 * Search memories by tag for a user.
 */
export async function searchMemoriesByTag(
  userId: string,
  tag: string,
): Promise<GraphMemory[]> {
  if (!isGraphAvailable) return []
  try {
    const res = (await graph.query(
      `
      MATCH (m:Memory)-[:BELONGS_TO]->(u:User {id: $userId})
      WHERE $tag IN m.tags
      RETURN m.id AS id, m.title AS title, m.content AS content,
             m.category AS category, m.importance AS importance, m.tags AS tags
      ORDER BY m.importance DESC
      `,
      { params: { userId, tag } },
    )) as any
    return (res?.data ?? []).map((row: any) => ({
      ...row,
      tags: safeParseJson(row.tags, []),
    }))
  } catch {
    return []
  }
}

/**
 * Get memories about a specific app for a user.
 */
export async function getMemoriesForApp(
  userId: string,
  appId: string,
): Promise<GraphMemory[]> {
  if (!isGraphAvailable) return []
  try {
    const res = (await graph.query(
      `
      MATCH (m:Memory)-[:BELONGS_TO]->(u:User {id: $userId})
      MATCH (m)-[:ABOUT]->(a:App {id: $appId})
      RETURN m.id AS id, m.title AS title, m.content AS content,
             m.category AS category, m.importance AS importance, m.tags AS tags
      ORDER BY m.importance DESC
      `,
      { params: { userId, appId } },
    )) as any
    return (res?.data ?? []).map((row: any) => ({
      ...row,
      tags: safeParseJson(row.tags, []),
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Character Profiles
// ---------------------------------------------------------------------------

/**
 * Get all character profiles for a specific app (agent).
 */
export async function getCharacterProfilesForApp(
  appId: string,
): Promise<GraphCharacterProfile[]> {
  if (!isGraphAvailable) return []
  try {
    const res = (await graph.query(
      `
      MATCH (c:CharacterProfile)-[:PERSONA_OF]->(a:App {id: $appId})
      RETURN c.id AS id, c.name AS name, c.personality AS personality,
             c.userRelationship AS userRelationship, c.tags AS tags
      `,
      { params: { appId } },
    )) as any
    return (res?.data ?? []).map((row: any) => ({
      ...row,
      tags: safeParseJson(row.tags, []),
    }))
  } catch {
    return []
  }
}

/**
 * Get character profiles a user has interacted with.
 */
export async function getCharacterProfilesForUser(
  userId: string,
): Promise<GraphCharacterProfile[]> {
  if (!isGraphAvailable) return []
  try {
    const res = (await graph.query(
      `
      MATCH (c:CharacterProfile)-[:KNOWS]->(u:User {id: $userId})
      RETURN c.id AS id, c.name AS name, c.personality AS personality,
             c.userRelationship AS userRelationship, c.tags AS tags
      `,
      { params: { userId } },
    )) as any
    return (res?.data ?? []).map((row: any) => ({
      ...row,
      tags: safeParseJson(row.tags, []),
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

/**
 * Get thread graph for a user — threads with the app they used.
 */
export async function getThreadGraphForUser(
  userId: string,
  limit: number = 100,
): Promise<GraphThread[]> {
  if (!isGraphAvailable) return []
  // Ensure limit is a positive integer
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 100))
  try {
    const res = (await graph.query(
      `
      MATCH (t:Thread)-[:OWNED_BY]->(u:User {id: $userId})
      OPTIONAL MATCH (t)-[:USES_APP]->(a:App)
      RETURN t.id AS id, t.title AS title, t.createdOn AS createdOn,
             a.slug AS appSlug, a.name AS appName
      ORDER BY t.createdOn DESC
      LIMIT $limit
      `,
      { params: { userId, limit: safeLimit } },
    )) as any
    return res?.data ?? []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Apps / Spatial Navigation
// ---------------------------------------------------------------------------

/**
 * Get apps related to a given app up to N hops (spatial traversal).
 * Returns apps with their relationship depth.
 */
export async function getRelatedApps(
  appId: string,
  depth: number = 2,
): Promise<GraphApp[]> {
  if (!isGraphAvailable) return []
  // Ensure depth is a positive integer (max 5 for safety)
  const safeDepth = Math.min(5, Math.max(1, Math.floor(Number(depth) || 2)))
  try {
    const res = (await graph.query(
      `
      MATCH path = (origin:App {id: $appId})-[:BELONGS_TO|EXTENDS*1..$depth]-(related:App)
      WHERE related.id <> $appId
      RETURN DISTINCT related.id AS id, related.slug AS slug, related.name AS name,
             related.icon AS icon, length(path) AS depth
      ORDER BY depth ASC
      LIMIT 20
      `,
      { params: { appId, depth: safeDepth } },
    )) as any
    return res?.data ?? []
  } catch {
    return []
  }
}

/**
 * Get all apps in a store (Y-axis: store depth).
 */
export async function getAppsInStore(storeId: string): Promise<GraphApp[]> {
  if (!isGraphAvailable) return []
  try {
    const res = (await graph.query(
      `
      MATCH (a:App)-[:BELONGS_TO]->(s:Store {id: $storeId})
      RETURN a.id AS id, a.slug AS slug, a.name AS name, a.icon AS icon, 1 AS depth
      ORDER BY a.name
      `,
      { params: { storeId } },
    )) as any
    return res?.data ?? []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

/**
 * Quick health check — returns node counts per label.
 */
export async function getFalkorHealthSummary(): Promise<
  Record<string, number>
> {
  if (!isGraphAvailable) return {}
  const labels = [
    "Store",
    "App",
    "Memory",
    "CharacterProfile",
    "Thread",
    "User",
  ]
  const counts: Record<string, number> = {}
  for (const label of labels) {
    try {
      const res = (await graph.query(
        `MATCH (n:${label}) RETURN COUNT(n) AS c`,
      )) as any
      counts[label] = res?.data?.[0]?.c ?? 0
    } catch {
      counts[label] = -1
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}
