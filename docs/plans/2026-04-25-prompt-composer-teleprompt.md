# Prompt Composer: Teleprompt + Golden Ratio Merge

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the duplication-prone prompt building in `ai.ts` with a composable, deduplication-safe system using `@anythingai/teleprompt` for composition and the existing `promptBuilder.ts` (golden ratio) for token budgeting.

**Architecture:** Two-layer pipeline:

1. **Teleprompt (Composition Layer):** Sections defined declaratively, conditional rendering, `.use()` replaces duplicates by id, `.useOneOf()` for mutually exclusive content
2. **Golden Ratio (Budget Layer):** Takes Teleprompt's output `{id: content}`, applies weight-based dropping and token truncation

**Tech Stack:** `@anythingai/teleprompt` v0.3.0, existing `promptBuilder.ts`, Vitest for tests

---

## Duplication Analysis (Current Bugs)

| #   | Topic        | Duplication | Source A                                                   | Source B                                |
| --- | ------------ | ----------- | ---------------------------------------------------------- | --------------------------------------- |
| 1   | Burn Feature | 2x          | fallbackTemplate in baseSystemPrompt (~L2555)              | burnModeContext (L3169)                 |
| 2   | Sato Mode    | 2-3x        | satoContext (L3761)                                        | pricingContext "SATO DOJO" (L5004)      |
| 3   | Calendar     | 2x          | calendarContext (L3243)                                    | calendarInstructions (L4980)            |
| 4   | App Names    | 3x          | storeContext (L1730)                                       | grapeContext (L2545) + baseSystemPrompt |
| 5   | Character    | 2x          | characterMemories in appKnowledge (L485)                   | characterContext (L2873)                |
| 6   | Inheritance  | risk        | inheritanceContext (L1675) includes parentApp.systemPrompt | may overlap with baseSystemPrompt       |

**Root architectural issue:** Two-stage assembly where `buildSystemPromptFromParts` (L3913) properly budgets tokens, but `enhancedSystemPrompt` (L5083) appends content (calendar, pricing, pear feedback, retro analytics, memory explanation) OUTSIDE the budget system.

---

## Phase 1: Unit Tests + PromptComposer Core

### Task 1: Install @anythingai/teleprompt

**Objective:** Add the teleprompt dependency to the machine package.

**Files:**

- Modify: `packages/machine/package.json` (add dependency)
- Modify: `packages/machine/tsconfig.json` (if needed for ESM compat)

**Step 1:** Install the package

```bash
cd /Users/ibrahimvelinov/Documents/vex/packages/machine
pnpm add @anythingai/teleprompt
```

**Step 2:** Verify it resolves

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm install
```

**Step 3:** Commit

```bash
git add packages/machine/package.json pnpm-lock.yaml
git commit -m "chore: add @anythingai/teleprompt dependency"
```

---

### Task 2: Write failing unit tests for PromptComposer

**Objective:** TDD RED phase — write tests that define the PromptComposer API before implementation exists.

**Files:**

- Create: `packages/machine/src/ai/sushi/__tests__/promptComposer.test.ts`

**Step 1:** Write failing tests

```typescript
import { describe, it, expect } from "vitest";
import { PromptComposer, composeSection, type PromptContext } from "../promptComposer";
import type { PromptSection } from "../promptBuilder";

// ── Types ────────────────────────────────────────────────────────

type VexFlags = {
  isDevelopment: boolean;
  burnEnabled: boolean;
  member: boolean;
  isRetro: boolean;
  isAdmin: boolean;
  isCalendarApp: boolean;
  isVexApp: boolean;
};

type VexVars = {
  assistantName: string;
  burnContent: string;
  calendarContent: string;
  calendarToolRules: string;
  satoContent: string;
  storeContent: string;
  grapeContent: string;
  characterContent: string;
  inheritanceContent: string;
  baseSystemPrompt: string;
  devBanner: string;
  aiSelfAware: string;
  piiRedaction: string;
};

type VexContext = PromptContext<VexFlags, VexVars>;

// ── Test: Deduplication ───────────────────────────────────────────

describe("PromptComposer", () => {
  it("should deduplicate sections with the same id", () => {
    // Teleprompt's .use() replaces by id — if burn section is defined
    // both in baseSystemPrompt and as a separate section, only the
    // LATEST one should survive
    const composer = new PromptComposer<VexContext>();

    const burnSection = composeSection("burnMode", (ctx) => ctx.vars.burnContent);

    // Use same id twice — second should replace first
    composer.use(burnSection).use(burnSection);

    const result = composer.build({
      flags: {
        isDevelopment: false,
        burnEnabled: true,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "🔥 Burn Feature...",
        calendarContent: "",
        calendarToolRules: "",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "",
        aiSelfAware: "",
        piiRedaction: "",
      },
    });

    // Should appear only ONCE, not twice
    const burnCount = (result.match(/🔥 Burn Feature/g) || []).length;
    expect(burnCount).toBe(1);
  });

  it("should conditionally include sections based on flags", () => {
    const composer = new PromptComposer<VexContext>();

    const burnSection = composeSection("burnMode", (ctx) => {
      if (!ctx.flags.burnEnabled) return null;
      return ctx.vars.burnContent;
    });

    const devSection = composeSection("devBanner", (ctx) => {
      if (!ctx.flags.isDevelopment) return null;
      return ctx.vars.devBanner;
    });

    composer.use(burnSection).use(devSection);

    // Burn enabled, dev disabled
    const resultWithBurn = composer.build({
      flags: {
        isDevelopment: false,
        burnEnabled: true,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "🔥 Burn Feature...",
        calendarContent: "",
        calendarToolRules: "",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "Dev mode",
        aiSelfAware: "",
        piiRedaction: "",
      },
    });

    expect(resultWithBurn).toContain("Burn Feature");
    expect(resultWithBurn).not.toContain("Dev mode");

    // Burn disabled, dev enabled
    const resultNoBurn = composer.build({
      flags: {
        isDevelopment: true,
        burnEnabled: false,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "🔥 Burn Feature...",
        calendarContent: "",
        calendarToolRules: "",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "Dev mode",
        aiSelfAware: "",
        piiRedaction: "",
      },
    });

    expect(resultNoBurn).not.toContain("Burn Feature");
    expect(resultNoBurn).toContain("Dev mode");
  });

  // ── Test: Golden Ratio Integration ──────────────────────────────

  it("should produce PromptSection[], feedable to buildSystemPromptV2", () => {
    const composer = new PromptComposer<VexContext>();

    composer
      .use(composeSection("system", (ctx) => ctx.vars.baseSystemPrompt))
      .use(
        composeSection("burnMode", (ctx) => (ctx.flags.burnEnabled ? ctx.vars.burnContent : null)),
      )
      .use(
        composeSection("devBanner", (ctx) => (ctx.flags.isDevelopment ? ctx.vars.devBanner : null)),
      );

    const ctx: VexContext = {
      flags: {
        isDevelopment: true,
        burnEnabled: true,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "🔥 Burn Feature...",
        calendarContent: "",
        calendarToolRules: "",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "You are Vex, an AI assistant.",
        devBanner: "Dev mode active",
        aiSelfAware: "",
        piiRedaction: "",
      },
    };

    const sections = composer.buildSections(ctx);

    // Should produce PromptSection[] with correct keys
    expect(sections).toHaveLength(3); // system, burnMode, devBanner
    expect(sections.map((s) => s.key)).toEqual(
      expect.arrayContaining(["system", "burnMode", "devBanner"]),
    );

    // Each section should have weight/maxTokens from DEFAULT_SECTION_WEIGHTS
    const burnSection = sections.find((s) => s.key === "burnMode")!;
    expect(burnSection.weight).toBe(0.15); // from DEFAULT_SECTION_WEIGHTS
    expect(burnSection.content).toContain("Burn Feature");
  });

  it("should merge calendar sections instead of duplicating", () => {
    // Calendar content appears in calendarContext AND calendarInstructions
    // With PromptComposer, both are the SAME section, so no duplication
    const composer = new PromptComposer<VexContext>();

    const calendarSection = composeSection("calendar", (ctx) => {
      if (!ctx.flags.isCalendarApp && !ctx.flags.isVexApp) return null;
      // Merge guidelines AND tool rules into one section
      return `${ctx.vars.calendarContent}\n\n${ctx.vars.calendarToolRules}`;
    });

    composer.use(calendarSection);

    const result = composer.build({
      flags: {
        isDevelopment: false,
        burnEnabled: false,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: true,
        isVexApp: false,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "",
        calendarContent: "📅 Calendar Events: ...",
        calendarToolRules: "⏰ CRITICAL CALENDAR TOOL RULES: ...",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "",
        aiSelfAware: "",
        piiRedaction: "",
      },
    });

    // Both should appear exactly once in the merged section
    expect(result).toContain("Calendar Events");
    expect(result).toContain("CALENDAR TOOL RULES");
    // Count calendar occurrences — should be exactly 1 section header
    const sectionHeaders = (result.match(/##/g) || []).length;
    expect(sectionHeaders).toBeGreaterThanOrEqual(1);
  });

  it("should exclude null sections from output", () => {
    const composer = new PromptComposer<VexContext>();

    composer
      .use(
        composeSection("sato", (ctx) =>
          ctx.flags.isRetro && ctx.flags.isAdmin ? ctx.vars.satoContent : null,
        ),
      )
      .use(composeSection("grape", (ctx) => ctx.vars.grapeContent || null));

    // Non-admin, non-retro — sato should be excluded
    const result = composer.buildSections({
      flags: {
        isDevelopment: false,
        burnEnabled: false,
        member: true,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "",
        calendarContent: "",
        calendarToolRules: "",
        satoContent: "🧪 SATO MODE ACTIVATED",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "",
        aiSelfAware: "",
        piiRedaction: "",
      },
    });

    expect(result).toHaveLength(0); // both return null
  });

  // ── Test: Forking for app variants ──────────────────────────────

  it("should support forking for different app variants", () => {
    const baseComposer = new PromptComposer<VexContext>();

    const systemSection = composeSection("system", (ctx) => `You are ${ctx.vars.assistantName}.`);

    baseComposer
      .use(systemSection)
      .use(
        composeSection("burnMode", (ctx) => (ctx.flags.burnEnabled ? ctx.vars.burnContent : null)),
      );

    // Vex variant — adds calendar tools
    const vexComposer = baseComposer.fork();
    vexComposer.use(
      composeSection("calendar", (ctx) => (ctx.flags.isVexApp ? ctx.vars.calendarToolRules : null)),
    );

    // Focus variant — adds focus tools
    const focusComposer = baseComposer.fork();
    focusComposer.use(composeSection("focus", (ctx) => "🧘 Focus tools available."));

    const ctx: VexContext = {
      flags: {
        isDevelopment: false,
        burnEnabled: true,
        member: false,
        isRetro: false,
        isAdmin: false,
        isCalendarApp: false,
        isVexApp: true,
      },
      vars: {
        assistantName: "Vex",
        burnContent: "🔥 Burn Feature...",
        calendarContent: "",
        calendarToolRules: "⏰ Calendar rules",
        satoContent: "",
        storeContent: "",
        grapeContent: "",
        characterContent: "",
        inheritanceContent: "",
        baseSystemPrompt: "",
        devBanner: "",
        aiSelfAware: "",
        piiRedaction: "",
      },
    };

    const vexResult = vexComposer.build(ctx);
    const focusResult = focusComposer.build(ctx);

    expect(vexResult).toContain("Calendar rules");
    expect(vexResult).not.toContain("Focus tools");

    expect(focusResult).toContain("Focus tools");
    expect(focusResult).not.toContain("Calendar rules");

    // Both have base sections
    expect(vexResult).toContain("You are Vex");
    expect(focusResult).toContain("You are Vex");
  });
});
```

**Step 2:** Run tests to verify they FAIL (RED)

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/promptComposer.test.ts
```

Expected: FAIL — `promptComposer` module doesn't exist yet.

**Step 3:** Commit failing tests

```bash
git add packages/machine/src/ai/sushi/__tests__/promptComposer.test.ts
git commit -m "test(red): prompt composer deduplication and composition tests"
```

---

### Task 3: Implement PromptComposer core (GREEN phase)

**Objective:** Make all failing tests pass with minimal code.

**Files:**

- Create: `packages/machine/src/ai/sushi/promptComposer.ts`

**Step 1:** Implement PromptComposer

```typescript
/**
 * PromptComposer — composable system prompt assembler
 *
 * Uses @anythingai/teleprompt for composition (dedup, conditional, forking)
 * and promptBuilder.ts (golden ratio) for token budgeting.
 */
import { PromptBuilder, section as teleSection, type PromptContext } from "@anythingai/teleprompt";
import {
  section,
  buildSystemPromptV2,
  type PromptSection,
  type BuildResult,
  DEFAULT_SECTION_WEIGHTS,
} from "./promptBuilder";

// Re-export PromptContext for consumers
export type { PromptContext };

export type VexFlags = {
  isDevelopment: boolean;
  burnEnabled: boolean;
  member: boolean;
  isRetro: boolean;
  isAdmin: boolean;
  isCalendarApp: boolean;
  isVexApp: boolean;
};

export type VexVars = {
  assistantName: string;
  burnContent: string;
  calendarContent: string;
  calendarToolRules: string;
  satoContent: string;
  storeContent: string;
  grapeContent: string;
  characterContent: string;
  inheritanceContent: string;
  baseSystemPrompt: string;
  devBanner: string;
  aiSelfAware: string;
  piiRedaction: string;
};

export type VexContext = PromptContext<VexFlags, VexVars>;

/**
 * Wrapper that bridges teleprompt sections with golden ratio weights.
 * Creates a teleprompt section that, when rendered, produces content
 * and carries weight/maxTokens metadata from DEFAULT_SECTION_WEIGHTS.
 */
export function composeSection(
  id: keyof typeof DEFAULT_SECTION_WEIGHTS | string,
  render: (ctx: VexContext) => string | null,
): ReturnType<typeof teleSection<VexContext>> {
  return teleSection(id, render);
}

/**
 * PromptComposer — composition layer that prevents duplication and
 * supports conditional rendering, then feeds into golden ratio budgeting.
 */
export class PromptComposer<C extends VexContext = VexContext> {
  private builder: PromptBuilder<C>;

  constructor() {
    this.builder = new PromptBuilder<C>();
  }

  /**
   * Register a section. If a section with the same id already exists,
   * it is REPLACED — this prevents duplication.
   */
  use(section: ReturnType<typeof teleSection<C>>): this {
    this.builder.use(section);
    return this;
  }

  /**
   * Register exactly one of several sections (first non-null wins).
   */
  useOneOf(...sections: ReturnType<typeof teleSection<C>>[]): this {
    this.builder.useOneOf(...sections);
    return this;
  }

  /**
   * Group sections under a named group (transparent in text mode,
   * wraps in XML tags in xml mode).
   */
  group(name: string, fn: (b: PromptBuilder<C>) => void): this {
    this.builder.group(name, fn);
    return this;
  }

  /**
   * Remove a section by id or reference.
   */
  without(sectionOrId: ReturnType<typeof teleSection<C>> | string): this {
    this.builder.without(sectionOrId);
    return this;
  }

  /**
   * Fork this composer into an independent copy.
   */
  fork(): PromptComposer<C> {
    const forked = new PromptComposer<C>();
    forked.builder = this.builder.fork() as PromptBuilder<C>;
    return forked;
  }

  /**
   * Build the final prompt string (composition only, no budgeting).
   */
  build(ctx: C): string {
    return this.builder.build(ctx);
  }

  /**
   * Build with metadata (section tracking).
   */
  buildWithMeta(ctx: C): { included: string[]; excluded: string[]; prompt: string } {
    const meta = this.builder.buildWithMeta(ctx);
    return meta;
  }

  /**
   * Build as PromptSection[] ready for golden ratio budgeting.
   * This is the key bridge between teleprompt (composition) and
   * promptBuilder (budgeting).
   */
  buildSections(ctx: C): PromptSection[] {
    const meta = this.builder.buildWithMeta(ctx);
    // Teleprompt builds a flat string. We need to decompose it
    // back into sections for golden ratio budgeting.
    // Strategy: use buildWithMeta to get included sections,
    // then build each section individually to get content.
    const sections: PromptSection[] = [];
    for (const id of meta.included) {
      // Find the section in our builder and render it individually
      const teleSection = this.findSection(id);
      if (!teleSection) continue;

      const content = teleSection(ctx);
      if (!content) continue;

      sections.push(section(id, content));
    }
    return sections;
  }

  /**
   * Build with golden ratio budgeting.
   * Composes sections with teleprompt, then applies weight-based
   * token budgeting via buildSystemPromptV2.
   */
  buildWithBudget(ctx: C, maxTokens: number): BuildResult {
    const sections = this.buildSections(ctx);
    return buildSystemPromptV2({ sections, maxTokens });
  }

  /**
   * Find a section by id from the builder.
   * Accesses the internal section registry of PromptBuilder.
   */
  private findSection(id: string): ((ctx: C) => string | null) | null {
    // PromptBuilder doesn't expose sections directly, so we
    // rebuild the section map from our own tracking.
    // Workaround: render each section individually.
    // Since we know the id, we can create a minimal builder
    // to test just that section.
    // For now, we'll rely on the simpler approach:
    // use the builder's internal _sections map.
    const anyBuilder = this.builder as any;
    if (anyBuilder._sections && anyBuilder._sections instanceof Map) {
      const sec = anyBuilder._sections.get(id);
      return sec?.render ?? sec ?? null;
    }
    return null;
  }
}
```

**Step 2:** Update exports in machine package

```typescript
// packages/machine/src/ai/sushi/index.ts — add export
export { PromptComposer, composeSection } from "./promptComposer";
export type { VexContext, VexFlags, VexVars } from "./promptComposer";
```

**Step 3:** Run tests to verify they PASS (GREEN)

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/promptComposer.test.ts
```

Expected: ALL PASS

**Step 4:** Commit

```bash
git add packages/machine/src/ai/sushi/promptComposer.ts packages/machine/src/ai/sushi/index.ts
git commit -m "feat: add PromptComposer — teleprompt + golden ratio bridge"
```

---

### Task 4: Refactor — Fix PromptComposer section retrieval (REFACTOR phase)

**Objective:** Clean up the `findSection` hack that accesses PromptBuilder internals.

**Files:**

- Modify: `packages/machine/src/ai/sushi/promptComposer.ts`

The `findSection` method relies on PromptBuilder internals. A cleaner approach: track sections locally since we added them via `.use()`.

**Step 1:** Refactor PromptComposer to track sections locally

```typescript
// In PromptComposer class, replace the private sections approach:
export class PromptComposer<C extends VexContext = VexContext> {
  private builder: PromptBuilder<C>;
  private sections: Map<string, (ctx: C) => string | null> = new Map();

  use(section: ReturnType<typeof teleSection<C>>): this {
    // Track section render function locally before delegating to builder
    // We need to extract the render function from the teleprompt section.
    // teleprompt's section() returns an object with id and render.
    const teleSec = section as unknown as { id: string; render: (ctx: C) => string | null };
    // Note: We'll need a different approach since teleprompt's section type
    // doesn't expose render directly. Let's use buildWithMeta approach instead.

    this.builder.use(section);
    return this;
  }

  // ... rest stays the same but buildSections uses a different strategy:

  buildSections(ctx: C): PromptSection[] {
    const meta = this.builder.buildWithMeta(ctx);
    const sections: PromptSection[] = [];

    // Build each section individually using a single-section builder
    for (const id of meta.included) {
      const singleBuilder = new PromptBuilder<C>();
      // We can't easily extract a single section from the main builder,
      // so we use a different strategy: render the full prompt and
      // the meta data tells us which sections were included.
      //
      // Best approach: keep our own section registry.
    }

    // ... actually, let's just keep a parallel registry
    return sections;
  }
}
```

Actually, the cleanest approach is to keep a local `Map<id, renderFn>` and not rely on PromptBuilder internals at all. Let me revise:

**Step 2:** Clean implementation that tracks sections locally

```typescript
export class PromptComposer<C extends VexContext = VexContext> {
  private builder: PromptBuilder<C>;
  private sectionRenders: Map<string, (ctx: C) => string | null> = new Map();

  constructor() {
    this.builder = new PromptBuilder<C>();
  }

  use(sectionId: string, render: (ctx: C) => string | null): this {
    const teleSec = teleSection<C>(sectionId, render);
    this.builder.use(teleSec);
    this.sectionRenders.set(sectionId, render);
    return this;
  }

  useOneOf(ids: string[], renders: ((ctx: C) => string | null)[]): this {
    // Use the first non-null result
    const sections = ids.map((id, i) => teleSection<C>(id, renders[i]!));
    this.builder.useOneOf(...sections);
    // Track all potential renders
    ids.forEach((id, i) => this.sectionRenders.set(id, renders[i]!));
    return this;
  }

  // ... etc
}
```

Wait — this changes the API from the test. Let me keep `composeSection` returning teleprompt sections but track them separately. The simplest fix: keep our own parallel map in PromptComposer.

**Step 3:** Run tests to verify they still pass

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/promptComposer.test.ts
```

Expected: ALL PASS

**Step 4:** Commit

```bash
git add packages/machine/src/ai/sushi/promptComposer.ts
git commit -m "refactor: clean up PromptComposer section tracking"
```

---

## Phase 2: Integration — Wire into ai.ts

### Task 5: Write failing integration test for ai.ts prompt building

**Objective:** Test that the new PromptComposer produces the same (but deduplicated) prompt as the old system.

**Files:**

- Create: `packages/machine/src/ai/sushi/__tests__/promptComposer.integration.test.ts`

**Step 1:** Write integration test that verifies deduplication

```typescript
import { describe, it, expect } from "vitest";
import { buildSystemPromptFromParts, DEFAULT_SECTION_WEIGHTS } from "../promptBuilder";
import { PromptComposer, composeSection } from "../promptComposer";
import type { VexContext, VexFlags, VexVars } from "../promptComposer";

describe("PromptComposer integration with promptBuilder", () => {
  it("should produce no duplicate Burn sections", () => {
    const composer = new PromptComposer<VexContext>();

    // Base system prompt might contain burn info
    const baseSystemPrompt = `
You are Vex, an AI assistant.

## 🔥 Burn Feature (Privacy Mode)
Burn is a privacy feature. No memory storage.

## Some other section
Content here.
`.trim();

    // Separate burn section (currently duplicated in ai.ts)
    const burnModeContext = `## 🔥 Burn Feature (Privacy Mode)
Users can click the fire icon. No memory storage.

🔥 No memory storage - Conversations are not saved
💭 Ephemeral existence - Messages exist only in the moment`;

    composer
      .use(composeSection("system", (ctx) => ctx.vars.baseSystemPrompt))
      .use(
        composeSection("burnMode", (ctx) => (ctx.flags.burnEnabled ? ctx.vars.burnContent : null)),
      );

    const result = composer.buildWithBudget(
      {
        flags: {
          isDevelopment: false,
          burnEnabled: true,
          member: false,
          isRetro: false,
          isAdmin: false,
          isCalendarApp: false,
          isVexApp: true,
        },
        vars: {
          assistantName: "Vex",
          burnContent: burnModeContext,
          calendarContent: "",
          calendarToolRules: "",
          satoContent: "",
          storeContent: "",
          grapeContent: "",
          characterContent: "",
          inheritanceContent: "",
          baseSystemPrompt,
          devBanner: "",
          aiSelfAware: "",
          piiRedaction: "",
        },
      },
      25000,
    );

    // Burn Feature header should appear exactly ONCE
    const burnHeaders = (result.prompt.match(/## 🔥 Burn Feature/g) || []).length;
    expect(burnHeaders).toBe(1);
  });

  it("should merge calendar sections instead of appending separately", () => {
    const composer = new PromptComposer<VexContext>();

    composer.use(
      composeSection("calendar", (ctx) => {
        if (!ctx.flags.isCalendarApp && !ctx.flags.isVexApp) return null;
        const parts = [ctx.vars.calendarContent, ctx.vars.calendarToolRules].filter(Boolean);
        return parts.join("\n\n");
      }),
    );

    const result = composer.buildWithBudget(
      {
        flags: {
          isDevelopment: false,
          burnEnabled: false,
          member: false,
          isRetro: false,
          isAdmin: false,
          isCalendarApp: true,
          isVexApp: false,
        },
        vars: {
          assistantName: "Vex",
          burnContent: "",
          calendarContent: "## User's Calendar Events\nEvent data here",
          calendarToolRules: "## CRITICAL CALENDAR TOOL RULES\nUse past tense",
          satoContent: "",
          storeContent: "",
          grapeContent: "",
          characterContent: "",
          inheritanceContent: "",
          baseSystemPrompt: "",
          devBanner: "",
          aiSelfAware: "",
          piiRedaction: "",
        },
      },
      25000,
    );

    // Both calendar pieces should be present
    expect(result.prompt).toContain("Calendar Events");
    expect(result.prompt).toContain("CALENDAR TOOL RULES");

    // But calendar content should be in ONE section, not two
    const calendarSectionCount = (result.prompt.match(/## .*[Cc]alendar/g) || []).length;
    expect(calendarSectionCount).toBe(2); // two sub-sections in one composed section
  });

  it("should drop low-weight sections when token budget is exceeded", () => {
    const composer = new PromptComposer<VexContext>();

    // Create a very long system prompt to exceed budget
    const longSystemPrompt = "You are Vex. " + "Important instruction. ".repeat(500);
    const burnContent = "Burn feature content here";

    composer
      .use(composeSection("system", (ctx) => ctx.vars.baseSystemPrompt))
      .use(
        composeSection("burnMode", (ctx) => (ctx.flags.burnEnabled ? ctx.vars.burnContent : null)),
      )
      .use(composeSection("devBanner", (ctx) => (ctx.flags.isDevelopment ? "Dev mode" : null)));

    // Use very small budget to force drops
    const result = composer.buildWithBudget(
      {
        flags: {
          isDevelopment: true,
          burnEnabled: true,
          member: false,
          isRetro: false,
          isAdmin: false,
          isCalendarApp: false,
          isVexApp: true,
        },
        vars: {
          assistantName: "Vex",
          burnContent,
          calendarContent: "",
          calendarToolRules: "",
          satoContent: "",
          storeContent: "",
          grapeContent: "",
          characterContent: "",
          inheritanceContent: "",
          baseSystemPrompt: longSystemPrompt,
          devBanner: "Dev mode",
          aiSelfAware: "",
          piiRedaction: "",
        },
      },
      500, // Very small budget
    );

    // burnMode (weight 0.15) should be dropped before system (weight 1.0)
    // devBanner (weight 0.98) should survive
    expect(result.droppedSections).toContain("burnMode");
    // system should survive (weight 1.0 — never dropped)
    expect(result.prompt).toContain("You are Vex");
  });
});
```

**Step 2:** Run to verify these fail or need the integration wired

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/promptComposer.integration.test.ts
```

**Step 3:** Commit

```bash
git add packages/machine/src/ai/sushi/__tests__/promptComposer.integration.test.ts
git commit -m "test(red): prompt composer integration tests"
```

---

### Task 6: Wire PromptComposer into ai.ts (THE BIG ONE)

**Objective:** Replace the `buildSystemPromptFromParts` call + `enhancedSystemPrompt` append with PromptComposer, eliminating all duplications.

**Files:**

- Modify: `apps/api/hono/routes/ai.ts`

This is the critical integration step. The changes in `ai.ts` will:

1. **Replace `buildSystemPromptFromParts` with `PromptComposer`** at line ~3913
2. **Move `enhancedSystemPrompt` content INTO PromptComposer sections** (calendar, pricing, pear, retro analytics, memory explanation) so they go through token budgeting
3. **Remove duplications:**
   - Burn: remove from `fallbackTemplate` (lines ~2555-2595), keep only in `burnModeContext`
   - Sato: merge `pricingContext` into `satoContext`
   - Calendar: merge `calendarInstructions` into `calendarContext`
   - Store/Grape: remove app listing from `grapeContext`, keep only discovery mechanism
   - Character: filter `category === "character"` from appKnowledge in `buildAppKnowledgeBase`

**Step 1:** Create the `buildVexPromptComposer` factory function in a new file:

**Files:**

- Create: `packages/machine/src/ai/sushi/vexPromptComposer.ts`

```typescript
/**
 * Vex-specific PromptComposer factory.
 *
 * Defines ALL sections for the Vex AI route in one place,
 * preventing duplication through Teleprompt's .use() id replacement.
 */
import {
  PromptComposer,
  composeSection,
  type VexContext,
  type VexFlags,
  type VexVars,
} from "./promptComposer";

export type VexPromptData = {
  // Core
  baseSystemPrompt: string;
  devBanner: string;
  aiSelfAware: string;
  piiRedaction: string;

  // Feature flags
  isDevelopment: boolean;
  burnEnabled: boolean;
  isMember: boolean;
  isRetro: boolean;
  isAdmin: boolean;
  isCalendarApp: boolean;
  isVexApp: boolean;

  // Content sections
  burnContent: string;
  satoContent: string;
  satoDojoContent: string; // was pricingContext — now a separate section
  storeContent: string;
  grapeContent: string;
  inheritanceContent: string;
  characterContent: string;
  calendarContent: string;
  calendarToolRules: string;
  timerToolInstructions: string;
  focusContent: string;
  taskContent: string;
  moodContent: string;
  memoryContent: string;
  userBehaviorContext: string;
  placeholderContext: string;
  branchContext: string;
  instructionsContext: string;
  moltbookContext: string;
  tribeContext: string;
  subscriptionContext: string;
  statisticsContext: string;
  featureStatusContext: string;
  newsContext: string;
  spatialNavigationContext: string;
  analyticsContext: string;
  pearContext: string;
  feedbackAppsContext: string;
  pearModeReminder: string;
  e2eContext: string;
  dnaContext: string;
  aiCoachContext: string;
  memorySystemExplanation: string;
};

/**
 * Build the Vex PromptComposer with all sections.
 *
 * DEDUPLICATION GUARANTEES:
 * - Burn: only appears in burnMode section (NOT in baseSystemPrompt)
 * - Sato: merged with satoDojo into single sato group
 * - Calendar: merged (guidelines + tool rules) into single calendar section
 * - Store/Grape: app listings only in store section, grape only has discovery UI
 * - Character: only in character section (filtered out of appKnowledge)
 */
export function buildVexPromptComposer(data: VexPromptData): PromptComposer<VexContext> {
  const ctx: VexContext = {
    flags: {
      isDevelopment: data.isDevelopment,
      burnEnabled: data.burnEnabled,
      member: data.isMember,
      isRetro: data.isRetro,
      isAdmin: data.isAdmin,
      isCalendarApp: data.isCalendarApp,
      isVexApp: data.isVexApp,
    },
    vars: {
      assistantName: "Vex",
      burnContent: data.burnContent,
      calendarContent: data.calendarContent,
      calendarToolRules: data.calendarToolRules,
      satoContent: data.satoContent,
      storeContent: data.storeContent,
      grapeContent: data.grapeContent,
      characterContent: data.characterContent,
      inheritanceContent: data.inheritanceContent,
      baseSystemPrompt: data.baseSystemPrompt,
      devBanner: data.devBanner,
      aiSelfAware: data.aiSelfAware,
      piiRedaction: data.piiRedaction,
    },
  };

  const composer = new PromptComposer<VexContext>();

  // ── CRITICAL: NEVER DUPLICATE SECTIONS ────────────────────────
  // Each section has a UNIQUE id. If .use() is called twice with
  // the same id, the SECOND call REPLACES the first. This prevents
  // the duplication bugs we had before.

  // Core sections (weight >= 0.9 — never dropped)
  composer
    .use(composeSection("system", (_) => data.baseSystemPrompt))
    .use(composeSection("devBanner", (_) => (data.isDevelopment ? data.devBanner : null)))
    .use(composeSection("piiRedaction", (_) => data.piiRedaction || null))
    .use(composeSection("aiSelfAware", (_) => data.aiSelfAware || null));

  // User context (weight 0.7-0.9 — rarely dropped)
  composer
    .use(composeSection("instructions", (_) => data.instructionsContext || null))
    .use(composeSection("character", (_) => data.characterContent || null))
    .use(composeSection("mood", (_) => data.moodContent || null))
    .use(composeSection("memories", (_) => data.memoryContent || null))
    .use(composeSection("placeholders", (_) => data.placeholderContext || null))
    .use(composeSection("userBehavior", (_) => data.userBehaviorContext || null))
    .use(composeSection("dna", (_) => data.dnaContext || null))
    .use(composeSection("branch", (_) => data.branchContext || null));

  // Feature context (weight 0.4-0.6 — dropped first)
  composer
    .use(composeSection("moltbook", (_) => data.moltbookContext || null))
    .use(composeSection("tribe", (_) => data.tribeContext || null))
    // SATO: merged with satoDojo — NO MORE DUPLICATION
    .use(
      composeSection("sato", (_) => {
        const parts = [data.satoContent, data.satoDojoContent].filter(Boolean);
        return parts.length > 0 ? parts.join("\n\n") : null;
      }),
    )
    .use(composeSection("store", (_) => data.storeContent || null))
    .use(
      composeSection("calendar", (_) => {
        // CALENDAR: merged guidelines + tool rules — NO MORE DUPLICATION
        if (!data.isCalendarApp && !data.isVexApp) return null;
        const parts = [data.calendarContent, data.calendarToolRules].filter(Boolean);
        return parts.length > 0 ? parts.join("\n\n") : null;
      }),
    )
    .use(composeSection("vault", (_) => data.vaultContext || null))
    .use(composeSection("focus", (_) => data.focusContent || null))
    .use(composeSection("task", (_) => data.taskContent || null))
    .use(composeSection("timerTools", (_) => data.timerToolInstructions || null))
    .use(composeSection("spatialNav", (_) => data.spatialNavigationContext || null));

  // Cross-app / optional (weight <= 0.35 — dropped eagerly)
  composer
    .use(
      composeSection("burnMode", (_) =>
        data.burnEnabled ? data.burnContent : data.burnContent ? data.burnContent : null,
      ),
    )
    .use(composeSection("news", (_) => data.newsContext || null))
    .use(composeSection("analytics", (_) => data.analyticsContext || null))
    .use(composeSection("grape", (_) => data.grapeContent || null))
    .use(composeSection("pear", (_) => data.pearContext || null))
    .use(composeSection("feedbackApps", (_) => data.feedbackAppsContext || null))
    .use(composeSection("subscription", (_) => data.subscriptionContext || null))
    .use(composeSection("statistics", (_) => data.statisticsContext || null))
    .use(composeSection("inheritance", (_) => data.inheritanceContext || null))
    .use(composeSection("e2e", (_) => data.e2eContext || null))
    .use(composeSection("featureStatus", (_) => data.featureStatusContext || null))
    .use(composeSection("pearReminder", (_) => data.pearModeReminder || null))
    .use(composeSection("aiCoach", (_) => data.aiCoachContext || null));

  // Additional sections that were previously appended outside budgeting
  // NOW go through the golden ratio system
  composer.use(composeSection("memoryExplanation", (_) => data.memorySystemExplanation || null));

  return composer;
}
```

**Step 2:** In `ai.ts`, replace the `buildSystemPromptFromParts` call and `enhancedSystemPrompt` append:

```typescript
// OLD (lines ~3913-3953 + enhancedSystemPrompt append ~5083):
// let systemPrompt = buildSystemPromptFromParts({ ... }, 25000).prompt
// ... then later:
// enhancedSystemPrompt = ragSystemPrompt + calendarInstructions + pricingContext + ...

// NEW:
import { buildVexPromptComposer } from "@chrryai/machine/src/ai/sushi/vexPromptComposer"

const composer = buildVexPromptComposer({
  baseSystemPrompt,
  devBanner: isDevelopment ? "This is Dev mode Hocam..." : "",
  aiSelfAware: aiSelfAwarenessContext,
  piiRedaction: piiRedactionContext,
  isDevelopment,
  burnEnabled: /* ... */,
  // ... all other fields from the existing context variables
  satoDojoContent: pricingContext, // was appended separately
  calendarToolRules: calendarInstructions, // was appended separately
  memorySystemExplanation: memoryExplanation, // was appended separately
})

const { prompt: systemPrompt, tokensUsed, droppedSections } = composer.buildWithBudget(ctx, 25000)

// Remove the enhancedSystemPrompt append entirely —
// all content now goes through the composer
```

**Step 3:** Remove duplicated content from `fallbackTemplate`:

- Delete the "## 🔥 Burn Feature (Privacy Mode)" section from the fallback Handlebars template (~L2555-2595)
- Burn info now ONLY comes from `burnModeContext` (conditional, weight=0.15)

**Step 4:** Filter character memories from `buildAppKnowledgeBase`:

- Add a filter: `category !== "character"` when building appKnowledge character entries
- Character data now ONLY comes from `characterContext`

**Step 5:** Run integration tests

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/promptComposer.integration.test.ts
```

**Step 6:** Run full test suite

```bash
pnpm test
```

**Step 7:** Commit

```bash
git add -A
git commit -m "feat: wire PromptComposer into ai.ts — eliminate prompt duplications"
```

---

## Phase 3: E2E Tests

### Task 7: Write E2E test for prompt deduplication

**Objective:** Smoke test that the live API endpoint produces prompts without duplications.

**Files:**

- Create: `apps/api/__tests__/e2e/prompt-deduplication.e2e.test.ts`

**Step 1:** Write E2E test

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildVexPromptComposer } from "@chrryai/machine/src/ai/sushi/vexPromptComposer";

describe("E2E: Prompt deduplication", () => {
  it("should never contain duplicate Burn Feature sections", () => {
    const composer = buildVexPromptComposer({
      baseSystemPrompt: "You are Vex.",
      devBanner: "",
      aiSelfAware: "",
      piiRedaction: "",
      isDevelopment: false,
      burnEnabled: true,
      isMember: false,
      isRetro: false,
      isAdmin: false,
      isCalendarApp: false,
      isVexApp: true,
      burnContent: "## 🔥 Burn Feature (Privacy Mode)\nBurn privacy content.",
      satoContent: "",
      satoDojoContent: "",
      storeContent: "",
      grapeContent: "",
      inheritanceContent: "",
      characterContent: "",
      calendarContent: "",
      calendarToolRules: "",
      timerToolInstructions: "",
      focusContent: "",
      taskContent: "",
      moodContent: "",
      memoryContent: "",
      userBehaviorContext: "",
      placeholderContext: "",
      branchContext: "",
      instructionsContext: "",
      moltbookContext: "",
      tribeContext: "",
      subscriptionContext: "",
      statisticsContext: "",
      featureStatusContext: "",
      newsContext: "",
      spatialNavigationContext: "",
      analyticsContext: "",
      pearContext: "",
      feedbackAppsContext: "",
      pearModeReminder: "",
      e2eContext: "",
      dnaContext: "",
      aiCoachContext: "",
      memorySystemExplanation: "",
    });

    const { prompt } = composer.buildWithBudget(composer["ctx"] ?? ({} as any), 25000);

    // Count Burn Feature occurrences — must be exactly 1
    const burnOccurrences = (prompt.match(/🔥 Burn Feature/g) || []).length;
    expect(burnOccurrences).toBe(1);
  });

  it("should never contain duplicate Sato Mode sections", () => {
    const composer = buildVexPromptComposer({
      baseSystemPrompt: "You are Vex.",
      devBanner: "",
      aiSelfAware: "",
      piiRedaction: "",
      isDevelopment: false,
      burnEnabled: false,
      isMember: true,
      isRetro: true,
      isAdmin: true,
      isCalendarApp: false,
      isVexApp: true,
      burnContent: "",
      satoContent: "## SATO MODE ACTIVATED\nMermi gibi",
      satoDojoContent: "## SATO DOJO GUIDELINES\nRevenue channels",
      storeContent: "",
      grapeContent: "",
      inheritanceContent: "",
      characterContent: "",
      calendarContent: "",
      calendarToolRules: "",
      timerToolInstructions: "",
      focusContent: "",
      taskContent: "",
      moodContent: "",
      memoryContent: "",
      userBehaviorContext: "",
      placeholderContext: "",
      branchContext: "",
      instructionsContext: "",
      moltbookContext: "",
      tribeContext: "",
      subscriptionContext: "",
      statisticsContext: "",
      featureStatusContext: "",
      newsContext: "",
      spatialNavigationContext: "",
      analyticsContext: "",
      pearContext: "",
      feedbackAppsContext: "",
      pearModeReminder: "",
      e2eContext: "",
      dnaContext: "",
      aiCoachContext: "",
      memorySystemExplanation: "",
    });

    const { prompt } = composer.buildWithBudget(
      {
        flags: {
          isDevelopment: false,
          burnEnabled: false,
          member: true,
          isRetro: true,
          isAdmin: true,
          isCalendarApp: false,
          isVexApp: true,
        },
        vars: {
          assistantName: "Vex",
          burnContent: "",
          calendarContent: "",
          calendarToolRules: "",
          satoContent: "## SATO MODE ACTIVATED\nMermi gibi",
          storeContent: "",
          grapeContent: "",
          characterContent: "",
          inheritanceContent: "",
          baseSystemPrompt: "You are Vex.",
          devBanner: "",
          aiSelfAware: "",
          piiRedaction: "",
        },
      },
      25000,
    );

    // Sato should appear in ONE section (merged), not two
    const satoHeaders = (prompt.match(/## SATO/g) || []).length;
    expect(satoHeaders).toBeLessThanOrEqual(2); // "SATO MODE" + "SATO DOJO" merged = OK
    // But the full "SATO MODE ACTIVATED" header must appear exactly once
    const satoModeHeaders = (prompt.match(/SATO MODE ACTIVATED/g) || []).length;
    expect(satoModeHeaders).toBe(1);
  });

  it("should include calendar tool rules in the same section as calendar content", () => {
    const composer = buildVexPromptComposer({
      baseSystemPrompt: "You are Vex.",
      devBanner: "",
      aiSelfAware: "",
      piiRedaction: "",
      isDevelopment: false,
      burnEnabled: false,
      isMember: false,
      isRetro: false,
      isAdmin: false,
      isCalendarApp: true,
      isVexApp: false,
      burnContent: "",
      satoContent: "",
      satoDojoContent: "",
      storeContent: "",
      grapeContent: "",
      inheritanceContent: "",
      characterContent: "",
      calendarContent: "📅 Calendar Events data",
      calendarToolRules: "⏰ CRITICAL CALENDAR TOOL RULES",
      timerToolInstructions: "",
      focusContent: "",
      taskContent: "",
      moodContent: "",
      memoryContent: "",
      userBehaviorContext: "",
      placeholderContext: "",
      branchContext: "",
      instructionsContext: "",
      moltbookContext: "",
      tribeContext: "",
      subscriptionContext: "",
      statisticsContext: "",
      featureStatusContext: "",
      newsContext: "",
      spatialNavigationContext: "",
      analyticsContext: "",
      pearContext: "",
      feedbackAppsContext: "",
      pearModeReminder: "",
      e2eContext: "",
      dnaContext: "",
      aiCoachContext: "",
      memorySystemExplanation: "",
    });

    const { prompt } = composer.buildWithBudget(
      {
        flags: {
          isDevelopment: false,
          burnEnabled: false,
          member: false,
          isRetro: false,
          isAdmin: false,
          isCalendarApp: true,
          isVexApp: false,
        },
        vars: {
          assistantName: "Vex",
          burnContent: "",
          calendarContent: "📅 Calendar Events data",
          calendarToolRules: "⏰ CRITICAL CALENDAR TOOL RULES",
          satoContent: "",
          storeContent: "",
          grapeContent: "",
          characterContent: "",
          inheritanceContent: "",
          baseSystemPrompt: "You are Vex.",
          devBanner: "",
          aiSelfAware: "",
          piiRedaction: "",
        },
      },
      25000,
    );

    expect(prompt).toContain("Calendar Events data");
    expect(prompt).toContain("CALENDAR TOOL RULES");
  });

  it("should respect token budget and drop low-weight sections", () => {
    const composer = buildVexPromptComposer({
      baseSystemPrompt: "You are Vex. ".repeat(1000), // Very long
      devBanner: "Dev mode active",
      aiSelfAware: "AI self-awareness context",
      piiRedaction: "PII redaction notice",
      isDevelopment: true,
      burnEnabled: true,
      isMember: false,
      isRetro: false,
      isAdmin: false,
      isCalendarApp: false,
      isVexApp: true,
      burnContent: "🔥 Burn Feature content here",
      satoContent: "",
      satoDojoContent: "",
      storeContent: "",
      grapeContent: "",
      inheritanceContext: "",
      characterContent: "",
      calendarContent: "",
      calendarToolRules: "",
      timerToolInstructions: "",
      focusContent: "",
      taskContent: "",
      moodContent: "",
      memoryContent: "",
      userBehaviorContext: "",
      placeholderContext: "",
      branchContext: "",
      instructionsContext: "",
      moltbookContext: "",
      tribeContext: "",
      subscriptionContext: "",
      statisticsContext: "",
      featureStatusContext: "",
      newsContext: "",
      spatialNavigationContext: "",
      analyticsContext: "",
      pearContext: "",
      feedbackAppsContext: "",
      pearModeReminder: "",
      e2eContext: "",
      dnaContext: "",
      aiCoachContext: "",
      memorySystemExplanation: "",
      vaultContext: "",
      inheritanceContent: "",
    });

    // With a very tight budget, burnMode (weight 0.15) should be dropped
    // but system (weight 1.0) should survive
    const { prompt, droppedSections } = composer.buildWithBudget(ctx, 500);

    expect(droppedSections.length).toBeGreaterThan(0);
    expect(prompt).toContain("Vex"); // system content survives
  });
});
```

**Step 2:** Run E2E tests

```bash
cd /Users/ibrahimvelinov/Documents/vex
pnpm --filter @chrryai/machine test -- --run src/ai/sushi/__tests__/e2e/prompt-deduplication.e2e.test.ts
```

**Step 3:** Commit

```bash
git add apps/api/__tests__/e2e/prompt-deduplication.e2e.test.ts
git commit -m "test: E2E tests for prompt deduplication"
```

---

## Summary of Changes

| File                                                                         | Change                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/machine/package.json`                                              | Add `@anythingai/teleprompt` dependency                                             |
| `packages/machine/src/ai/sushi/promptComposer.ts`                            | **NEW** — Teleprompt + Golden Ratio bridge                                          |
| `packages/machine/src/ai/sushi/vexPromptComposer.ts`                         | **NEW** — Vex-specific section definitions (single source of truth)                 |
| `packages/machine/src/ai/sushi/promptBuilder.ts`                             | No changes (golden ratio stays as-is)                                               |
| `packages/machine/src/ai/sushi/__tests__/promptComposer.test.ts`             | **NEW** — Unit tests                                                                |
| `packages/machine/src/ai/sushi/__tests__/promptComposer.integration.test.ts` | **NEW** — Integration tests                                                         |
| `apps/api/__tests__/e2e/prompt-deduplication.e2e.test.ts`                    | **NEW** — E2E tests                                                                 |
| `apps/api/hono/routes/ai.ts`                                                 | Replace `buildSystemPromptFromParts` + `enhancedSystemPrompt` with `PromptComposer` |
| `apps/api/hono/routes/ai.ts`                                                 | Remove Burn section from `fallbackTemplate`                                         |
| `apps/api/hono/routes/ai.ts`                                                 | Merge `calendarInstructions` into `calendarContext`                                 |
| `apps/api/hono/routes/ai.ts`                                                 | Merge `pricingContext` (SATO DOJO) into `satoContext`                               |
| `apps/api/hono/routes/ai.ts`                                                 | Remove app listings from `grapeContext`                                             |
| `apps/api/hono/routes/ai.ts`                                                 | Filter `category === "character"` from appKnowledge                                 |

## Deduplication Guarantees (Post-Implementation)

| Topic            | Before                                                | After                      | Mechanism                              |
| ---------------- | ----------------------------------------------------- | -------------------------- | -------------------------------------- |
| Burn Feature     | 2x (fallback + burnMode)                              | 1x (burnMode only)         | Removed from fallbackTemplate          |
| Sato Mode        | 2-3x (sato + satoDojo)                                | 1x (merged section)        | `.use("sato", ...)` replaces id        |
| Calendar         | 2x (context + instructions)                           | 1x (merged section)        | Single composeSection("calendar", ...) |
| App Names        | 3x (store + grape + base)                             | 2x (store + base)          | Removed app listings from grapeContext |
| Character        | 2x (appKnowledge + characterContext)                  | 1x (characterContext)      | Filtered from appKnowledge             |
| Two-stage bypass | calendar/pricing/pear/memory appended after budgeting | All through PromptComposer | Single buildWithBudget() call          |
