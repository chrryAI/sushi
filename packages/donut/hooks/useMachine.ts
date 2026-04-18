// ============================================
// 4. REACT HOOK — hepsini birleştiren adapter
// apps/web/src/hooks/usePayloadBuilder.ts
// ============================================

import { payloadMachine } from "@chrryai/ai-core/machines/payloadMachine"
import {
  useCurrentApp,
  useSpatialNav,
} from "@chrryai/ai-core/stores/spatialNav"
import type { ramen } from "@chrryai/donut/types"
import { useMachine } from "@xstate/react"

export function usePayloadBuilder() {
  const [state, send] = useMachine(payloadMachine)
  const { navigate } = useSpatialNav()
  const currentApp = useCurrentApp()

  // spatial nav'dan gelen app'i otomatik payload'a inject et
  const updateFromSpatial = (patch: Partial<ramen>) => {
    if (currentApp) {
      send({
        type: "UPDATE",
        patch: { ...patch, id: currentApp.app.id, slug: currentApp.app.slug },
      })
    } else {
      send({ type: "UPDATE", patch })
    }
  }

  const navigateAndBuild = (
    app: Parameters<typeof navigate>[0],
    patch?: Partial<ramen>,
  ) => {
    navigate(app)
    send({ type: "UPDATE", patch: { id: app.id, slug: app.slug, ...patch } })
  }

  return {
    // XState
    machineState: state.value,
    payload: state.context.payload,
    resolvedApp: state.context.resolvedApp,
    n8nJobId: state.context.n8nJobId,
    error: state.context.error,
    isLoading:
      state.matches("resolving") ||
      state.matches("running") ||
      state.matches("previewing"),
    isDone: state.matches("done"),

    // actions
    update: (patch: Partial<ramen>) => send({ type: "UPDATE", patch }),
    updateFromSpatial,
    preview: () => send({ type: "PREVIEW" }),
    sendToN8n: () => send({ type: "SEND_TO_N8N" }),
    reset: () => send({ type: "RESET" }),
    retry: () => send({ type: "RETRY" }),

    // spatial shortcuts
    navigateAndBuild,
    currentApp,
  }
}

// Kullanım:
// tsx// ChopStickCalculator'da
// const { update, preview, sendToN8n, machineState, isLoading, isDone } = usePayloadBuilder()

// // n8n'e gönder
// <button onClick={sendToN8n} disabled={isLoading}>
//   {machineState === "running" ? "n8n building..." : "Build with n8n"}
// </button>

// // spatial nav - app değişince payload otomatik güncellenir
// const { navigateAndBuild } = usePayloadBuilder()
// navigateAndBuild({ id: "atlas-id", slug: "atlas", name: "Atlas" }, { join: { memories: { user: 5 } } })
// Özet akış: ChopStickCalculator payload üretir → XState SEND_TO_N8N → Hono webhook → n8n Validate → ChopStick resolve → AI Agent prompt builder → Store result → XState running → done. Zustand sadece spatial cursor'ı tutuyor, XState machine state'i tutuyor — ikisi çakışmıyor.
