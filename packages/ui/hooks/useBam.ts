/**
 * bam — Functional case-selection system
 *
 * Three layers:
 *
 * 1. bam()        — pure function, no React, fully testable
 * 2. useBam()     — React hook for context-driven rendering
 * 3. useMachineBam() — XState integration: machine states → render cases
 *                      Kills switch(state.value) and state.matches() chains entirely.
 *
 * Every case is a lazy thunk (() => JSX) — only the selected one executes.
 * This makes every branch an explicit, named, mutation-testable target.
 */

import { useMemo } from "react"

type Thunk<T> = () => T
type CaseMap<K extends string, T> = Record<K, Thunk<T>>

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Pure bam — no React, no hooks, fully unit-testable.
 * Executes the thunk for the determined case.
 */
export function bam<K extends string, T, Ctx>(
  ctx: Ctx,
  cases: CaseMap<K, T>,
  determine: (ctx: Ctx) => K,
): T {
  const key = determine(ctx)
  const thunk = cases[key]
  if (!thunk) throw new Error(`[bam] Unknown case: "${String(key)}"`)
  return thunk()
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * useBam — memoized bam for React components.
 * Re-runs only when ctx changes (deep via JSON.stringify).
 */
export function useBam<K extends string, T, Ctx>(
  ctx: Ctx,
  cases: CaseMap<K, T>,
  determine: (ctx: Ctx) => K,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bam(ctx, cases, determine), [JSON.stringify(ctx)])
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createBam — define cases + determiner once, call with context anywhere.
 *
 *   const appView = createBam(cases, determine)
 *   return appView({ user, guest })          // component
 *   expect(appView({ user: null })).toBe(…)  // test
 */
export function createBam<K extends string, T, Ctx>(
  cases: CaseMap<K, T>,
  determine: (ctx: Ctx) => K,
) {
  return (ctx: Ctx): T => bam(ctx, cases, determine)
}
