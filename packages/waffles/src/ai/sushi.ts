// apps/web/src/app/api/ai/[...route]/route.ts

import { makeAiProvider } from "@chrryai/ai-core/provider"
import { chopStick } from "@chrryai/chrry/db" // senin mevcut fonksiyonun
import { Effect } from "effect"
import { Hono } from "hono"
import { handle } from "hono/vercel"

const app = new Hono().basePath("/api/ai")

// ============================================
// MIDDLEWARE - session + app resolve
// chopStick'in yaptığını burada yapıyoruz
// ============================================

app.use("*", async (c, next) => {
  const session = c.get("session") // auth middleware zaten koydu

  // Client header'dan app context alıyoruz
  // (AI SDK bunu otomatik göndermez, sen ekleyeceksin)
  const appSlug = c.req.header("x-app-slug")
  const appId = c.req.header("x-app-id")
  const threadId = c.req.header("x-thread-id")

  // chopStick - DB'ye bağlanıyor, app'i resolve ediyor
  const app = await chopStick({
    slug: appSlug ?? undefined,
    id: appId ?? undefined,
    userId: session?.user?.id,
    guestId: session?.guest?.id,
    threadId: threadId ?? undefined,
    // sadece AI için gerekli join'lar
    join: {
      memories: { user: 5 },
      instructions: { user: 3, app: 3 },
    },
  })

  // context'e koy, route handler'da kullanacağız
  c.set("resolvedApp", app)
  c.set("resolvedUser", session?.user)
  c.set("resolvedGuest", session?.guest)

  await next()
})

// ============================================
// CHAT COMPLETIONS - OpenAI-compatible
// ============================================

app.post("/v1/chat/completions", async (c) => {
  const body = await c.req.json()
  const resolvedApp = c.get("resolvedApp")
  const user = c.get("resolvedUser")
  const guest = c.get("resolvedGuest")

  const program = Effect.gen(function* () {
    // makeAiProvider artık DB'den gelen app'i alıyor
    const provider = yield* makeAiProvider({
      app: resolvedApp,
      user,
      guest,
      modelId: body.model,
      source: c.req.header("x-source") ?? undefined,
    })

    const response = yield* Effect.promise(() =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chrry.ai",
          "X-Title": resolvedApp?.name ?? "Chrry",
        },
        body: JSON.stringify({
          ...body,
          model: provider.config.modelId,
        }),
      }),
    )

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
        // client'a model bilgisini geri ver
        "x-model-id": provider.config.modelId,
        "x-agent-name": provider.config.agentName,
        "x-is-byok": String(provider.config.isBYOK),
      },
    })
  })

  return Effect.runPromise(
    program.pipe(
      Effect.catchTag("NoCreditsError", () =>
        Effect.succeed(c.json({ error: "out_of_credits", code: 402 }, 402)),
      ),
      Effect.catchTag("NoApiKeyError", () =>
        Effect.succeed(c.json({ error: "no_api_key", code: 403 }, 403)),
      ),
      Effect.catchAll((e) => {
        console.error("[ai-proxy]", e)
        return Effect.succeed(c.json({ error: "internal", code: 500 }, 500))
      }),
    ),
  )
})

// ============================================
// EMBEDDINGS
// ============================================

app.post("/v1/embeddings", async (c) => {
  const body = await c.req.json()
  const resolvedApp = c.get("resolvedApp")
  const user = c.get("resolvedUser")
  const guest = c.get("resolvedGuest")

  const program = Effect.gen(function* () {
    const provider = yield* makeAiProvider({
      app: resolvedApp,
      user,
      guest,
    })

    const response = yield* Effect.promise(() =>
      fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          model: "openai/text-embedding-3-small",
        }),
      }),
    )

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  })

  return Effect.runPromise(
    program.pipe(
      Effect.catchAll(() =>
        Effect.succeed(c.json({ error: "embedding_failed" }, 500)),
      ),
    ),
  )
})

export const POST = handle(app)
