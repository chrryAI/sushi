/**
 * Agent DNA System
 * Genetic code for agent behavior and evolution
 */

import { SpatialCoordinate } from "./spatial.js";

export type AgentType = "sensei" | "student" | "debugger" | "pm" | "custom";
export type AutonomyLevel = "manual" | "semi" | "full";

export interface AgentStats {
  level: number; // 1-99
  xp: number;
  mutationsTested: number;
  mutationsKilled: number;
  filesEdited: number;
  conversations: number;
}

export interface Mutation {
  id: string;
  type: "prompt" | "tool" | "strategy" | "knowledge";
  original: string;
  mutated: string;
  timestamp: number;
  successRate: number; // 0-1
  killed: boolean;
}

export interface InterAppFeedback {
  sourceAgent: AgentType;
  targetAgent: AgentType;
  mutationId: string;
  successMetric: number;
  adoptionDecision: "auto" | "pending" | "rejected";
  timestamp: number;
}

export interface DNAThread {
  id: string;
  agent: AgentType;

  // Genetic code
  systemPrompt: string;
  availableTools: string[];
  autonomyLevel: AutonomyLevel;

  // Stats & evolution
  stats: AgentStats;
  mutations: Mutation[];
  feedback: InterAppFeedback[];

  // Spatial position
  coordinate: SpatialCoordinate;

  // Human approvals
  requireApprovalFor: string[]; // ['auth', 'payment', 'delete']
  notifyOnMutation: boolean;
}

// XP calculation
export const XP_PER_MUTATION_KILLED = 50;
export const XP_PER_FILE_EDITED = 10;
export const XP_PER_CONVERSATION = 5;

export function calculateLevel(xp: number): number {
  return Math.min(99, Math.floor(xp / 100) + 1);
}

export function gainXP(agent: DNAThread, amount: number): void {
  agent.stats.xp += amount;
  agent.stats.level = calculateLevel(agent.stats.xp);
}

// Default DNA threads
export const DEFAULT_SENSEI_DNA: DNAThread = {
  id: "sensei-default",
  agent: "sensei",
  systemPrompt: `You are Sensei, an expert software architect.
Your role is to:
1. Analyze code architecture
2. Plan multi-file changes
3. Run mutation testing (STRIKE)
4. Guide other agents

Always think step-by-step and explain your reasoning.`,
  availableTools: [
    "read_file",
    "write_file",
    "run_command",
    "search_code",
    "git_diff",
    "strike_test",
    "plan",
  ],
  autonomyLevel: "semi",
  stats: {
    level: 1,
    xp: 0,
    mutationsTested: 0,
    mutationsKilled: 0,
    filesEdited: 0,
    conversations: 0,
  },
  mutations: [],
  feedback: [],
  coordinate: { x: "sensei", y: "general", z: Date.now() },
  requireApprovalFor: ["auth", "payment", "delete", "git_push"],
  notifyOnMutation: true,
};

export const DEFAULT_STUDENT_DNA: DNAThread = {
  id: "student-default",
  agent: "student",
  systemPrompt: `You are Student, a capable software developer.
Your role is to:
1. Write clean, tested code
2. Follow Sensei's architecture
3. Ask questions when unclear
4. Learn from feedback

Implement features carefully and test your changes.`,
  availableTools: ["read_file", "write_file", "run_command", "search_code", "git_diff"],
  autonomyLevel: "manual",
  stats: {
    level: 1,
    xp: 0,
    mutationsTested: 0,
    mutationsKilled: 0,
    filesEdited: 0,
    conversations: 0,
  },
  mutations: [],
  feedback: [],
  coordinate: { x: "student", y: "general", z: Date.now() },
  requireApprovalFor: ["auth", "payment", "delete"],
  notifyOnMutation: true,
};
