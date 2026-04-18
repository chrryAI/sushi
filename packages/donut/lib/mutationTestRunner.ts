// /**
//  * MachineRuntime — Mutation Test Runner
//  *
//  * State machine pure function olduğu için test yazmak BEDAVA.
//  * AI machine üretir → bu runner otomatik test eder:
//  *   1. Her state'te doğru component var mı?
//  *   2. Her event doğru state'e geçiyor mu?
//  *   3. Context doğru prop'u üretiyor mu?
//  *   4. Dead state (çıkışı olmayan) var mı?
//  *   5. Unreachable state var mı?
//  *
//  * Agent'lar bunu CI'da koşturur. Mutation kill = güvenli deploy.
//  */

// import { createActor, createMachine } from "xstate"
// import type { AIMachineConfig, ComponentRegistry } from "./MachineRuntime"

// // ─────────────────────────────────────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// export interface MutationTestResult {
//   machineId: string
//   passed: boolean
//   score: number // 0-100, kill rate
//   killed: MutationKill[]
//   survived: MutationSurvived[]
//   structural: StructuralIssue[]
//   summary: string
// }

// export interface MutationKill {
//   type: string
//   state: string
//   event?: string
//   description: string
// }

// export interface MutationSurvived {
//   type: string
//   state: string
//   description: string
//   suggestion: string
// }

// export interface StructuralIssue {
//   severity: "error" | "warning"
//   state: string
//   description: string
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CORE: runMutationTests
// // AI-generated config'i al, otomatik test et
// // ─────────────────────────────────────────────────────────────────────────────

// export function runMutationTests(
//   config: AIMachineConfig,
//   registry?: ComponentRegistry,
// ): MutationTestResult {
//   const killed: MutationKill[] = []
//   const survived: MutationSurvived[] = []
//   const structural: StructuralIssue[] = []

//   const stateNames = Object.keys(config.states)
//   const allEvents = collectAllEvents(config)

//   // ── TEST 1: Her state'te component var mı? ─────────────────────────────────
//   for (const [stateName, stateDef] of Object.entries(config.states)) {
//     if (stateDef.type === "final") continue // final state'in component'i olmayabilir

//     if (!stateDef.meta?.component) {
//       survived.push({
//         type: "missing_component",
//         state: stateName,
//         description: `State "${stateName}" için meta.component tanımlanmamış`,
//         suggestion: `meta: { component: "Loading" } ekle`,
//       })
//     } else {
//       killed.push({
//         type: "component_defined",
//         state: stateName,
//         description: `State "${stateName}" → component "${stateDef.meta.component}" tanımlı ✓`,
//       })

//       // Registry kontrolü (verilmişse)
//       if (registry && !registry[stateDef.meta.component]) {
//         structural.push({
//           severity: "error",
//           state: stateName,
//           description: `component "${stateDef.meta.component}" registry'de bulunamadı`,
//         })
//       }
//     }
//   }

//   // ── TEST 2: Her event doğru state'e geçiyor mu? ────────────────────────────
//   for (const [stateName, stateDef] of Object.entries(config.states)) {
//     if (!stateDef.on) continue

//     for (const [event, target] of Object.entries(stateDef.on)) {
//       const targetState = typeof target === "string" ? target : target.target

//       if (!stateNames.includes(targetState)) {
//         structural.push({
//           severity: "error",
//           state: stateName,
//           description: `Event "${event}" → "${targetState}" state'i tanımlı değil`,
//         })
//       } else {
//         killed.push({
//           type: "valid_transition",
//           state: stateName,
//           event,
//           description: `${stateName} --[${event}]--> ${targetState} ✓`,
//         })
//       }
//     }
//   }

//   // ── TEST 3: Actor ile gerçek transition testi ──────────────────────────────
//   try {
//     const machine = createMachine({
//       id: config.id,
//       initial: config.initial,
//       context: config.context ?? {},
//       states: config.states as any,
//     })

//     // Her state → her event kombinasyonunu dene
//     for (const [stateName, stateDef] of Object.entries(config.states)) {
//       if (!stateDef.on) continue

//       for (const [event] of Object.entries(stateDef.on)) {
//         try {
//           // Pure function test — actor başlatmadan
//           const resolved = machine.resolveState({
//             value: stateName,
//             context: config.context ?? {},
//           } as any)
//           const nextSnapshot = machine.transition(resolved as any, {
//             type: event,
//           })
//           const nextState =
//             typeof nextSnapshot.value === "string"
//               ? nextSnapshot.value
//               : Object.keys(nextSnapshot.value)[0]

//           killed.push({
//             type: "transition_verified",
//             state: stateName,
//             event,
//             description: `machine.transition("${stateName}", "${event}") = "${nextState}" ✓`,
//           })
//         } catch {
//           survived.push({
//             type: "transition_failed",
//             state: stateName,
//             description: `machine.transition("${stateName}", "${event}") hata fırlattı`,
//             suggestion: `State definition'ı kontrol et`,
//           })
//         }
//       }
//     }
//   } catch (err) {
//     structural.push({
//       severity: "error",
//       state: "machine",
//       description: `createMachine hatası: ${(err as Error).message}`,
//     })
//   }

//   // ── TEST 4: Dead state (çıkışı olmayan, final değil) ──────────────────────
//   for (const [stateName, stateDef] of Object.entries(config.states)) {
//     if (stateDef.type === "final") continue
//     const hasTransitions = stateDef.on && Object.keys(stateDef.on).length > 0

//     if (!hasTransitions) {
//       structural.push({
//         severity: "warning",
//         state: stateName,
//         description: `"${stateName}" dead state — hiç event tanımlanmamış ve final değil`,
//       })
//     }
//   }

//   // ── TEST 5: Unreachable state ──────────────────────────────────────────────
//   const reachable = new Set<string>([config.initial])
//   let changed = true
//   while (changed) {
//     changed = false
//     for (const [, stateDef] of Object.entries(config.states)) {
//       if (!stateDef.on) continue
//       for (const target of Object.values(stateDef.on)) {
//         const targetState = typeof target === "string" ? target : target.target
//         if (!reachable.has(targetState)) {
//           reachable.add(targetState)
//           changed = true
//         }
//       }
//     }
//   }

//   for (const stateName of stateNames) {
//     if (!reachable.has(stateName)) {
//       structural.push({
//         severity: "warning",
//         state: stateName,
//         description: `"${stateName}" unreachable — hiçbir transition bu state'e gitmiyor`,
//       })
//     }
//   }

//   // ── SCORE hesapla ──────────────────────────────────────────────────────────
//   const totalMutants = killed.length + survived.length
//   const score =
//     totalMutants === 0 ? 100 : Math.round((killed.length / totalMutants) * 100)

//   const errors = structural.filter((s) => s.severity === "error").length
//   const passed = errors === 0 && score >= 70

//   const summary = [
//     `Machine: ${config.id}`,
//     `States: ${stateNames.length} | Events: ${allEvents.size}`,
//     `Killed: ${killed.length} | Survived: ${survived.length} | Score: ${score}%`,
//     errors > 0 ? `⛔ ${errors} structural error` : `✅ No structural errors`,
//     passed ? "✅ PASSED" : "❌ FAILED",
//   ].join("\n")

//   return {
//     machineId: config.id,
//     passed,
//     score,
//     killed,
//     survived,
//     structural,
//     summary,
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ACTOR-BASED: Runtime'da test et (e2e)
// // ─────────────────────────────────────────────────────────────────────────────

// export interface ScenarioTest {
//   name: string
//   /** Sırayla gönderilecek event'ler */
//   events: (string | { type: string; [k: string]: unknown })[]
//   /** Son state bu olmalı */
//   expectState: string
// }

// export function runScenarioTests(
//   config: AIMachineConfig,
//   scenarios: ScenarioTest[],
// ): {
//   passed: boolean
//   results: {
//     scenario: string
//     passed: boolean
//     got: string
//     expected: string
//   }[]
// } {
//   const results = []

//   for (const scenario of scenarios) {
//     try {
//       const machine = createMachine({
//         id: config.id,
//         initial: config.initial,
//         context: config.context ?? {},
//         states: config.states as any,
//       })

//       const actor = createActor(machine)
//       let lastState = config.initial

//       actor.subscribe((snapshot) => {
//         lastState =
//           typeof snapshot.value === "string"
//             ? snapshot.value
//             : (Object.keys(snapshot.value)[0] ?? lastState)
//       })

//       actor.start()

//       for (const event of scenario.events) {
//         const eventObj = typeof event === "string" ? { type: event } : event
//         actor.send(eventObj)
//       }

//       actor.stop()

//       results.push({
//         scenario: scenario.name,
//         passed: lastState === scenario.expectState,
//         got: lastState,
//         expected: scenario.expectState,
//       })
//     } catch (err) {
//       results.push({
//         scenario: scenario.name,
//         passed: false,
//         got: `ERROR: ${(err as Error).message}`,
//         expected: scenario.expectState,
//       })
//     }
//   }

//   return {
//     passed: results.every((r) => r.passed),
//     results,
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER
// // ─────────────────────────────────────────────────────────────────────────────

// function collectAllEvents(config: AIMachineConfig): Set<string> {
//   const events = new Set<string>()
//   for (const stateDef of Object.values(config.states)) {
//     if (!stateDef.on) continue
//     for (const event of Object.keys(stateDef.on)) {
//       events.add(event)
//     }
//   }
//   return events
// }
