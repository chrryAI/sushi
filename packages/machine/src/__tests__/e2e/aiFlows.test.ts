import {
  FREE_MODELS,
  makeLanguageModel,
  resolveProvider,
} from "@chrryai/machine/ai"
import { Effect } from "effect"
import { beforeAll, describe, expect, it } from "vitest"

/**
 * E2E AI Flow Tests
 * Tests complete AI workflows with real API calls when OPENROUTER_API_KEY is available
 */

describe("E2E AI Flows", () => {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY

  beforeAll(() => {
    if (!hasApiKey) {
      console.log("⚠️  E2E AI tests skipped - OPENROUTER_API_KEY not set")
    }
  })

  describe("Chat Completion Flow", () => {
    it.skipIf(!hasApiKey)(
      "should complete full chat flow with DeepSeek",
      async () => {
        const program = Effect.gen(function* () {
          // 1. Resolve provider
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
            preferFree: true,
          })

          expect(config.isFree).toBe(true)

          // 2. Create language model
          const model = makeLanguageModel(config)

          // 3. Generate response
          const response = yield* model.generate(
            "What is 2+2? Answer with just the number.",
            { maxTokens: 10 },
          )

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result).toContain("4")
        console.log("✅ Chat flow result:", result)
      },
      30000,
    )

    it.skipIf(!hasApiKey)(
      "should handle system prompts in chat flow",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
            preferFree: true,
          })

          const model = makeLanguageModel(config)

          const response = yield* model.generate("Who are you?", {
            system: "You are TestBot. Always start with 'I am TestBot.'",
            maxTokens: 50,
          })

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result.toLowerCase()).toContain("testbot")
        console.log("✅ System prompt result:", result.slice(0, 100))
      },
      30000,
    )
  })

  describe("Multi-Model Comparison Flow", () => {
    it.skipIf(!hasApiKey)(
      "should compare responses from multiple models",
      async () => {
        const modelIds = [
          FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          FREE_MODELS["google/gemini-2.0-flash-exp:free"].modelId,
        ]

        const programs = modelIds.map((modelId) =>
          Effect.gen(function* () {
            const config = yield* resolveProvider({ modelId, preferFree: true })
            const model = makeLanguageModel(config)
            const response = yield* model.generate("Say 'Hello from AI'", {
              maxTokens: 20,
            })
            return { modelId, response }
          }).pipe(
            Effect.catchAll((error) =>
              Effect.succeed({
                modelId,
                error: error instanceof Error ? error.message : String(error),
              }),
            ),
          ),
        )

        const results = await Effect.runPromise(Effect.all(programs))

        results.forEach((r) => {
          if ("response" in r) {
            console.log(`✅ ${r.modelId}: ${r.response.slice(0, 50)}`)
          } else {
            console.log(`⚠️ ${r.modelId}: ${r.error}`)
          }
        })

        // At least one should succeed
        const successes = results.filter((r) => "response" in r).length
        expect(successes).toBeGreaterThanOrEqual(1)
      },
      60000,
    )
  })

  describe("Error Recovery Flow", () => {
    it.skipIf(!hasApiKey)(
      "should handle and recover from API errors",
      async () => {
        const program = Effect.gen(function* () {
          // Try with invalid model first
          const invalidConfig = yield* resolveProvider({
            modelId: "invalid/model-name",
            preferFree: true,
          })

          const model = makeLanguageModel(invalidConfig)

          // This might fail, handle gracefully
          const result = yield* model
            .generate("Hello")
            .pipe(
              Effect.catchAll((error) => Effect.succeed(`Recovered: ${error}`)),
            )

          return result
        })

        const result = await Effect.runPromise(program)

        expect(result).toBeDefined()
        console.log("✅ Error recovery result:", result.slice(0, 100))
      },
      30000,
    )

    it("should work without API key for configuration", async () => {
      // This test runs without API key
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        })

        expect(config.isFree).toBe(true)
        expect(config.apiKey).toBe("")

        // Can create model even without key
        const model = makeLanguageModel(config)
        expect(model).toBeDefined()

        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })
  })

  describe("Metadata Tracking Flow", () => {
    it.skipIf(!hasApiKey)(
      "should track usage metadata",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
            preferFree: true,
          })

          const model = makeLanguageModel(config)

          const result = yield* model.generateWithMetadata("Count: 1, 2, 3", {
            maxTokens: 20,
          })

          return result
        })

        const result = await Effect.runPromise(program)

        expect(result.text).toBeTruthy()
        expect(result.model).toBeTruthy()
        console.log("✅ Metadata:", {
          text: result.text.slice(0, 50),
          model: result.model,
          usage: result.usage,
        })
      },
      30000,
    )
  })
})
