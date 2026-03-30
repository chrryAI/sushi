/**
 * Zustand Store
 * Global state management for SUSHI CLI
 */

import { create } from "zustand";
import type { SpatialCoordinate, SpatialContext } from "./types/spatial.js";
import type { DNAThread, AgentType } from "./types/agent.js";
import type { MemoryNode } from "./types/memory.js";
import type { MCPToolCall, MCPToolResult } from "./types/mcp.js";
import { DEFAULT_SENSEI_DNA, DEFAULT_STUDENT_DNA } from "./types/agent.js";
import { DEFAULT_COORDINATE } from "./types/spatial.js";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
}

interface UIState {
  activePanel: "nav" | "chat" | "code" | "memory";
  isStreaming: boolean;
  showDiff: boolean;
  diffContent?: { original: string; modified: string };
}

interface SUSHIState {
  // Spatial
  spatial: SpatialContext;
  setCoordinate: (coord: Partial<SpatialCoordinate>) => void;
  navigateHistory: (steps: number) => void;

  // Agents
  activeAgent: AgentType;
  agents: Record<AgentType, DNAThread>;
  setActiveAgent: (agent: AgentType) => void;
  updateAgentDNA: (agent: AgentType, updates: Partial<DNAThread>) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  // Memory
  recentMemories: MemoryNode[];
  addMemory: (memory: MemoryNode) => void;
  setRecentMemories: (memories: MemoryNode[]) => void;

  // Tools
  pendingToolCalls: MCPToolCall[];
  setPendingToolCalls: (calls: MCPToolCall[]) => void;
  toolResults: MCPToolResult[];
  addToolResult: (result: MCPToolResult) => void;

  // UI
  ui: UIState;
  setActivePanel: (panel: UIState["activePanel"]) => void;
  setStreaming: (streaming: boolean) => void;
  setDiff: (diff?: { original: string; modified: string }) => void;
}

export const useStore = create<SUSHIState>((set) => ({
  // Spatial
  spatial: {
    current: DEFAULT_COORDINATE,
    history: [],
    bookmarks: {},
  },
  setCoordinate: (coord) =>
    set((state) => {
      const newCoord = { ...state.spatial.current, ...coord };
      return {
        spatial: {
          ...state.spatial,
          current: newCoord,
          history: [...state.spatial.history.slice(-19), state.spatial.current],
        },
      };
    }),
  navigateHistory: (steps) =>
    set((state) => {
      const history = state.spatial.history;
      const index = history.length + steps;
      if (index >= 0 && index < history.length) {
        return {
          spatial: {
            ...state.spatial,
            current: history[index],
          },
        };
      }
      return state;
    }),

  // Agents
  activeAgent: "sensei",
  agents: {
    sensei: DEFAULT_SENSEI_DNA,
    student: DEFAULT_STUDENT_DNA,
    debugger: { ...DEFAULT_SENSEI_DNA, id: "debugger-default", agent: "debugger" },
    pm: { ...DEFAULT_SENSEI_DNA, id: "pm-default", agent: "pm" },
    custom: { ...DEFAULT_SENSEI_DNA, id: "custom-default", agent: "custom" },
  },
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  updateAgentDNA: (agent, updates) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: { ...state.agents[agent], ...updates },
      },
    })),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  clearMessages: () => set({ messages: [] }),

  // Memory
  recentMemories: [],
  addMemory: (memory) =>
    set((state) => ({
      recentMemories: [memory, ...state.recentMemories.slice(0, 99)],
    })),
  setRecentMemories: (memories) => set({ recentMemories: memories }),

  // Tools
  pendingToolCalls: [],
  setPendingToolCalls: (calls) => set({ pendingToolCalls: calls }),
  toolResults: [],
  addToolResult: (result) =>
    set((state) => ({
      toolResults: [...state.toolResults, result],
    })),

  // UI
  ui: {
    activePanel: "chat",
    isStreaming: false,
    showDiff: false,
  },
  setActivePanel: (panel) =>
    set((state) => ({
      ui: { ...state.ui, activePanel: panel },
    })),
  setStreaming: (streaming) =>
    set((state) => ({
      ui: { ...state.ui, isStreaming: streaming },
    })),
  setDiff: (diff) =>
    set((state) => ({
      ui: { ...state.ui, showDiff: !!diff, diffContent: diff },
    })),
}));
