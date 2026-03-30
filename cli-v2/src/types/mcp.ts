/**
 * Model Context Protocol Types
 * Standard tool system for AI agents
 */

import { JSONSchema7 } from "json-schema";

export interface MCPTool {
  name: string;
  description: string;
  parameters: JSONSchema7;
}

export interface MCPToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface MCPServer {
  name: string;
  transport: "stdio" | "http" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

// Built-in SUSHI tools
export const SUSHI_TOOLS: MCPTool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" },
        offset: { type: "number", description: "Line offset (optional)" },
        limit: { type: "number", description: "Max lines to read (optional)" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_command",
    description: "Run a shell command",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to run" },
        cwd: { type: "string", description: "Working directory (optional)" },
      },
      required: ["command"],
    },
  },
  {
    name: "search_code",
    description: "Search for code patterns in the codebase",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        path: { type: "string", description: "Path to search in (optional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "git_diff",
    description: "Show git diff",
    parameters: {
      type: "object",
      properties: {
        staged: { type: "boolean", description: "Show staged changes" },
        file: { type: "string", description: "Specific file (optional)" },
      },
    },
  },
  {
    name: "strike_test",
    description: "Run mutation testing with STRIKE",
    parameters: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to test",
        },
        testCommand: { type: "string", description: "Test command to run" },
      },
      required: ["files"],
    },
  },
  {
    name: "navigate_spatial",
    description: "Navigate to a spatial coordinate",
    parameters: {
      type: "object",
      properties: {
        x: { type: "string", description: "X coordinate (app/agent)" },
        y: { type: "string", description: "Y coordinate (context)" },
        z: { type: "number", description: "Z coordinate (time)" },
      },
    },
  },
  {
    name: "recall_memory",
    description: "Recall relevant memories from the past",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to recall" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["query"],
    },
  },
  {
    name: "view_image",
    description: "Analyze an image",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to image" },
      },
      required: ["path"],
    },
  },
  {
    name: "plan",
    description: "Create a plan before executing (architect mode)",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "Task to plan" },
        steps: {
          type: "array",
          items: { type: "string" },
          description: "Planned steps",
        },
      },
      required: ["task", "steps"],
    },
  },
];
