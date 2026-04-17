#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const API_KEY = process.env.CHRRY_API_KEY
const API_BASE = process.env.CHRRY_API_BASE ?? "https://chrry.dev/api"

if (!API_KEY) {
  console.error("❌ CHRRY_API_KEY is required")
  process.exit(1)
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
})

async function callAPI(path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

const server = new Server(
  { name: "sushi", version: "1.0.0" },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "sushi_chat",
      description:
        "Send a message to the Sushi AI and get a response. Use for questions, code help, research, or any task routed through the Chrry AI system.",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The message or question to send",
          },
          appId: {
            type: "string",
            description: "Optional: target app ID (defaults to sushi agent)",
          },
          modelId: {
            type: "string",
            description:
              "Optional: model override e.g. deepseek/deepseek-v3.2, anthropic/claude-sonnet-4-6",
          },
        },
        required: ["message"],
      },
    },
    {
      name: "sushi_search",
      description:
        "Web search via Perplexity through the Chrry API. Returns up-to-date information from the web.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
    {
      name: "sushi_get_thread",
      description: "Fetch a conversation thread by ID from the Chrry database.",
      inputSchema: {
        type: "object",
        properties: {
          threadId: { type: "string", description: "Thread ID to fetch" },
        },
        required: ["threadId"],
      },
    },
    {
      name: "sushi_get_messages",
      description: "Get messages from a thread.",
      inputSchema: {
        type: "object",
        properties: {
          threadId: { type: "string", description: "Thread ID" },
          limit: {
            type: "number",
            description: "Max messages to return (default 20)",
          },
        },
        required: ["threadId"],
      },
    },
    {
      name: "sushi_health",
      description: "Check the Chrry API health and your credit balance.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "sushi_chat": {
        const { message, appId, modelId } = args as {
          message: string
          appId?: string
          modelId?: string
        }

        const data = await callAPI("/api/mcp/chat", {
          message,
          appId,
          modelId,
          source: "mcp",
        })

        return {
          content: [
            {
              type: "text",
              text: data.response ?? data.text ?? JSON.stringify(data),
            },
          ],
        }
      }

      case "sushi_search": {
        const { query } = args as { query: string }

        const data = await callAPI("/api/mcp/search", { query })

        return {
          content: [
            {
              type: "text",
              text: data.result ?? JSON.stringify(data),
            },
          ],
        }
      }

      case "sushi_get_thread": {
        const { threadId } = args as { threadId: string }
        const data = await callAPI(`/api/mcp/thread/${threadId}`)
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "sushi_get_messages": {
        const { threadId, limit = 20 } = args as {
          threadId: string
          limit?: number
        }
        const data = await callAPI(
          `/api/mcp/thread/${threadId}/messages?limit=${limit}`,
        )
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      case "sushi_health": {
        const data = await callAPI("/api/mcp/health")
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("🍣 Sushi MCP server running")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
