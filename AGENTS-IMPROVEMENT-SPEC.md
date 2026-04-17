# AGENTS.md Improvement Spec

Audit date: 2026-04-15  
Auditor: Ona  
Source files reviewed: `AGENTS.md`, `.ona/review/comments.json`, `.github/workflows/pr.yml`,
`package.json`, `biome.json`, `turbo.json`, `.husky/pre-commit`,
`.husky/prepare-commit-msg`, `.env.local.template`, `docs/SCSS_WORKFLOW.md`,
`docs/guides/CONTRIBUTING.md`, `docs/guides/RELEASE.md`, `scripts/oss/`

---

## What's Good

- **Comprehensive stack coverage.** Every app and package is listed with its
  framework, runtime, and key dependencies. An agent can orient quickly without
  reading `package.json`.
- **Vite+ (`vp`) is called out explicitly.** The critical rule "do not use
  `pnpm`/`npm` directly for package operations" and "import from `vite-plus`
  not `vitest`" prevents a common class of agent mistakes.
- **Test matrix is detailed.** Per-package test locations, runners, coverage
  providers, and environment requirements (live Postgres, real OpenRouter key)
  are all documented.
- **Security section is actionable.** Gitleaks bypass syntax, gitignore
  patterns, and the BYOK key hierarchy are all present.
- **OSS boundary is explicit.** Public vs. private package split is stated
  clearly, which prevents accidental leakage.
- **Review checklist exists.** Section 12 gives agents a concrete pre-commit
  gate.

---

## What's Wrong

### W1 — `packages/donut` is listed as both public and private (contradiction)

Section 10 lists `packages/donut` under **Public** (synced to `chrryai/vex`)
and the workspace structure tree marks it `— PRIVATE`. Section 10 also lists
it under **Private** in the same paragraph. The OSS sync scripts must be
checked and one authoritative answer written.

### W2 — CI trigger is a push to `ramen`, not a PR

Section 8 says: *"Trigger: Pull requests to `ramen` branch."*  
The actual workflow (`pr.yml`) uses `on: push: branches: [ramen]` — there is
no `pull_request` trigger. This misleads agents about when CI fires and what
branch strategy to follow.

### W3 — Pre-commit hook list is wrong

Section 7 says "Two hooks run on every commit" then lists three items. The
actual `pre-commit` script runs: (1) Gitleaks, (2) large-file check, (3) SCSS
tests. The count is wrong and the SCSS test step is buried as item 3 without
explanation.

### W4 — `vp install` / `vp add` / `vp remove` are undocumented commands

Section 4 says "Use `vp install`, `vp add`, `vp remove`" but the Vite+
commands table only lists `dev`, `build`, `test`, `lint`, `fmt`, `check`,
`run`. An agent has no way to know the correct syntax for dependency
management.

### W5 — SCSS workflow is entirely absent

The repo has a significant SCSS-to-TypeScript conversion system
(`docs/SCSS_WORKFLOW.md`, `scripts/scss-to-universal.js`, `pnpm s`,
`pnpm s:all`, `pnpm s:w`, `pnpm s:changed`). Agents editing UI components
will produce `.module.scss` files without knowing they must be converted, or
will write raw TypeScript styles without knowing the canonical pattern.

### W6 — Branch/git-flow strategy is not documented

The document mentions `ramen` and `main` branches in passing but never
explains the flow: feature branches → `ramen` (CI) → auto-merge to `main`.
Agents don't know which branch to base work on, what naming convention to use,
or that `ramen` is the integration branch (not `main`).

### W7 — `packages/donut` purpose is inconsistent with its label

The packages table says `packages/donut` has no npm name (`—`) and is an
"Internal UI playground / demo app", but the workspace tree marks it PRIVATE.
The actual role (playground for `@chrryai/chrry` components) is never
explained, so agents don't know whether to add new component demos there.

---

## What's Missing

### M1 — SCSS workflow and style authoring rules

No guidance on when to write `.module.scss` vs `.styles.ts`, how to run the
converter, or what the converter supports/doesn't support. This affects every
agent touching `packages/ui` or `apps/chrry`.

### M2 — Git branching model

No documentation of: default branch (`main`), integration branch (`ramen`),
feature branch naming convention, PR target, or the auto-merge behaviour.
Agents cannot make correct branching decisions.

### M3 — White-label config system

The document mentions white-label products (Vex, Chrry, Atlas, etc.) but never
explains how they are configured — where brand configs live, how
`validate-chrry-config.js` works, or how domain-based routing selects a brand.
Agents adding features to one brand may inadvertently break others.

### M4 — Effect.js / XState usage patterns

`packages/machine` uses Effect.js and XState but there are no conventions
documented: when to use Effect vs plain async, how to add a new machine, how
to test machines locally without a real API key. Agents will write imperative
code in a codebase that expects functional Effect pipelines.

### M5 — Environment variable management

`turbo.json` declares ~50 `globalEnv` entries. There is no guidance on: how to
add a new env var (turbo.json + .env.local.template + app usage), which vars
are required for local dev vs CI-only, or how `VITE_*` prefix works with SSR.

### M6 — Adding a new package or app

No documented process for scaffolding a new workspace package: which
`tsconfig` preset to extend, how to wire it into `turbo.json` pipeline, how to
register it for OSS sync if public.

### M7 — Observability / error reporting

Sentry, New Relic, Arcjet, and Plausible are referenced in `turbo.json`
`globalEnv` but never mentioned in AGENTS.md. Agents don't know: whether to
add Sentry captures to new error paths, how to test locally without keys, or
that Arcjet handles rate-limiting (so they shouldn't implement their own).

### M8 — Common agent failure modes / anti-patterns

No "do not do this" section beyond the commit blocklist. Missing explicit
warnings such as:
- Do not run `pnpm install` directly (use `vp install`).
- Do not import from `vitest` or `vite` directly.
- Do not add a new Drizzle migration manually — always use `pnpm run generate`.
- Do not edit `packages/vault/src/schema.ts` without running `generate` + `migrate`.
- Do not add a new route to `apps/api` without a corresponding `.test.ts`.

### M9 — Local setup one-command shortcut

`pnpm local:setup` exists in `package.json` and does docker start + generate +
migrate + seed in one step, but is not mentioned in AGENTS.md. Agents follow
the four-step manual process instead.

### M10 — Docs directory ownership rules

`docs/` contains a mix of architecture docs, vision docs, setup guides, and
stray markdown files at the root level (e.g., `GOOGLE_ADS_TRACKING.md`,
`GRAPE_VISION.md`, `PLATFORM_PRIMITIVES_COMPLETE.md`). Section 11 says
"business docs in root belong under `docs/`" but doesn't say which subdirectory
or what the naming convention is, so agents keep creating root-level `.md`
files.

---

## Improvement Spec

Each item below is a concrete, bounded change to AGENTS.md. Items are ordered
by impact on agent correctness.

---

### SPEC-1 — Fix the `packages/donut` public/private contradiction

**Section:** 10 (OSS Sync Rules) and workspace structure tree  
**Action:** Determine the authoritative answer from `scripts/oss/sync-to-public.sh`
and update both the tree annotation and the public/private lists to agree.
If `donut` is private, remove it from the public list. If public, remove the
PRIVATE annotation from the tree.

---

### SPEC-2 — Correct the CI trigger description

**Section:** 8 (CI/CD)  
**Replace:**
> Trigger: Pull requests to `ramen` branch.

**With:**
> Trigger: Push to `ramen` branch (not a PR trigger — direct pushes and
> auto-merged commits both fire CI).

---

### SPEC-3 — Fix the pre-commit hook count and description

**Section:** 7 (Pre-Commit Hooks)  
**Replace** "Two hooks run on every commit" with "Three steps run on every
commit" and rewrite the list to match the actual `pre-commit` script:

1. **Gitleaks** — scans staged files for secrets.
2. **Large file check** — blocks files >50 MB.
3. **SCSS tests** — runs `pnpm run test:scss` to validate the SCSS converter.

---

### SPEC-4 — Document `vp` dependency management commands

**Section:** 4 (Vite+ Commands)  
**Add** to the commands table:

| Command | Purpose |
|---------|---------|
| `vp install` | Install all dependencies (replaces `pnpm install`) |
| `vp add <pkg>` | Add a dependency to the current package |
| `vp remove <pkg>` | Remove a dependency |

Also add the explicit anti-pattern: **never run `pnpm add` or `npm install`
directly** — this bypasses the Vite+ toolchain.

---

### SPEC-5 — Add a SCSS Workflow section

**New section:** 5a (between Code Style and Commit Convention), or append to
Section 5.  
**Content to include:**

- The SCSS-to-TypeScript conversion system: `.module.scss` → `.styles.ts`.
- When to use each: `.module.scss` for web-only components in `apps/chrry`;
  `.styles.ts` (generated or hand-written) for cross-platform components in
  `packages/ui`.
- Commands: `pnpm s` (convert changed), `pnpm s:all` (convert all),
  `pnpm s:w` (watch mode), `pnpm s:changed` (changed files only).
- Rule: after editing any `.module.scss`, run `pnpm s` before committing.
- Reference: `docs/SCSS_WORKFLOW.md` for full converter capabilities.

---

### SPEC-6 — Add a Git Branching Model section

**New section:** 4a (after Build/Dev/Test Commands).  
**Content:**

```
main      ← stable, production-deployed
  └── ramen  ← integration branch; CI runs here; auto-merges to main on green
        └── <feature-branch>  ← all agent work starts here
```

- Base all feature branches off `main` (or `ramen` if the work depends on
  in-flight changes).
- Open PRs targeting `ramen`.
- CI fires on push to `ramen`; on green, `auto-merge` job merges to `main`.
- Branch naming: `feat/<short-description>`, `fix/<short-description>`,
  `chore/<short-description>` — matching the commit type prefix.

---

### SPEC-7 — Add a White-Label Config section

**New section:** 3a (after Workspace Structure).  
**Content:**

- Brand configs live in `apps/chrry/src/config/` (one file per brand).
- `scripts/validate-chrry-config.js` validates config shape — run it after
  editing any brand config.
- Domain-based routing: `apps/chrry` reads the request hostname at runtime and
  selects the matching brand config. No env var needed in production.
- When adding a feature that should be brand-gated, add a boolean flag to the
  brand config type and default it to `false` in all existing configs.
- Reference: `docs/architecture/DOMAIN_BASED_ROUTING.md`.

---

### SPEC-8 — Add Effect.js / XState conventions to packages/machine

**Section:** 2 (Packages table) or new subsection under Section 6 (Testing).  
**Content:**

- New async logic in `packages/machine` must use Effect pipelines, not
  `async/await` directly.
- New state machines use XState v5 `createMachine` + `createActor`.
- Unit tests mock the Effect runtime; integration tests require
  `OPENROUTER_API_KEY` and are skipped automatically when absent.
- Do not add `packages/machine` logic to `apps/api` directly — expose it via
  the package's public API.

---

### SPEC-9 — Add env var management rules

**Section:** 7 (Security) or new subsection.  
**Content:**

- To add a new env var: (1) add to `.env.local.template` with a comment,
  (2) add to `turbo.json` `globalEnv` if needed by build/test pipeline,
  (3) prefix with `VITE_` only if it must be available in browser bundles.
- `VITE_*` vars are inlined at build time — never put secrets in them.
- Required for local dev (non-optional): `DATABASE_URL`, `REDIS_URL`,
  `AUTH_SECRET`. Everything else degrades gracefully or is skipped.

---

### SPEC-10 — Add an Anti-Patterns section

**New section:** 13 (after Review Checklist).  
**Title:** "Common Mistakes to Avoid"  
**Content (bullet list):**

- Do not run `pnpm add` / `npm install` — use `vp add`.
- Do not `import { test } from 'vitest'` — use `import { test } from 'vite-plus/test'`.
- Do not create Drizzle migrations manually — always `pnpm run generate` in
  `packages/vault`, then commit the generated SQL.
- Do not edit `packages/vault/src/schema.ts` without running `generate` + `migrate`
  afterward.
- Do not add a new Hono route without a corresponding `*.test.ts` file.
- Do not implement custom rate limiting — Arcjet handles it in `apps/api`.
- Do not add Sentry calls in `packages/*` — observability belongs in `apps/api`
  and `apps/chrry` only.
- Do not create markdown files at the repo root — place them under `docs/`
  in the appropriate subdirectory (`architecture/`, `guides/`, `setup/`,
  `vision/`).
- Do not commit to `main` directly — all changes go through a feature branch
  targeting `ramen`.

---

### SPEC-11 — Surface `pnpm local:setup` in the setup flow

**Section:** 4 (Local Development Setup)  
**Add** after the four-step manual process:

```bash
# Shortcut: runs docker:start + generate + migrate + seed in one step
pnpm local:setup
```

---

### SPEC-12 — Clarify docs directory structure and naming

**Section:** 11 (What NOT to Commit)  
**Add** under "Business docs in root":

> Place docs under `docs/` using these subdirectories:
> - `docs/architecture/` — technical design and system diagrams
> - `docs/guides/` — how-to guides for contributors and operators
> - `docs/setup/` — third-party service setup instructions
> - `docs/vision/` — product direction and roadmap
>
> File names should be `SCREAMING_SNAKE_CASE.md`. Do not create numbered or
> dated filenames.

---

## Priority Order for Implementation

| Priority | Spec | Reason |
|----------|------|--------|
| P0 | SPEC-1 | Active contradiction causes wrong OSS sync decisions |
| P0 | SPEC-2 | Wrong CI trigger description causes incorrect branch assumptions |
| P0 | SPEC-6 | Missing branching model is the most common agent failure point |
| P1 | SPEC-5 | SCSS workflow affects every UI change |
| P1 | SPEC-10 | Anti-patterns prevent the most frequent mistakes |
| P1 | SPEC-4 | `vp` dependency commands are referenced but undefined |
| P2 | SPEC-3 | Hook count is wrong but low-stakes |
| P2 | SPEC-9 | Env var rules prevent subtle build/runtime bugs |
| P2 | SPEC-11 | `local:setup` shortcut saves time but isn't blocking |
| P3 | SPEC-7 | White-label config needed for brand-specific work |
| P3 | SPEC-8 | Effect.js conventions needed for machine package work |
| P3 | SPEC-12 | Docs naming convention is cosmetic but reduces noise |
