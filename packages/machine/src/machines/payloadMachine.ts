/**
 * Payload Machine - XState for chopStick payload building
 */

import { assign, createMachine, fromPromise } from "xstate"
import type { App, Ramen } from "../types/index.js"

export interface PayloadContext {
  payload: Partial<Ramen>
  resolvedApp: App | null
  n8nJobId: string | null
  error: string | null
}

export type PayloadEvent =
  | { type: "UPDATE"; patch: Partial<Ramen> }
  | { type: "PREVIEW" }
  | { type: "SEND_TO_N8N" }
  | { type: "RESET" }
  | { type: "RETRY" }

export const payloadMachine = createMachine(
  {
    id: "chopStickPayload",
    initial: "idle",
    types: {} as {
      context: PayloadContext
      events: PayloadEvent
    },
    context: {
      payload: {},
      resolvedApp: null,
      n8nJobId: null,
      error: null,
    },
    states: {
      idle: {
        on: {
          UPDATE: {
            actions: assign({
              payload: ({ context, event }) => ({
                ...context.payload,
                ...event.patch,
              }),
            }),
          },
          PREVIEW: { target: "previewing" },
          SEND_TO_N8N: { target: "resolving" },
        },
      },
      previewing: {
        invoke: {
          src: "resolvePayload",
          input: ({ context }) => context.payload,
          onDone: {
            target: "idle",
            actions: assign({ resolvedApp: ({ event }) => event.output }),
          },
          onError: {
            target: "error",
            actions: assign({ error: ({ event }) => String(event.error) }),
          },
        },
      },
      resolving: {
        invoke: {
          src: "sendToN8n",
          input: ({ context }) => context.payload,
          onDone: {
            target: "running",
            actions: assign({ n8nJobId: ({ event }) => event.output.jobId }),
          },
          onError: {
            target: "error",
            actions: assign({ error: ({ event }) => String(event.error) }),
          },
        },
      },
      running: {
        invoke: {
          src: "pollN8nJob",
          input: ({ context }) => context.n8nJobId,
          onDone: { target: "done" },
          onError: { target: "error" },
        },
        on: {
          RESET: { target: "idle", actions: assign({ n8nJobId: null }) },
        },
      },
      done: {
        on: { RESET: { target: "idle" } },
      },
      error: {
        on: {
          RETRY: { target: "resolving" },
          RESET: { target: "idle", actions: assign({ error: null }) },
        },
      },
    },
  },
  {
    actors: {
      resolvePayload: fromPromise(
        async ({ input }: { input: Partial<Ramen> }) => {
          const res = await fetch("/api/ai/chopstick/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        },
      ),
      sendToN8n: fromPromise(async ({ input }: { input: Partial<Ramen> }) => {
        const res = await fetch("/api/n8n-webhook/payload-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: input }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      }),
      pollN8nJob: fromPromise(
        async ({ input: jobId }: { input: string | null }) => {
          if (!jobId) throw new Error("no jobId")
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 2000))
            const res = await fetch(`/api/n8n-webhook/status/${jobId}`)
            const data = (await res.json()) as { status?: string }
            const { status } = data
            if (status === "done") return true
            if (status === "error") throw new Error("n8n job failed")
          }
          throw new Error("timeout")
        },
      ),
    },
  },
)
