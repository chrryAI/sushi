// ============================================
// 3. N8N WORKFLOW JSON — payload-builder.json
// Import this into n8n directly
// ============================================

// ============================================
// 1. XSTATE MACHINE — chopStick payload builder
// packages/ai-core/src/machines/payloadMachine.ts
// ============================================

import { assign, createMachine, fromPromise } from "xstate"
import type { ramen, sushi } from "./types"

type PayloadContext = {
  payload: Partial<ramen>
  resolvedApp: sushi | null
  n8nJobId: string | null
  error: string | null
}

type PayloadEvent =
  | { type: "UPDATE"; patch: Partial<ramen> }
  | { type: "PREVIEW" }
  | { type: "SEND_TO_N8N" }
  | { type: "RESET" }
  | { type: "RETRY" }

export const payloadMachine = createMachine(
  {
    id: "chopStickPayload",
    initial: "idle",
    types: {} as { context: PayloadContext; events: PayloadEvent },
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
            actions: assign(({ context, event }) => ({
              payload: { ...context.payload, ...event.patch },
            })),
          },
          PREVIEW: { target: "previewing" },
          SEND_TO_N8N: { target: "resolving" },
        },
      },

      previewing: {
        // chopStick preview - fast DB call
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
        // full chopStick + send to n8n
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
        // poll or websocket wait for n8n completion
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
        async ({ input }: { input: Partial<ramen> }) => {
          const res = await fetch("/api/ai/chopstick/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          })
          return res.json()
        },
      ),

      sendToN8n: fromPromise(async ({ input }: { input: Partial<ramen> }) => {
        const res = await fetch("/api/n8n-webhook/payload-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: input }),
        })
        return res.json() // { jobId: string }
      }),

      pollN8nJob: fromPromise(
        async ({ input: jobId }: { input: string | null }) => {
          if (!jobId) throw new Error("no jobId")
          // poll every 2s max 30 times
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 2000))
            const res = await fetch(`/api/n8n-webhook/status/${jobId}`)
            const { status } = await res.json()
            if (status === "done") return true
            if (status === "error") throw new Error("n8n job failed")
          }
          throw new Error("timeout")
        },
      ),
    },
  },
)

// ============================================
// 2. ZUSTAND SPATIAL NAV — sadece navigation state
// packages/ai-core/src/stores/spatialNav.ts
// ============================================

import { create } from "zustand"
import { devtools } from "zustand/middleware"

type SpatialNode = {
  app: Pick<sushi, "id" | "slug" | "name" | "icon" | "storeId">
  timestamp: number
  from?: string
  duration?: number
}

type SpatialNavStore = {
  // current cursor
  current: SpatialNode | null
  // back stack
  history: SpatialNode[]
  // forward stack (after going back)
  forward: SpatialNode[]
  // breadcrumbs = history last 3 + current
  breadcrumbs: SpatialNode[]

  // actions
  navigate: (app: SpatialNode["app"]) => void
  goBack: () => void
  goForward: () => void
  reset: () => void
}

export const useSpatialNav = create<SpatialNavStore>()(
  devtools(
    (set, get) => ({
      current: null,
      history: [],
      forward: [],
      breadcrumbs: [],

      navigate: (app) => {
        const { current, history } = get()
        const node: SpatialNode = {
          app,
          timestamp: Date.now(),
          from: current?.app.slug,
        }

        // close out current duration
        const updatedHistory = current
          ? [
              ...history,
              { ...current, duration: Date.now() - current.timestamp },
            ]
          : history

        const next = [...updatedHistory.slice(-20)] // keep last 20

        set({
          current: node,
          history: next,
          forward: [], // clear forward on new navigate
          breadcrumbs: [...next.slice(-3), node],
        })
      },

      goBack: () => {
        const { current, history, forward } = get()
        if (!history.length) return
        const prev = history[history.length - 1]!
        set({
          current: prev,
          history: history.slice(0, -1),
          forward: current ? [current, ...forward] : forward,
          breadcrumbs: history.slice(-3),
        })
      },

      goForward: () => {
        const { current, history, forward } = get()
        if (!forward.length) return
        const next = forward[0]!
        set({
          current: next,
          forward: forward.slice(1),
          history: current ? [...history, current] : history,
          breadcrumbs: [...history.slice(-2), current!, next].filter(Boolean),
        })
      },

      reset: () =>
        set({ current: null, history: [], forward: [], breadcrumbs: [] }),
    }),
    { name: "spatial-nav" },
  ),
)

// selector hooks — kullanımda rerenderı minimize eder
export const useCurrentApp = () => useSpatialNav((s) => s.current)
export const useCanGoBack = () => useSpatialNav((s) => s.history.length > 0)
export const useCanGoFwd = () => useSpatialNav((s) => s.forward.length > 0)
export const useBreadcrumbs = () => useSpatialNav((s) => s.breadcrumbs)
