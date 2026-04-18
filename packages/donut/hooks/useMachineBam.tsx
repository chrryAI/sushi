/**
 * useMachineBam — XState + bam integration
 *
 * Kills switch(state.value) and state.matches() chains.
 * Machine state names become the bam case keys.
 *
 * Usage:
 *   const { view, send } = useMachineBam(fetchMachine, (snap, send) => ({
 *     idle:    () => <IdleView    onFetch={() => send({ type: "FETCH" })} />,
 *     loading: () => <LoadingView />,
 *     success: () => <SuccessView data={snap.context.data} />,
 *     failure: () => <FailureView onRetry={() => send({ type: "RETRY" })} />,
 *   }))
 *   return view
 *
 * Notes:
 * - cases is a factory fn — closes over snap + send, no stale closures
 * - Only the active state's thunk executes (lazy)
 * - Each case is a named, mutation-testable target
 * - Compound/parallel state values are JSON-serialized as keys
 */

import { useMachine } from "@xstate/react"
import { type ReactNode, useMemo } from "react"
import type { AnyStateMachine, SnapshotFrom } from "xstate"

type Thunk<T> = () => T
type CaseMap<T> = Record<string, Thunk<T>>

export function useMachineBam<M extends AnyStateMachine>(
  machine: M,
  cases: (
    snapshot: SnapshotFrom<M>,
    send: ReturnType<typeof useMachine<M>>[1],
  ) => CaseMap<ReactNode>,
): {
  view: ReactNode
  send: ReturnType<typeof useMachine<M>>[1]
  snapshot: SnapshotFrom<M>
} {
  const [rawSnapshot, send] = useMachine(machine)
  const snapshot = rawSnapshot as unknown as SnapshotFrom<M>

  // Compound/parallel states (object) → serialize as key
  const snapValue = (snapshot as any).value
  const stateKey =
    typeof snapValue === "string" ? snapValue : JSON.stringify(snapValue)

  const view = useMemo(() => {
    const caseMap = cases(snapshot, send)
    const thunk = caseMap[stateKey]
    if (!thunk) {
      console.warn(`[useMachineBam] No case for state: "${stateKey}"`)
      return null
    }
    return thunk()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, JSON.stringify((snapshot as any).context)])

  return { view, send, snapshot }
}

/**
 * createMachineBam — factory: define cases once, call as hook anywhere.
 *
 *   const useFetchView = createMachineBam(fetchMachine, (snap, send) => ({
 *     idle:    () => <IdleView />,
 *     loading: () => <LoadingView />,
 *     success: () => <SuccessView data={snap.context.data} />,
 *     failure: () => <FailureView />,
 *   }))
 *
 *   function FetchWidget() {
 *     const { view } = useFetchView()
 *     return view
 *   }
 */
export function createMachineBam<M extends AnyStateMachine>(
  machine: M,
  cases: (
    snapshot: SnapshotFrom<M>,
    send: ReturnType<typeof useMachine<M>>[1],
  ) => CaseMap<ReactNode>,
) {
  return () => useMachineBam(machine, cases)
}
