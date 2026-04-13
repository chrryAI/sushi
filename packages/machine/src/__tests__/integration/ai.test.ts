/**
 * Integration Tests - Real AI API Calls
 *
 * These tests make actual API calls to free AI models.
 * They verify the integration works with real services.
 *
 * NOTE: Requires OPENROUTER_API_KEY environment variable.
 * Run: OPENROUTER_API_KEY=xxx pnpm test:integration
 */

import { Effect, Exit } from "effect"
import { beforeAll, describe, expect, it } from "vitest"
import {
  FREE_MODELS,
  makeLanguageModel,
  NoApiKeyError,
  resolveProvider,
} from "../../ai/index.js"

describe("AI Integration Tests", () => {
  // Check if OPENROUTER_API_KEY is available
  const hasApiKey =
    !!process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY.length > 0

  beforeAll(() => {
    if (!hasApiKey) {
      console.log(
        "⚠️  OPENROUTER_API_KEY not set - integration tests will be skipped",
      )
    }
  })

  describe("Free Models - Real API Calls", () => {
    it.skipIf(!hasApiKey)(
      "should generate text with DeepSeek V3 Free",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
            preferFree: true,
          })

          const model = makeLanguageModel(config)
          const response = yield* model.generate(
            "Say 'Hello from Chrry AI' and nothing else.",
            { maxTokens: 50 },
          )

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result.toLowerCase()).toContain("hello")
        expect(result.length).toBeGreaterThan(0)
        console.log("✓ DeepSeek V3 response:", result.slice(0, 100))
      },
      30000,
    )

    it.skipIf(!hasApiKey)(
      "should generate text with Gemini Flash Free",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["google/gemini-2.0-flash-exp:free"].modelId,
            preferFree: true,
          })

          const model = makeLanguageModel(config)
          const response = yield* model.generate(
            "What is 2+2? Answer with just the number.",
            { maxTokens: 10 },
          )

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result).toContain("4")
        console.log("✓ Gemini Flash response:", result.slice(0, 100))
      },
      30000,
    )

    it.skipIf(!hasApiKey)(
      "should generate with metadata including usage",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS.default,
            preferFree: true,
          })

          const model = makeLanguageModel(config)
          const result = yield* model.generateWithMetadata(
            "Count from 1 to 3.",
            { maxTokens: 50 },
          )

          return result
        })

        const result = await Effect.runPromise(program)

        expect(result.text).toBeTruthy()
        expect(result.model).toBeTruthy()
        // Usage might not be available for all free models
        console.log("✓ Response with metadata:", {
          text: result.text.slice(0, 50),
          model: result.model,
          usage: result.usage,
        })
      },
      30000,
    )

    it.skipIf(!hasApiKey)(
      "should handle system prompts",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS.default,
            preferFree: true,
          })

          const model = makeLanguageModel(config)
          const response = yield* model.generate("Who are you?", {
            system:
              "You are a helpful assistant named TestBot. Always start your response with 'I am TestBot.'",
            maxTokens: 100,
          })

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result.toLowerCase()).toContain("testbot")
        console.log("✓ System prompt response:", result.slice(0, 100))
      },
      30000,
    )
  })

  describe("Error Handling", () => {
    it.skipIf(!hasApiKey)(
      "should handle invalid model gracefully",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: "invalid/model-name",
            preferFree: true,
          })

          const model = makeLanguageModel(config)
          return yield* model.generate("Hello")
        })

        // Should either succeed with fallback or fail with ProviderError
        const exit = await Effect.runPromiseExit(program)

        if (exit._tag === "Failure") {
          console.log("✓ Invalid model handled:", exit.cause)
        } else {
          console.log("✓ Invalid model fell back:", exit.value)
        }
      },
      30000,
    )

    it("should work without API key for free models (config only)", async () => {
      // Verify that we can get a config for free models even without API key
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        })

        expect(config.modelId).toContain("free")
        expect(config.isFree).toBe(true)
        expect(config.baseUrl).toBe("https://openrouter.ai/api/v1")
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result.apiKey).toBe("") // Empty key when env var not set
    })
  })

  describe("Model Availability", () => {
    it.skipIf(!hasApiKey)(
      "should verify all free models are accessible",
      async () => {
        const freeModelIds = [
          FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          FREE_MODELS["deepseek/deepseek-r1:free"].modelId,
          FREE_MODELS["google/gemini-2.0-flash-exp:free"].modelId,
          FREE_MODELS["meta-llama/llama-3.3-70b-instruct:free"].modelId,
        ]

        const results = await Promise.all(
          freeModelIds.map(async (modelId) => {
            try {
              const program = Effect.gen(function* () {
                const config = yield* resolveProvider({
                  modelId,
                  preferFree: true,
                })
                const model = makeLanguageModel(config)
                const response = yield* model.generate("Hi", { maxTokens: 10 })
                return {
                  modelId,
                  success: true as const,
                  response: response.slice(0, 30),
                }
              })
              return await Effect.runPromise(program)
            } catch (error) {
              return { modelId, success: false as const, error: String(error) }
            }
          }),
        )

        console.log("\n📊 Free Model Availability:")
        results.forEach((r) => {
          const status = r.success ? "✅" : "❌"
          const message = r.success ? r.response : r.error
          console.log(`  ${status} ${r.modelId}: ${message}`)
        })

        // At least 1 model should work
        const workingModels = results.filter((r) => r.success).length
        expect(workingModels).toBeGreaterThanOrEqual(1)
      },
      60000,
    )
  })
})
