// /**
//  * ÖRNEK KULLANIM
//  *
//  * 1. AI machine config üretir (pure JSON)
//  * 2. MachineRuntime render eder
//  * 3. MutationTestRunner otomatik test eder
//  * 4. Her şey aynı altyapıdan: AB test, versioning, component swap
//  */

// import React from "react"
// import {
//   type AIMachineConfig,
//   type ComponentRegistry,
//   type MachineComponentProps,
//   MachineRegistryProvider,
//   MachineRenderer,
//   MachineRuntime,
//   MachineRuntimeProvider,
//   useMachineRuntime,
// } from "./MachineRuntime"
// import {
//   runMutationTests,
//   runScenarioTests,
//   type ScenarioTest,
// } from "./MutationTestRunner"

// // ─────────────────────────────────────────────────────────────────────────────
// // 1. PRIMITIVE COMPONENT LIBRARY
// // Senin bir kez yazdığın, AI'ın isim verdiği component'ler.
// // ─────────────────────────────────────────────────────────────────────────────

// function LoadingSpinner({ currentState }: MachineComponentProps) {
//   return (
//     <div className="flex items-center gap-2 p-4">
//       <div className="animate-spin w-5 h-5 border-2 border-current rounded-full border-t-transparent" />
//       <span>Loading... ({currentState})</span>
//     </div>
//   )
// }

// function DataForm({
//   send,
//   props,
//   machineContext,
//   dnaContext,
// }: MachineComponentProps) {
//   return (
//     <form
//       onSubmit={(e) => {
//         e.preventDefault()
//         send({ type: "SUBMIT", data: machineContext })
//       }}
//     >
//       <h2>{(props as any).title ?? "Form"}</h2>
//       {/* dnaContext'ten gelen user bilgisi */}
//       <p>Kullanıcı: {(dnaContext as any).userName}</p>
//       <button type="submit">Gönder</button>
//       <button type="button" onClick={() => send("CANCEL")}>
//         İptal
//       </button>
//     </form>
//   )
// }

// function SuccessBanner({ send, props }: MachineComponentProps) {
//   return (
//     <div className="p-4 bg-green-50 border border-green-200 rounded">
//       <h3>{(props as any).message ?? "Başarılı!"}</h3>
//       <button onClick={() => send("RESET")}>Tekrar</button>
//     </div>
//   )
// }

// function ErrorView({ send, machineContext }: MachineComponentProps) {
//   return (
//     <div className="p-4 bg-red-50 border border-red-200 rounded">
//       <h3>Hata oluştu</h3>
//       <p>{(machineContext as any).error ?? "Bilinmeyen hata"}</p>
//       <button onClick={() => send("RETRY")}>Tekrar dene</button>
//     </div>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 2. COMPONENT REGISTRY
// // AI bu isimleri kullanacak. Sadece buraya ekle, her yerde çalışır.
// // ─────────────────────────────────────────────────────────────────────────────

// export const appRegistry: ComponentRegistry = {
//   Loading: LoadingSpinner,
//   Form: DataForm,
//   Success: SuccessBanner,
//   Error: ErrorView,
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 3. AI-GENERATED MACHINE CONFIG (pure JSON)
// // Bu AI'dan gelir — sen yazmıyorsun, validate ediyorsun.
// // ─────────────────────────────────────────────────────────────────────────────

// export const aiGeneratedConfig: AIMachineConfig = {
//   id: "contactForm",
//   initial: "idle",
//   context: {
//     error: null,
//     data: null,
//   },
//   states: {
//     idle: {
//       meta: {
//         component: "Form",
//         props: { title: "Bize Ulaşın" },
//       },
//       on: {
//         SUBMIT: "loading",
//         CANCEL: "idle",
//       },
//     },
//     loading: {
//       meta: { component: "Loading" },
//       on: {
//         SUCCESS: "success",
//         ERROR: "error",
//       },
//     },
//     success: {
//       meta: {
//         component: "Success",
//         props: { message: "Mesajınız alındı!" },
//       },
//       on: {
//         RESET: "idle",
//       },
//     },
//     error: {
//       meta: { component: "Error" },
//       on: {
//         RETRY: "loading",
//         CANCEL: "idle",
//       },
//     },
//   },
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 4. DNA CONTEXT — Dışarıdan sürekli beslenen global data
// // App context, user data, feature flags — hepsi buradan gelir.
// // ─────────────────────────────────────────────────────────────────────────────

// const dnaContext = {
//   userName: "Iliyan",
//   appId: "chrry-main",
//   featureFlags: { abTestVariant: "B" },
//   // getModelProvider'dan gelen agent bilgisi de buraya gelebilir
//   agentName: "beles",
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 5. KULLANIM — En basit hali
// // ─────────────────────────────────────────────────────────────────────────────

// export function ExampleApp() {
//   return (
//     <MachineRuntime
//       machineConfig={aiGeneratedConfig}
//       registry={appRegistry}
//       dnaContext={dnaContext}
//       onStateChange={(state, ctx) => {
//         console.log("[State Change]", state, ctx)
//         // → DNA'ya besle, analytics'e gönder, AB test kaydet
//       }}
//     />
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 6. KULLANIM — Özel children ile (debug panel vb.)
// // ─────────────────────────────────────────────────────────────────────────────

// function DebugPanel() {
//   const { currentState, machineContext, history, machineConfig } =
//     useMachineRuntime()

//   return (
//     <details className="mt-4 text-xs font-mono">
//       <summary>Debug</summary>
//       <pre>
//         {JSON.stringify(
//           { currentState, machineContext, history: history.slice(-5) },
//           null,
//           2,
//         )}
//       </pre>
//     </details>
//   )
// }

// export function ExampleAppWithDebug() {
//   return (
//     <MachineRegistryProvider initialRegistry={appRegistry}>
//       <MachineRuntimeProvider
//         machineConfig={aiGeneratedConfig}
//         dnaContext={dnaContext}
//       >
//         <MachineRenderer />
//         <DebugPanel />
//       </MachineRuntimeProvider>
//     </MachineRegistryProvider>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 7. AB TEST — Aynı altyapı, farklı config
// // ─────────────────────────────────────────────────────────────────────────────

// const configVariantA: AIMachineConfig = aiGeneratedConfig

// const configVariantB: AIMachineConfig = {
//   ...aiGeneratedConfig,
//   id: "contactForm-B",
//   states: {
//     ...aiGeneratedConfig.states,
//     idle: {
//       ...aiGeneratedConfig.states.idle,
//       meta: {
//         component: "Form",
//         props: { title: "Hızlı İletişim" }, // Farklı copy
//       },
//     },
//   },
// }

// export function ABTestExample({ variant }: { variant: "A" | "B" }) {
//   const config = variant === "A" ? configVariantA : configVariantB
//   return (
//     <MachineRuntime
//       machineConfig={config}
//       registry={appRegistry}
//       dnaContext={{ ...dnaContext, abVariant: variant }}
//       onStateChange={(state) => {
//         // Her iki variant'ın conversion'ını ayrı track et
//         console.log(`[AB:${variant}] → ${state}`)
//       }}
//     />
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 8. MUTATION TEST — Agent koşturur, bedava gelir
// // ─────────────────────────────────────────────────────────────────────────────

// // Bu fonksiyonu CI'da veya agent'tan çağır
// export function runAgentTests() {
//   console.log("=== Mutation Test Başlıyor ===\n")

//   // Structural + component test
//   const result = runMutationTests(aiGeneratedConfig, appRegistry)
//   console.log(result.summary)

//   if (result.structural.length > 0) {
//     console.log("\nStructural Issues:")
//     result.structural.forEach((s) =>
//       console.log(`  [${s.severity}] ${s.state}: ${s.description}`),
//     )
//   }

//   if (result.survived.length > 0) {
//     console.log("\nSurvived Mutations (fix these):")
//     result.survived.forEach((s) =>
//       console.log(`  ⚠️ ${s.state}: ${s.description}`),
//     )
//     console.log("  Suggestion:", result.survived[0]?.suggestion)
//   }

//   // Scenario test — tam user flow
//   const scenarios: ScenarioTest[] = [
//     {
//       name: "Happy path: submit → success",
//       events: ["SUBMIT", "SUCCESS"],
//       expectState: "success",
//     },
//     {
//       name: "Error path: submit → error → retry → success",
//       events: ["SUBMIT", "ERROR", "RETRY", "SUCCESS"],
//       expectState: "success",
//     },
//     {
//       name: "Cancel path: submit → error → cancel",
//       events: ["SUBMIT", "ERROR", "CANCEL"],
//       expectState: "idle",
//     },
//     {
//       name: "Reset: success → reset",
//       events: ["SUBMIT", "SUCCESS", "RESET"],
//       expectState: "idle",
//     },
//   ]

//   console.log("\n=== Scenario Tests ===")
//   const scenarioResult = runScenarioTests(aiGeneratedConfig, scenarios)
//   scenarioResult.results.forEach((r) => {
//     const icon = r.passed ? "✅" : "❌"
//     console.log(`${icon} ${r.scenario}`)
//     if (!r.passed) console.log(`   got: ${r.got}, expected: ${r.expected}`)
//   })

//   return {
//     mutationScore: result.score,
//     scenariosPassed: scenarioResult.passed,
//     allPassed: result.passed && scenarioResult.passed,
//   }
// }

// // Direkt çalıştırılabilir (node ile veya agent'tan)
// // runAgentTests()
