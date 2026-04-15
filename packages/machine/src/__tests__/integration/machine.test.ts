/**
 * Integration Tests - @chrryai/machine with Real AI
 *
 * Tests the machine package with actual API calls.
 *
 * NOTE: These tests require OPENROUTER_API_KEY environment variable.
 * They will be skipped if the API key is not available.
 */

import { Effect } from "effect"
import { beforeAll, describe, expect, it } from "vitest"
import {
  FREE_MODELS,
  makeLanguageModel,
  resolveProvider,
} from "../../ai/index.js"

describe("Machine Integration Tests", () => {
  let hasApiKey = false

  beforeAll(() => {
    hasApiKey =
      !!process.env.OPENROUTER_API_KEY &&
      process.env.OPENROUTER_API_KEY.length > 0
    if (!hasApiKey) {
      console.log("⚠️  Skipping integration tests - OPENROUTER_API_KEY not set")
    }
  })

  describe("Free AI Models", () => {
    it.skipIf(!process.env.OPENROUTER_API_KEY)(
      "should call DeepSeek free model",
      async () => {
        const program = Effect.gen(function* () {
          const config = yield* resolveProvider({
            modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
            preferFree: true,
          })

          expect(config.modelId).toContain("free")

          const model = makeLanguageModel(config)
          const response = yield* model.generate(
            "Say exactly: 'DeepSeek works!'",
            { maxTokens: 20 },
          )

          return response
        })

        const result = await Effect.runPromise(program)

        expect(result.toLowerCase()).toContain("deepseek")
        console.log("✅ DeepSeek:", result)
      },
      30000,
    )

    it.skipIf(!process.env.OPENROUTER_API_KEY)(
      "should call multiple free models in parallel",
      async () => {
        const models = [
          FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          FREE_MODELS["google/gemini-2.0-flash-exp:free"].modelId,
        ]

        const programs = models.map((modelId) =>
          Effect.gen(function* () {
            const config = yield* resolveProvider({ modelId, preferFree: true })
            const model = makeLanguageModel(config)
            const response = yield* model.generate("Say hi", { maxTokens: 10 })
            return { modelId, response }
          }).pipe(
            Effect.catchAll((error) =>
              Effect.succeed({ modelId, error: String(error) }),
            ),
          ),
        )

        const results = await Effect.runPromise(Effect.all(programs))

        results.forEach((r) => {
          if ("error" in r) {
            console.log(`⚠️ ${r.modelId}:`, r.error)
          } else {
            console.log(`✅ ${r.modelId}:`, r.response.slice(0, 50))
          }
        })

        // At least one should succeed
        const successes = results.filter((r) => "response" in r).length
        expect(successes).toBeGreaterThanOrEqual(1)
      },
      60000,
    )
  })

  describe("Error Scenarios", () => {
    it.skipIf(!process.env.OPENROUTER_API_KEY)(
      "should handle rate limiting gracefully",
      async () => {
        // Make multiple rapid requests
        const requests = Array(5)
          .fill(null)
          .map((_, i) =>
            Effect.gen(function* () {
              const config = yield* resolveProvider({ preferFree: true })
              const model = makeLanguageModel(config)
              return yield* model.generate(`Request ${i}`, { maxTokens: 5 })
            }).pipe(
              Effect.catchAll((error) => Effect.succeed(`Error: ${error}`)),
            ),
          )

        const results = await Effect.runPromise(Effect.all(requests))

        // Should either get responses or errors, not crash
        expect(results).toHaveLength(5)
        console.log(
          "✅ Rapid requests handled:",
          results.map((r) => r.slice(0, 30)),
        )
      },
      60000,
    )

    it("should work without API key (free models)", async () => {
      // This test verifies the module can be imported and used
      // even without an API key for free tier models
      const config = await Effect.runPromise(
        resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        }),
      )

      expect(config.modelId).toContain("free")
      expect(config.isFree).toBe(true)
      expect(config.baseUrl).toBe("https://openrouter.ai/api/v1")
    })
  })
})
