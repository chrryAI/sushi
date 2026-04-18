# MachineRuntime — Base Context Architecture

## Mimari

```
┌─────────────────────────────────────────────────────┐
│  MachineRegistryProvider  (app root'ta, bir kez)    │
│  → Component primitive'lerini register et           │
│  → Agent runtime'da yeni component ekleyebilir      │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│  MachineRuntimeProvider  (per-feature)               │
│  → AI-generated JSON config'i actor'a çevirir       │
│  → DNA context ile sürekli beslenir                  │
│  → State history tutar (AB test, analytics)          │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│  MachineRenderer                                     │
│  → currentState → registry lookup → Component       │
│  → meta.props + propsFrom(context) merge eder       │
│  → Fallback: "component registry'de yok" mesajı     │
└─────────────────────────────────────────────────────┘
```

## Dosyalar

| Dosya                   | Ne yapar                                         |
| ----------------------- | ------------------------------------------------ |
| `MachineRuntime.tsx`    | Context katmanları, renderer, all-in-one wrapper |
| `MutationTestRunner.ts` | AI config'i otomatik test eder                   |
| `example.tsx`           | Kullanım örnekleri, AB test, agent test runner   |

## AI Prompt Contract

AI'a şunu ver, şunu bekle:

### System Prompt

```
Sen bir XState v5 machine config üretiyorsun. Pure JSON döndür, kod yok.

Kurallar:
- Her state'in meta.component alanı şunlardan biri olmalı: ${Object.keys(registry).join(", ")}
- Transitions sadece tanımlı state isimlerini hedef alabilir
- initial state mutlaka states içinde olmalı
- final state'ler type: "final" ile işaretlenmeli

Format:
{
  "id": "string",
  "initial": "string",
  "context": { ...başlangıç değerleri },
  "states": {
    "stateName": {
      "meta": { "component": "RegistryKey", "props": {} },
      "on": { "EVENT_NAME": "targetState" }
    }
  }
}
```

### Validation (runtime'da)

```ts
import { runMutationTests } from "./MutationTestRunner"

const aiOutput = await callAI(prompt)
const config = JSON.parse(aiOutput) as AIMachineConfig

// Deploy öncesi test et
const result = runMutationTests(config, registry)
if (!result.passed) throw new Error(result.summary)

// Geçtiyse render et
return <MachineRuntime machineConfig={config} registry={registry} dnaContext={dna} />
```

## Neden Bu Bedava Test Verir

State machine = pure function:

```ts
machine.transition("idle", "SUBMIT"); // → "loading"
machine.transition("loading", "SUCCESS"); // → "success"
```

- Side-effect yok
- Mock yok
- Test setup yok
- Component render test = state transition test
- 100 state × 50 event = 5000 test, 0 satır test kodu

## AB Test / Versioning

```ts
// Aynı registry, farklı config
<MachineRuntime machineConfig={configA} registry={registry} />
<MachineRuntime machineConfig={configB} registry={registry} />

// onStateChange ile conversion track et
onStateChange={(state) => {
  if (state === "success") analytics.track("conversion", { variant })
}}
```

## DNA Context Akışı

```
chopStick() → dnaContext
     ↓
MachineRuntimeProvider (dnaContext prop)
     ↓
Her component: props.dnaContext
     ↓
{ userName, appId, agentName, featureFlags, ... }
```

## Chrry Entegrasyonu

```ts
// apps/api'den gelen app data'sı direkt dnaContext olur
const app = await chopStick({ id: appId })

const dnaContext = {
  userName: app.user?.userName,
  systemPrompt: app.systemPrompt,
  agentName: app.instructions?.[0]?.agentName,
  memories: app.appMemories,
  // ...
}

// AI agent machine üretir
const config = await generateMachine({ app, dnaContext })

// Render
<MachineRuntime
  machineConfig={config}
  registry={appRegistry}
  dnaContext={dnaContext}
  onStateChange={(state, ctx) => {
    // DNA evolution için besle
    updateDNAThread(app.id, { state, ctx })
  }}
/>
```
