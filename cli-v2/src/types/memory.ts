/**
 * Memory System Types
 * FalkorDB integration for persistent context
 */

import { SpatialCoordinate } from "./spatial.js";
import { AgentType } from "./agent.js";

export type MemoryType =
  | "conversation"
  | "code"
  | "error"
  | "mutation"
  | "file"
  | "commit"
  | "tool_call"
  | "image";

export interface MemoryNode {
  id: string;

  // Content
  content: string;
  embedding?: number[]; // Vector for semantic search

  // Metadata
  type: MemoryType;
  agent: AgentType;
  coordinate: SpatialCoordinate;
  timestamp: number;

  // Relationships (stored in graph)
  relatedFiles?: string[];
  relatedCommits?: string[];
  relatedMemories?: string[];

  // Source
  source?: {
    file?: string;
    lineStart?: number;
    lineEnd?: number;
    gitSha?: string;
  };
}

export interface MemoryQuery {
  // Vector search
  semantic?: string;
  embedding?: number[];
  similarity?: number; // Minimum similarity threshold (0-1)

  // Graph filters
  coordinate?: Partial<SpatialCoordinate>;
  agent?: AgentType;
  type?: MemoryType;

  // Time range
  since?: number;
  until?: number;

  // Pagination
  limit?: number;
  offset?: number;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: {
    from: string;
    to: string;
    type: "related_to" | "next" | "similar" | "child_of";
    weight?: number;
  }[];
}

// Memory creation helpers
export function createMemory(
  content: string,
  type: MemoryType,
  agent: AgentType,
  coordinate: SpatialCoordinate,
  options?: Partial<MemoryNode>,
): MemoryNode {
  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    agent,
    coordinate,
    timestamp: Date.now(),
    ...options,
  };
}

// Generate embedding (placeholder - will use actual embedding model)
export async function generateEmbedding(_text: string): Promise<number[]> {
  // In real implementation, use OpenAI/Anthropic embedding API
  // For now, return random vector
  const dimension = 1536; // OpenAI ada-002 dimension
  return Array.from({ length: dimension }, () => Math.random() - 0.5);
}

// Cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
