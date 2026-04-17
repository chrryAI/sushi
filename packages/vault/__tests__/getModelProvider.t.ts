// import { beforeEach, describe, expect, it, vi } from "vitest"

// // ─── Module mocks ────────────────────────────────────────────────────────────

// vi.mock("../index", () => ({
//   getAiAgents: vi.fn(),
//   getCreditsLeft: vi.fn(),
//   decrypt: vi.fn((v: string) => v),
//   apps: {},
// }))

// vi.mock("@openrouter/ai-sdk-provider", () => ({
//   createOpenRouter: vi.fn(() => (modelId: string) => ({
//     _tag: "openrouter",
//     modelId,
//   })),
// }))

// vi.mock("@ai-sdk/anthropic", () => ({
//   createAnthropic: vi.fn(() => (modelId: string) => ({
//     _tag: "anthropic",
//     modelId,
//   })),
// }))

// vi.mock("@ai-sdk/deepseek", () => ({
//   createDeepSeek: vi.fn(() => (modelId: string) => ({
//     _tag: "deepseek",
//     modelId,
//   })),
// }))

// vi.mock("@ai-sdk/openai", () => ({
//   createOpenAI: vi.fn(() => (modelId: string) => ({ _tag: "openai", modelId })),
// }))

// vi.mock("@ai-sdk/google", () => ({
//   createGoogleGenerativeAI: vi.fn(() => (modelId: string) => ({
//     _tag: "google",
//     modelId,
//   })),
// }))

// vi.mock("@ai-sdk/perplexity", () => ({
//   createPerplexity: vi.fn(() => (modelId: string) => ({
//     _tag: "perplexity",
//     modelId,
//   })),
// }))

// vi.mock("@chrryai/donut/utils", () => ({
//   isE2E: false,
//   VEX_LIVE_FINGERPRINTS: [],
// }))

// // ─── Import after mocks ───────────────────────────────────────────────────────

// import { getAiAgents, getCreditsLeft } from "../index"
// import { getIsE2E, getModelProvider, modelCapabilities } from "../src/ai/vault"

// // ─── Test helpers ─────────────────────────────────────────────────────────────

// const freeAgent = {
//   id: "agent-1",
//   name: "free",
//   displayName: "Free",
//   version: "1",
//   apiURL: "",
//   description: null,
//   state: "active",
//   creditCost: "1",
//   modelId: "qwen/qwen3-coder-next",
//   order: 0,
//   maxPromptSize: null,
//   capabilities: { text: true },
//   authorization: "all",
//   metadata: { failed: [] },
// }

// const belesAgent = { ...freeAgent, id: "agent-beles", name: "beleş" }
// const sushiAgent = { ...freeAgent, id: "agent-sushi", name: "sushi" }
// const claudeAgent = { ...freeAgent, id: "agent-claude", name: "claude" }

// function mockAgents(agents = [freeAgent]) {
//   vi.mocked(getAiAgents).mockResolvedValue(agents as any)
// }

// function mockCredits(n: number) {
//   vi.mocked(getCreditsLeft).mockResolvedValue(n)
// }

// function orKey() {
//   process.env.OPENROUTER_API_KEY = "or-test-key"
// }

// function clearEnv() {
//   delete process.env.OPENROUTER_API_KEY
//   delete process.env.CLAUDE_API_KEY
//   delete process.env.DEEPSEEK_API_KEY
//   delete process.env.CHATGPT_API_KEY
// }

// // ─── Tests ────────────────────────────────────────────────────────────────────

// beforeEach(() => {
//   vi.clearAllMocks()
//   clearEnv()
// })

// // ── modelCapabilities ─────────────────────────────────────────────────────────

// describe("modelCapabilities", () => {
//   it("gpt-4o supports tools and vision", () => {
//     expect(modelCapabilities["gpt-4o"]).toEqual({
//       tools: true,
//       canAnalyze: true,
//     })
//   })

//   it("deepseek-reasoner supports tools only", () => {
//     expect(modelCapabilities["deepseek-reasoner"]).toEqual({ tools: true })
//   })

//   it("sonar-pro does not support tools", () => {
//     expect(modelCapabilities["sonar-pro"]).toEqual({ tools: false })
//   })

//   it("deepseek-v3.2-speciale does not support tools", () => {
//     expect(modelCapabilities["deepseek-v3.2-speciale"]).toEqual({
//       tools: false,
//     })
//   })
// })

// // ── getIsE2E ──────────────────────────────────────────────────────────────────

// describe("getIsE2E", () => {
//   it("returns false when mermi=true (override)", () => {
//     expect(getIsE2E({ mermi: true })).toBe(false)
//   })

//   it("returns false when no fingerprint", () => {
//     expect(getIsE2E({ member: { id: "u1" } as any })).toBe(false)
//   })

//   it("returns false when job is provided (scheduled jobs are never E2E)", () => {
//     expect(
//       getIsE2E({
//         member: { fingerprint: "fp123" } as any,
//         job: { id: "job-1" } as any,
//       }),
//     ).toBe(false)
//   })
// })

// // ── getModelProvider: fallback ─────────────────────────────────────────────────

// describe("getModelProvider — free fallback", () => {
//   it("falls back to free OR model when credits = 0 and no BYOK", async () => {
//     mockAgents([sushiAgent])
//     mockCredits(0)
//     orKey()

//     const result = await getModelProvider({ source: "sushi" })

//     expect(result.isFree).toBe(true)
//     expect(result.modelId).toBe("openrouter/free")
//   })

//   it("uses OR free when no keys at all", async () => {
//     mockAgents([freeAgent])
//     mockCredits(5)

//     const result = await getModelProvider({ source: "beleş" })

//     // No OR key set → getFallback
//     expect(result.isFree).toBe(true)
//   })
// })

// // ── getModelProvider: BYOK ────────────────────────────────────────────────────

// describe("getModelProvider — BYOK", () => {
//   it("uses BYOK OR key when provided", async () => {
//     mockAgents([belesAgent])
//     mockCredits(100)
//     orKey()

//     const user = {
//       id: "u1",
//       apiKeys: { openrouter: "byok-encrypted-key" },
//       tier: "plus",
//     } as any

//     const result = await getModelProvider({ user, source: "beleş" })

//     expect(result.isBYOK).toBe(true)
//     expect(result.lastKey).toBe("openrouter")
//   })
// })

// // ── getModelProvider: claude agent ────────────────────────────────────────────

// describe("getModelProvider — claude", () => {
//   it("picks claude model when source=codebase", async () => {
//     mockAgents([claudeAgent])
//     mockCredits(10)
//     process.env.OPENROUTER_API_KEY = "or-key"

//     const result = await getModelProvider({ source: "codebase" })

//     expect(result.modelId).toMatch(/claude/)
//     expect(result.lastKey).toBe("openrouter")
//   })

//   it("uses native anthropic key when available (free tier)", async () => {
//     mockAgents([claudeAgent])
//     mockCredits(10)
//     process.env.CLAUDE_API_KEY = "sk-ant-test"

//     const app = { id: "app-1", tier: "free" } as any
//     const result = await getModelProvider({ app, name: "claude" })

//     expect(result.lastKey).toBe("claude")
//     expect(result.supportsTools).toBe(true)
//     expect(result.canAnalyze).toBe(true)
//   })
// })

// // ── getModelProvider: sushi agent ─────────────────────────────────────────────

// describe("getModelProvider — sushi", () => {
//   it("picks thinking model when canReason=true and no job", async () => {
//     mockAgents([sushiAgent])
//     mockCredits(10)
//     orKey()

//     const result = await getModelProvider({ source: "sushi", canReason: true })

//     expect(result.modelId).toContain("thinking")
//     expect(result.lastKey).toBe("openrouter")
//   })

//   it("picks chat model when canReason=false", async () => {
//     mockAgents([sushiAgent])
//     mockCredits(10)
//     orKey()

//     const result = await getModelProvider({
//       source: "sushi",
//       canReason: false,
//     })

//     expect(result.modelId).not.toContain("thinking")
//   })
// })

// // ── getModelProvider: deepSeek agent ──────────────────────────────────────────

// describe("getModelProvider — deepSeek", () => {
//   it("uses native deepseek key when available (free tier)", async () => {
//     const deepseekAgent = { ...freeAgent, name: "deepSeek" }
//     mockAgents([deepseekAgent])
//     mockCredits(10)
//     process.env.DEEPSEEK_API_KEY = "dsk-test-key"

//     const app = { id: "app-1", tier: "free" } as any
//     const result = await getModelProvider({ app, name: "deepSeek" })

//     expect(result.lastKey).toBe("deepSeek")
//     expect(result.supportsTools).toBe(true)
//   })
// })

// // ── getModelProvider: beles agent ─────────────────────────────────────────────

// describe("getModelProvider — beles", () => {
//   it("uses beles models via OR", async () => {
//     mockAgents([belesAgent])
//     mockCredits(10)
//     orKey()

//     const result = await getModelProvider({ source: "ai/content" })

//     expect(result.isBELES).toBe(true)
//     expect(result.lastKey).toBe("openrouter")
//   })

//   it("admin user gets minimax first", async () => {
//     mockAgents([belesAgent])
//     mockCredits(10)
//     orKey()

//     const adminUser = { id: "u1", role: "admin" } as any
//     const result = await getModelProvider({
//       user: adminUser,
//       source: "ai/content",
//     })

//     expect(result.modelId).toBe("minimax/minimax-m2.5")
//   })

//   it("regular user gets qwen first", async () => {
//     mockAgents([belesAgent])
//     mockCredits(10)
//     orKey()

//     const user = { id: "u1", role: "user" } as any
//     const result = await getModelProvider({ user, source: "ai/content" })

//     expect(result.modelId).toBe("qwen/qwen3-coder-next")
//   })
// })

// // ── getModelProvider: result shape ────────────────────────────────────────────

// describe("getModelProvider — result shape", () => {
//   it("always returns supportsTools and canAnalyze booleans", async () => {
//     mockAgents([freeAgent])
//     mockCredits(5)

//     const result = await getModelProvider({})

//     expect(typeof result.supportsTools).toBe("boolean")
//     expect(typeof result.canAnalyze).toBe("boolean")
//     expect(result.provider).toBeDefined()
//     expect(result.modelId).toBeDefined()
//   })
// })
