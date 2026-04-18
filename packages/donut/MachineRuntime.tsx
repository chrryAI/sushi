/**
 * MachineRuntime — Base Context Architecture
 *
 * Katmanlar:
 *  1. MachineRegistryProvider  → Primitive component'leri bir kez register et
 *  2. MachineRuntimeProvider   → AI-generated machine config'i çalıştır, context besle
 *  3. MachineRenderer          → Aktif state'e göre component'i render et
 *  4. useMachineRuntime        → Herhangi bir child'dan state/send/context erişimi
 *
 * AI sadece JSON üretiyor. Runtime, render, test — hepsi bu dosyadan.
 */

import {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createActor, createMachine } from "xstate"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** AI'ın üreteceği machine config — pure JSON, kod yok */
export interface AIMachineConfig {
  id: string
  initial: string
  context?: Record<string, unknown>
  states: Record<
    string,
    {
      on?: Record<string, string | { target: string; actions?: string[] }>
      meta?: {
        component: string // Registry'deki key
        props?: Record<string, unknown>
        // Dynamic props: context'ten hesaplanır
        propsFrom?: (ctx: Record<string, unknown>) => Record<string, unknown>
      }
      type?: "final" | "parallel"
    }
  >
}

/** Her component, bu props'ları alır — standart kontrat */
export interface MachineComponentProps<
  TContext = Record<string, unknown>,
  TProps = Record<string, unknown>,
> {
  /** Aktif XState context */
  machineContext: TContext
  /** Event gönder */
  send: (event: string | { type: string; [k: string]: unknown }) => void
  /** Aktif state adı */
  currentState: string
  /** State-specific props (meta.props veya propsFrom) */
  props: TProps
  /** DNA context — dışarıdan beslenen global data */
  dnaContext: Record<string, unknown>
}

export type MachineComponent = ComponentType<MachineComponentProps>

/** Component registry — primitive'leri bir kez tanımla */
export type ComponentRegistry = Record<string, MachineComponent>

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — REGISTRY CONTEXT
// Tüm uygulamada bir kez mount edilir. Agent'lar buraya yeni component ekleyebilir.
// ─────────────────────────────────────────────────────────────────────────────

interface RegistryContextValue {
  registry: ComponentRegistry
  register: (key: string, component: MachineComponent) => void
}

const RegistryContext = createContext<RegistryContextValue | null>(null)

export function MachineRegistryProvider({
  initialRegistry = {},
  children,
}: {
  initialRegistry?: ComponentRegistry
  children: ReactNode
}) {
  const [registry, setRegistry] = useState<ComponentRegistry>(initialRegistry)

  const register = useCallback((key: string, component: MachineComponent) => {
    setRegistry((prev) => ({ ...prev, [key]: component }))
  }, [])

  return (
    <RegistryContext.Provider value={{ registry, register }}>
      {children}
    </RegistryContext.Provider>
  )
}

export function useRegistry() {
  const ctx = useContext(RegistryContext)
  if (!ctx) throw new Error("useRegistry: MachineRegistryProvider eksik")
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — RUNTIME CONTEXT
// AI-generated config'i actor'a çevirir. DNA context ile sürekli beslenir.
// ─────────────────────────────────────────────────────────────────────────────

interface RuntimeContextValue {
  /** Aktif XState state adı */
  currentState: string
  /** XState context (machine'in internal data'sı) */
  machineContext: Record<string, unknown>
  /** Event gönder */
  send: (event: string | { type: string; [k: string]: unknown }) => void
  /** Aktif state'in meta bilgisi */
  activeMeta: AIMachineConfig["states"][string]["meta"] | undefined
  /** DNA context — dışarıdan beslenen global data */
  dnaContext: Record<string, unknown>
  /** Machine config (debug/test için) */
  machineConfig: AIMachineConfig
  /** State geçiş geçmişi (AB test, analytics için) */
  history: string[]
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null)

export function MachineRuntimeProvider({
  machineConfig,
  dnaContext = {},
  onStateChange,
  onError,
  children,
}: {
  machineConfig: AIMachineConfig
  /** Dışarıdan sürekli beslenen global context — DNA, user, app data */
  dnaContext?: Record<string, unknown>
  onStateChange?: (state: string, context: Record<string, unknown>) => void
  onError?: (error: Error) => void
  children: ReactNode
}) {
  const [currentState, setCurrentState] = useState<string>(
    machineConfig.initial,
  )
  const [machineContext, setMachineContext] = useState<Record<string, unknown>>(
    machineConfig.context ?? {},
  )
  const [history, setHistory] = useState<string[]>([machineConfig.initial])
  const actorRef = useRef<ReturnType<typeof createActor> | null>(null)

  // Machine'i oluştur ve başlat
  useEffect(() => {
    try {
      // AI config'ini XState'e uygun formata çevir
      const machine = createMachine({
        id: machineConfig.id,
        initial: machineConfig.initial,
        context: machineConfig.context ?? {},
        states: Object.fromEntries(
          Object.entries(machineConfig.states).map(([stateName, stateDef]) => [
            stateName,
            {
              on: stateDef.on
                ? Object.fromEntries(
                    Object.entries(stateDef.on).map(([event, target]) => [
                      event,
                      typeof target === "string" ? { target } : target,
                    ]),
                  )
                : undefined,
              meta: stateDef.meta,
              type: stateDef.type,
            },
          ]),
        ),
      })

      const actor = createActor(machine)

      actor.subscribe((snapshot) => {
        const stateName =
          typeof snapshot.value === "string"
            ? snapshot.value
            : (Object.keys(snapshot.value)[0] ?? machineConfig.initial)

        setCurrentState(stateName)
        setMachineContext(snapshot.context as Record<string, unknown>)
        setHistory((prev) => [...prev, stateName])
        onStateChange?.(stateName, snapshot.context as Record<string, unknown>)
      })

      actor.start()
      actorRef.current = actor

      return () => {
        actor.stop()
        actorRef.current = null
      }
    } catch (err) {
      onError?.(err as Error)
    }
  }, [machineConfig.id]) // Sadece ID değişince yeniden oluştur

  const send = useCallback(
    (event: string | { type: string; [k: string]: unknown }) => {
      if (!actorRef.current) return
      const eventObj = typeof event === "string" ? { type: event } : event
      actorRef.current.send(eventObj)
    },
    [],
  )

  const activeMeta = machineConfig.states[currentState]?.meta

  return (
    <RuntimeContext.Provider
      value={{
        currentState,
        machineContext,
        send,
        activeMeta,
        dnaContext,
        machineConfig,
        history,
      }}
    >
      {children}
    </RuntimeContext.Provider>
  )
}

export function useMachineRuntime() {
  const ctx = useContext(RuntimeContext)
  if (!ctx) throw new Error("useMachineRuntime: MachineRuntimeProvider eksik")
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — RENDERER
// Aktif state → component lookup → render. Fallback dahil.
// ─────────────────────────────────────────────────────────────────────────────

export function MachineRenderer({
  fallback,
  loadingComponent: LoadingComponent,
}: {
  /** Registry'de bulunamazsa gösterilir */
  fallback?: ReactNode
  /** Component yüklenirken gösterilir (lazy load için) */
  loadingComponent?: ComponentType
}) {
  const { currentState, machineContext, send, activeMeta, dnaContext } =
    useMachineRuntime()
  const { registry } = useRegistry()

  const Component = activeMeta?.component
    ? registry[activeMeta.component]
    : undefined

  const resolvedProps = useMemo(() => {
    const staticProps = activeMeta?.props ?? {}
    const dynamicProps = activeMeta?.propsFrom?.(machineContext) ?? {}
    return { ...staticProps, ...dynamicProps }
  }, [activeMeta, machineContext])

  if (!Component) {
    if (fallback) return <>{fallback}</>
    return (
      <div style={{ padding: "1rem", opacity: 0.5, fontFamily: "monospace" }}>
        <small>
          [{currentState}] → "{activeMeta?.component ?? "?"}" registry'de yok
        </small>
      </div>
    )
  }

  return (
    <Component
      machineContext={machineContext}
      send={send}
      currentState={currentState}
      props={resolvedProps}
      dnaContext={dnaContext}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4 — ALL-IN-ONE WRAPPER
// Tek component ile tüm sistemi kur. Genellikle bu kullanılır.
// ─────────────────────────────────────────────────────────────────────────────

export function MachineRuntime({
  machineConfig,
  registry,
  dnaContext,
  onStateChange,
  onError,
  fallback,
  children,
}: {
  machineConfig: AIMachineConfig
  registry?: ComponentRegistry
  dnaContext?: Record<string, unknown>
  onStateChange?: (state: string, ctx: Record<string, unknown>) => void
  onError?: (error: Error) => void
  fallback?: ReactNode
  /** Registry + renderer dışında ek child render etmek için */
  children?: ReactNode
}) {
  return (
    <MachineRegistryProvider initialRegistry={registry}>
      <MachineRuntimeProvider
        machineConfig={machineConfig}
        dnaContext={dnaContext}
        onStateChange={onStateChange}
        onError={onError}
      >
        <MachineRenderer fallback={fallback} />
        {children}
      </MachineRuntimeProvider>
    </MachineRegistryProvider>
  )
}
