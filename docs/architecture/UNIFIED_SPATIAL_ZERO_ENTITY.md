# Unified Spatial-Zero-Entity Architecture (SZEA)

**Code Name:** Tesseract  
**Date:** April 2026  
**Status:** Architecture Proposal — Ready for Review  
**Authors:** Iliyan Velinov, Chrry AI Architecture Team  

---

## 1. The Vision in One Sentence

> The Tesseract architecture fuses the existing **Spatial Navigation System** (patent-pending), **Rocicorp Zero** (already generating drizzle-zero schema), **EntityDB** (browser-side vector embeddings via Transformers.js), and **Real-Time AI Agents** (Sensei, Student, Spatial) into a single cohesive runtime where every pixel, every database row, and every AI thought shares the same 4D coordinate system.

---

## 2. Text-Based System Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CHRRY SPATIAL-ZERO-ENTITY                            ║
║                         Unified Browser Runtime (Tesseract)                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                 SPATIAL NAVIGATION LAYER (Patent-Pending)              │ ║
║  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │ ║
║  │  │  X-AXIS     │   │  Y-AXIS     │   │  Z-AXIS     │                  │ ║
║  │  │  App→App    │   │ Store→Store │   │ Code Depth  │                  │ ║
║  │  │  chrry/vex  │   │ vex.chrry   │   │ .sushi DNA  │                  │ ║
║  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                  │ ║
║  │         └──────────────────┼──────────────────┘                          │ ║
║  │                            ▼                                              │ ║
║  │              ┌─────────────────────────────┐                              │ ║
║  │              │   SPATIAL COORDINATE POOL    │                              │ ║
║  │              │   {x:appId, y:storeId, z:z}  │                              │ ║
║  │              └──────────────┬──────────────┘                              │ ║
║  └─────────────────────────────┼────────────────────────────────────────────┘ ║
║                                │                                              ║
║                                ▼                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                    ROCICORP ZERO SYNC LAYER                             │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ ║
║  │  │  Postgres    │  │  zero-cache  │  │  ZQL Client  │                  │ ║
║  │  │ (Drizzle)    │──│   Server     │──│  (reactive)  │                  │ ║
║  │  └──────────────┘  └──────────────┘  └──────┬───────┘                  │ ║
║  │                                              │                         │ ║
║  │                                              ▼                         │ ║
║  │                              ┌───────────────────┐                     │ ║
║  │                              │  Optimistic Mut.  │                     │ ║
║  │                              │  Instant UI sync  │                     │ ║
║  │                              └───────────────────┘                     │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                │                                              ║
║                                ▼                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                    ENTITYDB VECTOR LAYER                                │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ ║
║  │  │ Transformers │  │  IndexedDB   │  │  WebAssembly │                  │ ║
║  │  │    .js       │──│  Binary Vec  │──│  SIMD Search │                  │ ║
║  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ ║
║  │                                                                             ║
║  │  Capabilities:  Semantic Search | RAG Context | App Memory | Cosine Sim  │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                │                                              ║
║                                ▼                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                   REAL-TIME AI AGENT LAYER                              │ ║
║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │ ║
║  │  │   Sensei    │  │   Student   │  │   Spatial   │                     │ ║
║  │  │ (Architect) │  │  (Coder)    │  │  (Navigator)│                     │ ║
║  │  │ Mutation XP │  │  PR Review  │  │ Route Opt.  │                     │ ║
║  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │ ║
║  │         └─────────────────┼─────────────────┘                            │ ║
║  │                           ▼                                              │ ║
║  │              ┌─────────────────────────────┐                             │ ║
║  │              │   Shared Agent Memory Bus    │                             │ ║
║  │              │   EntityDB + Zero queries    │                             │ ║
║  │              └─────────────────────────────┘                             │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 3. How the Four Systems Interact

### 3.1 Interaction Matrix

| Actor | Touches Spatial | Touches Zero | Touches EntityDB | Touches Agents |
|-------|----------------|--------------|------------------|----------------|
| **User clicks AppLink** | Writes `{x, y, z}` | Reads `apps` table via ZQL | Reads cached embeddings | — |
| **Zero syncs row** | Updates visible coordinates | Source of truth | Indexes new vectors | Triggers agent observer |
| **EntityDB search** | Suggests spatial jumps | — | Local vector compute | Feeds RAG context |
| **Sensei agent** | Mutates `.sushi` depth | Persists mutations | Remembers hotspots | Leads fleet |
| **Student agent** | Reviews `z` axis files | Reads code via ZQL | Embeds PR diff | Follows Sensei |
| **Spatial agent** | Optimizes routes | Reads nav analytics | — | Coordinates agents |

### 3.2 Unified Coordinate System

Every entity in the system carries a **4D coordinate**:

```typescript
// packages/pepper/src/spatial/types.ts
interface SpatialCoordinate {
  x: string    // appId  (e.g., "vex", "atlas")
  y: string    // storeId (e.g., "blossom", "compass")
  z: number    // depth (0=surface, 1=.sushi, 2=mutations, ...)
  t: number    // epoch timestamp (for time-travel queries)
}

interface TesseractEntity {
  id: string
  coord: SpatialCoordinate
  // Zero merges here
  zeroVersion: number
  // EntityDB stores vector here
  embedding?: Float32Array
  // Agent metadata here
  agentMeta?: AgentSpatialMemory
}
```

---

## 4. Data Flow Diagrams

### 4.1 User → Spatial Nav → Zero → Postgres

```
User clicks "Atlas" in navigation bar
         │
         ▼
┌──────────────────────┐
│ 1. AppLink resolves  │
│    spatial target    │
│    {x:"atlas", y:...}│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Spatial hook      │
│    checks Zero cache │
│    for "apps" row    │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │ CACHE HIT │      │ CACHE MISS │
     ▼           │      ▼            │
┌──────────┐    │  ┌─────────────┐  │
│ Render   │    │  │ ZQL query   │  │
│ instantly│    │  │ z.apps.where│  │
└──────────┘    │  │  ("id",x)   │  │
                │  └──────┬──────┘  │
                │         │         │
                │         ▼         │
                │  ┌─────────────┐  │
                │  │ zero-cache  │  │
                │  │ fetches from│  │
                │  │ Postgres LR │  │
                │  └─────────────┘  │
                └───────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ 3. UI receives │
                  │    reactive    │
                  │    ZQL result  │
                  └────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ 4. Zero keeps  │
                  │    subscription│
                  │    open for    │
                  │    future ops  │
                  └────────────────┘
```

### 4.2 User → Agent → EntityDB → Local Memory

```
User sends prompt to Sensei
         │
         ▼
┌─────────────────────────┐
│ 1. Spatial agent reads  │
│    current coordinate   │
│    from SpatialContext  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Query EntityDB for   │
│    relevant memory:     │
│    - past mutations     │
│    - PR reviews         │
│    - similar prompts    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Cosine-similarity    │
│    search over binary   │
│    vectors in IndexedDB │
│    via WASM SIMD        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Agent receives RAG   │
│    context + Zero state │
│    (merged into prompt) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Agent responds +     │
│    persists thought to  │
│    EntityDB (embedding) │
│    AND Zero (mutation)  │
└─────────────────────────┘
```

---

## 5. Specific Integration Points

### 5.1 AppLink + Zero (Replacing SWR for Entity Data)

**Current state:** `apps/chrry/src/server-loader.ts` calls `getApp()` over HTTP; client may SWR-cache apps.

**Target state:** AppLink reads from Zero's local ZQL cache; network only on cache miss.

```typescript
// apps/chrry/src/components/Spatial/AppLink.tsx
import { useQuery, useZero } from "@rocicorp/zero/react"
import { useSpatial } from "packages/pepper/src/hooks/useSpatial"

interface AppLinkProps {
  targetAppId: string
  targetStoreId?: string
  children: React.ReactNode
}

export function AppLink({ targetAppId, children }: AppLinkProps) {
  const z = useZero()
  const { currentCoord, navigate } = useSpatial()

  // ZERO replaces SWR for entity data
  const [app] = useQuery(
    z.query.apps
      .where("id", targetAppId)
      .related("store")
      .one()
  )

  // Memory-cached resolution; no network if Zero already hydrated
  const handleClick = () => {
    navigate({
      x: targetAppId,
      y: app?.storeId ?? currentCoord.y,
      z: 0,
    })
  }

  // URL morphing preserved from patent spec
  const href = app?.domain
    ? `https://${app.domain}`
    : `/${app?.slug ?? targetAppId}`

  return (
    <a href={href} onClick={(e) => { e.preventDefault(); handleClick() }}>
      {children}
    </a>
  )
}
```

**What SWR keeps:** Auth/session, aggregate analytics, stripe checkout sessions — anything that is ephemeral or compute-heavy server-side.

**Migration rule of thumb:**

| Data Type | Before (SWR) | After (Zero) |
|-----------|-------------|--------------|
| `apps`, `stores` | `useSWR('/api/apps')` | `z.query.apps` |
| `threads`, `messages` | `useSWR('/api/threads')` | `z.query.threads` |
| `user` (auth) | `useSWR('/api/session')` | **Keep SWR** |
| `credits` (aggregate) | `useSWR('/api/credits')` | **Keep SWR** |
| `analytics` | `useSWR('/api/analytics')` | **Keep SWR** |

---

### 5.2 Agent Memory Persistence in EntityDB

Agents require a memory substrate that survives page reloads, works offline, and supports semantic retrieval. EntityDB is that substrate.

```typescript
// packages/entitydb/src/agentMemory.ts
import { EntityDB } from "@babycommando/entity-db"
import { pipeline } from "@xenova/transformers"

interface AgentMemoryBlock {
  id: string
  agentId: "sensei" | "student" | "spatial"
  coord: SpatialCoordinate
  content: string          // raw thought / mutation / review
  embedding: Float32Array  // 384-dim binary vector
  tags: string[]
  timestamp: number
}

const db = new EntityDB<AgentMemoryBlock>("agent-memory", {
  vectorPath: "embedding",
  similarity: "cosine",
  // WASM SIMD acceleration
  wasmPath: "/wasm/entitydb-simd.wasm",
})

const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2"
)

export async function remember(
  block: Omit<AgentMemoryBlock, "embedding">
): Promise<void> {
  const output = await embedder(block.content, { pooling: "mean", normalize: true })
  const embedding = new Float32Array(output.data)
  await db.insert({ ...block, embedding })
}

export async function recall(
  agentId: string,
  query: string,
  coord?: SpatialCoordinate,
  k = 5
): Promise<AgentMemoryBlock[]> {
  const output = await embedder(query, { pooling: "mean", normalize: true })
  const q = new Float32Array(output.data)

  const results = await db.similaritySearch(q, k, {
    filter: (doc) =>
      doc.agentId === agentId &&
      (!coord || (doc.coord.x === coord.x && doc.coord.y === coord.y)),
  })

  return results
}
```

**EntityDB schema in the browser:**

```typescript
// packages/entitydb/src/schema.ts
export const entityDbSchema = {
  // Core spatial memory
  agentMemory: {
    vectorPath: "embedding" as const,
    fields: ["agentId", "coord.x", "coord.y", "tags", "timestamp"],
  },
  // RAG chunks for local LLM context
  ragChunks: {
    vectorPath: "embedding" as const,
    fields: ["source", "coord.z", "timestamp"],
  },
  // App-specific local cache (mirrors Zero but for offline search)
  appSearch: {
    vectorPath: "embedding" as const,
    fields: ["appId", "storeId", "description"],
  },
} as const
```

---

### 5.3 DNA Threading Connected to Zero Mutations

The `.sushi` directory (Z-axis) is both a filesystem artifact and a database mutation log. Zero is the authoritative replication layer.

```typescript
// packages/machine/src/schema.ts (existing drizzle schema extension)
export const dnaMutations = pgTable("dna_mutations", {
  id: text("id").primaryKey(),
  appId: text("app_id").notNull(),
  storeId: text("store_id").notNull(),
  path: text("path").notNull(),          // e.g., ".sushi/mutations/2026-01-21.json"
  severity: integer("severity"),         // 1-10
  killed: boolean("killed").default(false),
  authorAgent: text("author_agent"),     // "sensei" | "student" | "human"
  diff: jsonb("diff"),
  visualProofUrl: text("visual_proof_url"),
  createdOn: timestamp("created_on").defaultNow(),
})

// Zero syncs this table automatically via drizzle-zero generated schema
```

**How DNA threading works with Zero:**

```typescript
// packages/pepper/src/spatial/DnaThread.ts
import { useQuery, useZero } from "@rocicorp/zero/react"

export function useDnaThread(appId: string) {
  const z = useZero()

  // Live, reactive thread of mutations for this app
  const mutations = useQuery(
    z.query.dnaMutations
      .where("appId", appId)
      .orderBy("createdOn", "desc")
      .related("visualProof")
  )

  // Optimistic mutation: Sensei proposes a new mutation
  const proposeMutation = (diff: MutationDiff) => {
    z.mutate.dnaMutations.insert({
      id: crypto.randomUUID(),
      appId,
      path: `.sushi/mutations/${ Date.now() }.json`,
      severity: scoreSeverity(diff),
      killed: false,
      authorAgent: "sensei",
      diff,
    })
  }

  return { mutations, proposeMutation }
}
```

**File-system mirroring:** a small Node/Bun watcher (`apps/scripts/dna-sync.ts`) writes committed Zero mutations back to `.sushi/mutations/` so that `git` sees them and the file tree stays human-readable.

---

### 5.4 Spatial Coordinates Mapped to Zero Queries

Every `{x, y, z}` tuple can be turned into a constrained ZQL query range.

```typescript
// packages/pepper/src/spatial/coordToQuery.ts
import { Query } from "@rocicorp/zero"

function coordToQuery<T extends Record<string, unknown>>(
  coord: SpatialCoordinate,
  baseQuery: Query<T>
): Query<T> {
  switch (coord.z) {
    case 0: // surface — user-visible apps & stores
      return baseQuery
        .where("appId", coord.x)
        .where("storeId", coord.y)
        .where("visibility", "public")
    case 1: // .sushi — project metadata, DNA
      return baseQuery
        .where("appId", coord.x)
        .where("storeId", coord.y)
        .where("category", "dna")
    case 2: // mutations — test results, code diffs
      return baseQuery
        .where("appId", coord.x)
        .where("storeId", coord.y)
        .where("category", "mutation")
    case 3: // agents — xp, levels, memory pointers
      return baseQuery
        .where("appId", coord.x)
        .where("storeId", coord.y)
        .where("category", "agent")
    default:
      return baseQuery.where("appId", coord.x)
  }
}

// Usage inside a React component
const { currentCoord } = useSpatial()
const z = useZero()
const entities = useQuery(
  coordToQuery(currentCoord, z.query.entities)
)
```

---

## 6. Migration Path from Current SWR-Heavy Architecture

### Phase 1: Foundation (Weeks 1–2)

| Task | Owner | Files |
|------|-------|-------|
| Ensure `zero-cache` server is deployed (`infra/docker/docker-compose.local.yml` add service) | Infra | `infra/docker/docker-compose.*.yml` |
| Generate full Zero schema from Drizzle via existing `drizzle-zero` pipeline | Platform | `packages/machine/zero-schema.gen.ts` (already exists!) |
| Add `@rocicorp/zero` to `apps/chrry` and `apps/extension` | Frontend | `apps/chrry/package.json` |

### Phase 2: Seed EntityDB (Weeks 2–3)

| Task | Owner | Files |
|------|-------|-------|
| Create `@chrryai/entitydb` package wrapping `@babycommando/entity-db` + Transformers.js | Agent | `packages/entitydb/` |
| Pre-compute embeddings for all `apps` and `stores` during build | Build | `packages/entitydb/scripts/seed.ts` |
| Ship WASM SIMD blob as static asset | Build | `apps/chrry/public/wasm/` |

### Phase 3: AppLink Zero Migration (Weeks 3–4)

| Task | Owner | Files |
|------|-------|-------|
| Rewrite `AppLink.tsx` to read from Zero instead of HTTP | Frontend | `apps/chrry/src/components/Spatial/AppLink.tsx` |
| Add `useSpatial` hook that binds coordinate → Zero query | Frontend | `packages/pepper/src/hooks/useSpatial.ts` |
| Keep SWR for auth/session; mark entity hooks as `@deprecated` | Frontend | incremental |

### Phase 4: Agent Onboarding (Weeks 4–6)

| Task | Owner | Files |
|------|-------|-------|
| Port Sensei mutation loop to write via Zero mutations | Agent | `packages/agent/src/sensei/`
| Port Student PR review to read `.sushi` via Zero | Agent | `packages/agent/src/student/`
| Add Spatial agent route-optimizer that queries nav analytics | Agent | `packages/agent/src/spatial/` |

### Phase 5: Production Hardening (Weeks 6–8)

| Task | Owner | Files |
|------|-------|-------|
| Add `zero-cache` to production Docker Compose | Infra | `infra/docker/docker-compose.yml` |
| Configure Postgres logical replication slots | Infra | Postgres `wal_level = logical` |
| Monitor ZQL subscription cardinality (avoid N+1) | Ops | Grafana |

---

## 7. Proposed File Structure

```
sushi/
├── apps/
│   ├── chrry/
│   │   src/
│   │   ├── components/
│   │   │   └── Spatial/
│   │   │       ├── AppLink.tsx          # Zero-backed app router
│   │   │       ├── SpatialOverlay.tsx   # Same-tab iframe/shadow DOM
│   │   │       └── NavigationBar.tsx    # X/Y-axis button morphing
│   │   ├── hooks/
│   │   │   └── useSpatialNav.ts        # Combines Zero + SpatialContext
│   │   └── entry-client.tsx            # Hydrates Zero + Spatial providers
│   │
│   ├── extension/
│   │   src/
│   │   └── spatial/
│   │       └── ExtensionAppLink.tsx    # URL morphing in MV3 context
│   │
│   └── agent/                          # NEW: browser-run agent orchestrator
│       src/
│       ├── agents/
│       │   ├── sensei/
│       │   │   ├── index.ts            # Mutation-strike loop
│       │   │   ├── levelSystem.ts      # XP → Yellow → Green
│       │   │   └── hotspots.ts         # Z-axis priority scoring
│       │   ├── student/
│       │   │   ├── index.ts            # PR review worker
│       │   │   └── coverage.ts         # Spatial file coverage metric
│       │   └── spatial/
│       │       ├── index.ts            # Route optimizer
│       │       └── navigator.ts        # Spatial coordinate planner
│       ├── memory/
│       │   ├── entityDb.ts             # @babycommando/entity-db adapter
│       │   └── zeroBridge.ts           # Two-way Zero ↔ EntityDB sync
│       └── index.ts                    # Agent runtime scheduler
│
├── packages/
│   ├── pepper/                         # Universal router (existing)
│   │   src/
│   │   ├── hooks/
│   │   │   └── useSpatial.ts           # Coordinate provider hook
│   │   ├── spatial/
│   │   │   ├── types.ts                # SpatialCoordinate, TesseractEntity
│   │   │   ├── coordToQuery.ts         # {x,y,z} → ZQL mapper
│   │   │   └── resolver.ts             # Domain ↔ coordinate resolution
│   │   └── index.ts
│   │
│   ├── entitydb/                       # NEW: browser vector DB abstraction
│   │   src/
│   │   ├── index.ts                    # EntityDB factory
│   │   ├── schema.ts                   # Typed schema definitions
│   │   ├── embeddings.ts               # Transformers.js pipeline manager
│   │   ├── agentMemory.ts              # Sensei/Student/Spatial memory API
│   │   └── wasm/
│   │       └── simdBridge.ts           # WebAssembly SIMD acceleration
│   │
│   ├── machine/                        # Existing AI orchestration
│   │   src/
│   │   ├── zero-schema.gen.ts          # Already generated by drizzle-zero
│   │   └── ai/
│   │       └── agents/
│   │           └── tesseract.ts        # NEW: unified agent context
│   │
│   └── vault/                          # Drizzle ORM + schema (existing)
│       src/
│       ├── schema.ts                   # Add dnaMutations + agentXP tables
│       └── ai/
│           └── vault/
│               └── zeroMutations.ts    # Helpers for Zero optimistic writes
│
├── infra/
│   └── docker/
│       ├── docker-compose.local.yml    # Add zero-cache service
│       └── zero-cache/
│           └── Dockerfile              # Rocicorp zero-cache image
│
└── docs/
    └── architecture/
        └── UNIFIED_SPATIAL_ZERO_ENTITY.md   # This document
```

---

## 8. Key Risks and Mitigations

### Risk 1: Zero Subscription Storm (Performance)

**Problem:** Every `AppLink` and every agent observer opens a ZQL subscription. At 1000 concurrent users with 10 ZQL queries each, the WebSocket fan-out could overwhelm `zero-cache`.

**Mitigation:**
- Use ZQL **one()** instead of **where+all** when possible.
- Coalesce subscriptions: the `useSpatial` hook at the root level subscribes to `apps` + `stores` once and pushes them into React Context; child components read context instead of opening new subscriptions.
- Paginate deep Z-axis queries (`.sushi/mutations`) with `limit` + `start`.

```typescript
// Coalesced root subscription (packages/pepper/src/hooks/useSpatial.ts)
const rootSub = z.query.apps
  .related("store")
  .related("dnaMutations", (q) => q.limit(50)) // capped
```

### Risk 2: EntityDB Cold Start (Embedding Latency)

**Problem:** Transformers.js model download (~80–200 MB) on first page load blocks agent readiness.

**Mitigation:**
- Ship a **tiny quantized model** (`Xenova/all-MiniLM-L6-v2` quantized to 4-bit, ~30 MB) as a lazily-loaded worker.
- Warm up the pipeline during the idle period after initial paint.
- Provide a server-side fallback: if EntityDB is cold, hit the `/api/semantic-search` route (existing server embeddings via `pgvector`) and backfill EntityDB asynchronously.

### Risk 3: Z-Axis Mutation Log Growth (Storage)

**Problem:** `.sushi/mutations/` and the `dnaMutations` table grow indefinitely.

**Mitigation:**
- Implement a **DNA compression** pass: after 1000 mutations, archive old rows to cold S3 storage and replace them with a single `epoch` checkpoint row.
- The filesystem watcher only keeps the last 100 `.sushi/mutations/*.json` files; older ones are moved to `.sushi/mutations/archive/`.

### Risk 4: Offline-First Data Divergence

**Problem:** Zero supports optimistic mutations, but agents may act on stale EntityDB memory after coming back online.

**Mitigation:**
- Every EntityDB row carries an `epoch` field aligned with Zero's `zeroVersion`.
- Before an agent acts, it checks `epoch` against the current Zero sync head. If `delta > 5`, the agent pauses and waits for sync.

```typescript
// packages/entitydb/src/syncGuard.ts
export async function syncGuard(requiredVersion: number): Promise<void> {
  const current = await getZeroSyncHead()
  if (current - requiredVersion > 5) {
    await waitForSync(current)
  }
}
```

### Risk 5: Cross-Platform Agent Memory (Extension vs. Web PWA)

**Problem:** `apps/extension` runs in a service-worker context where IndexedDB and WASM SIMD access are limited.

**Mitigation:**
- EntityDB runs in an **offscreen document** (Chrome MV3) or a **sandboxed iframe** (Firefox).
- Agents communicate with EntityDB via `chrome.runtime.postMessage`.
- Tesseract detects the environment and degrades gracefully: if WASM is unavailable, fall back to pure JS cosine similarity (slower but functional).

---

## 9. Evolutionary Principles (Not a Rewrite)

| Principle | How We Apply It |
|-----------|-----------------|
| **Keep existing routes** | `server-loader.ts` continues to SSR; Zero hydrates client-side. |
| **Drizzle stays king** | `packages/machine/schema.ts` is still the source of truth; `drizzle-zero` generates from it. |
| **SWR doesn't die** | Auth, session, credits, and server aggregates remain SWR. |
| **.sushi stays real** | Filesystem watcher mirrors Zero mutations; git history is untouched. |
| **Component reuse** | The existing `AppLink` from `packages/donut` is wrapped, not replaced. |
| **Build pipeline** | `MODE=vex` and polymorphic builds are unchanged; Zero schema is pre-generated at build time. |

---

## 10. 30-Second Summary for Stakeholders

1. **What changes for users?** App switching becomes instant because apps are cached locally via Zero. AI agents remember context across sessions because EntityDB persists semantic memory in the browser.
2. **What changes for developers?** We introduce two new packages (`@chrryai/entitydb`, `packages/agent`) and rewrite `AppLink` to read from Zero. Everything else stays.
3. **What changes for DevOps?** We add a `zero-cache` container to Docker Compose and enable Postgres logical replication.
4. **What's the payoff?** Sub-50ms app switching, offline-capable AI agents, and a patented spatial navigation system that actually has a local reactive database underneath it instead of HTTP round-trips.

---

*End of Document*

_Document Version: 1.0_  
_Last Updated: April 18, 2026_  
_Author: Iliyan Velinov_  
_System: Chrry AI / Sushi Monorepo / Tesseract Architecture_
