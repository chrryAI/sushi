/**
 * FalkorDB Client
 * Graph + Vector database for spatial memory
 */

import { FalkorDB } from "falkordb";
import type { MemoryNode, MemoryQuery } from "../types/memory.js";
import type { SpatialCoordinate } from "../types/spatial.js";

let db: FalkorDB | null = null;
let graph: any = null;

export async function initDB(): Promise<void> {
  if (db) return;

  try {
    db = await FalkorDB.connect({
      socket: {
        host: process.env.FALKORDB_HOST || "localhost",
        port: parseInt(process.env.FALKORDB_PORT || "6380", 10),
      },
    });

    graph = db.selectGraph("sushi_memory");

    // Create indices
    await graph.query("CREATE INDEX ON :Memory(id)");
    await graph.query("CREATE INDEX ON :Memory(type)");
    await graph.query("CREATE INDEX ON :Memory(agent)");

    console.log("🧠 FalkorDB connected");
  } catch (err) {
    console.warn("⚠️  FalkorDB not available, running in memory-only mode");
    db = null;
    graph = null;
  }
}

export async function saveMemory(node: MemoryNode): Promise<void> {
  if (!graph) {
    // In-memory fallback
    inMemoryStore.set(node.id, node);
    return;
  }

  const query = `
    CREATE (m:Memory {
      id: $id,
      content: $content,
      type: $type,
      agent: $agent,
      timestamp: $timestamp,
      coordinate_x: $coordX,
      coordinate_y: $coordY,
      coordinate_z: $coordZ
    })
    RETURN m
  `;

  await graph.query(query, {
    params: {
      id: node.id,
      content: node.content,
      type: node.type,
      agent: node.agent,
      timestamp: node.timestamp,
      coordX: node.coordinate.x,
      coordY: node.coordinate.y,
      coordZ: node.coordinate.z,
    },
  });

  // Create relationships
  if (node.relatedFiles) {
    for (const file of node.relatedFiles) {
      await graph.query(
        `
        MATCH (m:Memory {id: $memId})
        MERGE (f:File {path: $file})
        CREATE (m)-[:RELATED_TO]->(f)
      `,
        { params: { memId: node.id, file } },
      );
    }
  }
}

export async function queryMemory(query: MemoryQuery): Promise<MemoryNode[]> {
  if (!graph) {
    // In-memory fallback with simple filtering
    return Array.from(inMemoryStore.values())
      .filter((node) => {
        if (query.agent && node.agent !== query.agent) return false;
        if (query.type && node.type !== query.type) return false;
        if (query.since && node.timestamp < query.since) return false;
        if (query.until && node.timestamp > query.until) return false;
        return true;
      })
      .slice(query.offset || 0, query.limit || 100);
  }

  // Build Cypher query
  let cypher = "MATCH (m:Memory)";
  const params: Record<string, unknown> = {};
  const conditions: string[] = [];

  if (query.agent) {
    conditions.push("m.agent = $agent");
    params.agent = query.agent;
  }

  if (query.type) {
    conditions.push("m.type = $type");
    params.type = query.type;
  }

  if (query.coordinate?.x) {
    conditions.push("m.coordinate_x = $coordX");
    params.coordX = query.coordinate.x;
  }

  if (query.coordinate?.y) {
    conditions.push("m.coordinate_y = $coordY");
    params.coordY = query.coordinate.y;
  }

  if (conditions.length > 0) {
    cypher += " WHERE " + conditions.join(" AND ");
  }

  cypher += " RETURN m ORDER BY m.timestamp DESC";

  if (query.limit) {
    cypher += " LIMIT $limit";
    params.limit = query.limit;
  }

  const result = await graph.query(cypher, { params });

  return (
    result.data?.map((row: any) => ({
      id: row[0].properties.id,
      content: row[0].properties.content,
      type: row[0].properties.type,
      agent: row[0].properties.agent,
      timestamp: row[0].properties.timestamp,
      coordinate: {
        x: row[0].properties.coordinate_x,
        y: row[0].properties.coordinate_y,
        z: row[0].properties.coordinate_z,
      },
    })) || []
  );
}

export async function getRecentMemories(
  coordinate: SpatialCoordinate,
  limit: number = 10,
): Promise<MemoryNode[]> {
  return queryMemory({
    coordinate: { x: coordinate.x, y: coordinate.y },
    limit,
  });
}

export async function closeDB(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    graph = null;
  }
}

// In-memory fallback
const inMemoryStore = new Map<string, MemoryNode>();
