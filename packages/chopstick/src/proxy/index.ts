#!/usr/bin/env node
import { Hono } from "hono"
import { cors } from "hono/cors"
import { streamText } from "hono/streaming"

const API_BASE = process.env.CHRRY_API_BASE ?? "http://localhost:3001"
const API_KEY = process.env.CHRRY_API_KEY
const APP_ID = process.env.CHRRY_APP_ID ?? "sushi"
const MODEL_ID =
  process.env.CHRRY_MODEL_ID ?? "anthropic/claude-sonnet-4-20250514"
const PORT = Number(process.env.PROXY_PORT ?? 3456)

const app = new Hono()

app.use("*", cors({ origin: "*" }))

// Request logging
app.use("*", async (c, next) => {
  const start = Date.now()
  console.error(`[ClaudeClaw] → ${c.req.method} ${c.req.path}`)
  await next()
  const ms = Date.now() - start
  console.error(
    `[ClaudeClaw] ← ${c.req.method} ${c.req.path} ${c.res.status} (${ms}ms)`,
  )
})

app.onError((err, c) => {
  console.error("[ClaudeClaw] Error:", err)
  return c.json({ error: err.message, proxy: "claudeclaw" }, 500)
})

app.get("/health", (c) =>
  c.json({
    status: "ok",
    proxy: "claudeclaw",
    version: "1.0.0",
    upstream: API_BASE,
  }),
)

/*
 * Anthropic-compatible model list
 */
app.get("/v1/models", (c) =>
  c.json({
    data: [
      {
        type: "model",
        id: "claude-sonnet-4-20250514",
        display_name: "Claude Sonnet 4",
        created_at: "2025-05-14T00:00:00Z",
      },
      {
        type: "model",
        id: "claude-sonnet-4-6",
        display_name: "Claude Sonnet 4.6",
        created_at: "2025-05-14T00:00:00Z",
      },
      {
        type: "model",
        id: "claude-opus-4-20250514",
        display_name: "Claude Opus 4",
        created_at: "2025-05-14T00:00:00Z",
      },
      {
        type: "model",
        id: "claude-haiku-4-20250514",
        display_name: "Claude Haiku 4",
        created_at: "2025-05-14T00:00:00Z",
      },
    ],
  }),
)

/**
 * Strip provider prefixes (anthropic/, openai/, google/) so Claude Code
 * recognises the model ID in its own validation.
 */
function toAnthropicModelId(modelId: string): string {
  return modelId
    .replace(/^anthropic\//, "")
    .replace(/^openai\//, "")
    .replace(/^google\//, "")
}

/*
 * Convert Anthropic Messages API -> Chrry OpenAI-compatible /chrry/chat
 */
app.post("/v1/messages", async (c) => {
  let body: {
    model?: string
    max_tokens?: number
    messages?: Array<{ role: string; content: string }>
    system?: string
    stream?: boolean
  } = {}

  try {
    const raw = await c.req.text()
    if (raw) {
      body = JSON.parse(raw)
    }
  } catch (parseErr) {
    console.error("[ClaudeClaw] Failed to parse request body:", parseErr)
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  const { model = MODEL_ID, messages = [], system, stream = false } = body

  // Build Chrry-compatible messages
  const chrryMessages: Array<{ role: string; content: string }> = []
  if (system) {
    chrryMessages.push({ role: "system", content: system })
  }
  for (const m of messages) {
    chrryMessages.push(m)
  }

  const ramen = {
    appId: APP_ID,
    modelId: model,
    llm: true,
  }

  const upstreamBody = {
    messages: chrryMessages,
    model: model,
    stream,
    ramen,
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`
  }

  // ── Streaming ──────────────────────────────────────────────
  if (stream) {
    return streamText(c, async (s) => {
      let res: Response
      try {
        res = await fetch(`${API_BASE}/chrry/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify(upstreamBody),
        })
      } catch (fetchErr) {
        console.error("[ClaudeClaw] Upstream fetch failed:", fetchErr)
        s.write(
          `event: error\ndata: ${JSON.stringify({
            error: `Upstream unreachable: ${(fetchErr as Error).message}`,
          })}\n\n`,
        )
        return
      }

      if (!res.ok) {
        const text = await res.text()
        console.error("[ClaudeClaw] Upstream error:", res.status, text)
        s.write(`event: error\ndata: ${JSON.stringify({ error: text })}\n\n`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        s.write(
          `event: error\ndata: ${JSON.stringify({ error: "No body" })}\n\n`,
        )
        return
      }

      const msgId = `msg_${randomId()}`
      const anthropicModel = toAnthropicModelId(model)

      // message_start
      s.write(
        `event: message_start\ndata: ${JSON.stringify({
          type: "message_start",
          message: {
            id: msgId,
            type: "message",
            role: "assistant",
            model: anthropicModel,
            content: [],
            stop_reason: null,
            usage: { input_tokens: 0, output_tokens: 0 },
          },
        })}\n\n`,
      )

      // content_block_start
      s.write(
        `event: content_block_start\ndata: ${JSON.stringify({
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" },
        })}\n\n`,
      )

      const decoder = new TextDecoder()
      let buffer = ""
      let totalOutputTokens = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue

            const dataStr = trimmed.slice(6)
            if (dataStr === "[DONE]") continue

            try {
              const chunk = JSON.parse(dataStr)
              const delta = chunk.choices?.[0]?.delta?.content
              if (delta) {
                totalOutputTokens += 1
                s.write(
                  `event: content_block_delta\ndata: ${JSON.stringify({
                    type: "content_block_delta",
                    index: 0,
                    delta: { type: "text_delta", text: delta },
                  })}\n\n`,
                )
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // content_block_stop
      s.write(
        `event: content_block_stop\ndata: ${JSON.stringify({
          type: "content_block_stop",
          index: 0,
        })}\n\n`,
      )

      // message_delta
      s.write(
        `event: message_delta\ndata: ${JSON.stringify({
          type: "message_delta",
          delta: { stop_reason: "end_turn", stop_sequence: null },
          usage: { output_tokens: totalOutputTokens },
        })}\n\n`,
      )

      // message_stop
      s.write(
        `event: message_stop\ndata: ${JSON.stringify({
          type: "message_stop",
        })}\n\n`,
      )
    })
  }

  // ── Non-streaming ──────────────────────────────────────────
  let res: Response
  try {
    res = await fetch(`${API_BASE}/chrry/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(upstreamBody),
    })
  } catch (fetchErr) {
    console.error("[ClaudeClaw] Upstream fetch failed:", fetchErr)
    return c.json(
      { error: `Upstream unreachable: ${(fetchErr as Error).message}` },
      502,
    )
  }

  if (!res.ok) {
    const text = await res.text()
    console.error("[ClaudeClaw] Upstream error:", res.status, text)
    return c.json({ error: text }, res.status as any)
  }

  const data = (await res.json()) as {
    id: string
    model: string
    choices: Array<{
      message?: { role: string; content: string }
      finish_reason?: string
    }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const content = data.choices?.[0]?.message?.content ?? ""
  const inputTokens = data.usage?.prompt_tokens ?? 0
  const outputTokens = data.usage?.completion_tokens ?? 0

  const anthropicResponse = {
    id: `msg_${randomId()}`,
    type: "message",
    role: "assistant",
    model: toAnthropicModelId(data.model ?? model),
    content: [{ type: "text", text: content }],
    stop_reason:
      data.choices?.[0]?.finish_reason === "stop" ? "end_turn" : null,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  }

  return c.json(anthropicResponse)
})

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function main() {
  console.error(`🦞 ClaudeClaw proxy starting on http://localhost:${PORT}`)
  console.error(`   Upstream: ${API_BASE}/chrry/chat`)
  console.error(`   App ID:   ${APP_ID}`)
  console.error(`   Model:    ${MODEL_ID}`)

  const bun = (globalThis as any).Bun
  const server = bun?.serve
    ? bun.serve({
        port: PORT,
        fetch: app.fetch,
      })
    : null

  if (!server) {
    // Fallback for Node — Hono has no built-in listen, use native module
    const { createServer } = await import("node:http")
    createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`)
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) {
          headers.set(k, Array.isArray(v) ? v.join(", ") : v)
        }
      }

      let body: ArrayBuffer | undefined
      if (req.method !== "GET" && req.method !== "HEAD") {
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        body = Buffer.concat(chunks).buffer as ArrayBuffer
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body,
      })

      const response = await app.fetch(request)
      res.statusCode = response.status
      response.headers.forEach((v, k) => res.setHeader(k, v))
      const resBody = await response.text()
      res.end(resBody)
    }).listen(PORT, () => {
      console.error(`🦞 ClaudeClaw proxy listening on http://localhost:${PORT}`)
    })
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
