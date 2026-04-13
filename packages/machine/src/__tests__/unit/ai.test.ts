import { Effect, Exit } from "effect"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  FREE_MODELS,
  makeLanguageModel,
  NoApiKeyError,
  ProviderError,
  resolveProvider,
} from "../../ai/index.js"

describe("AI Module - Unit Tests", () => {
  describe("Provider Resolution", () => {
    it("should resolve free model provider without API key", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        })

        expect(config.modelId).toBe("deepseek/deepseek-chat:free")
        expect(config.isFree).toBe(true)
        expect(config.baseUrl).toBe("https://openrouter.ai/api/v1")
        expect(config.apiKey).toBe("") // Empty when env var not set
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })

    it("should resolve default free model when no model specified", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({ preferFree: true })

        expect(config.isFree).toBe(true)
        expect(config.modelId).toContain("free")
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })

    it("should fail for paid model without API key", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: "anthropic/claude-3.5-sonnet",
          preferFree: false,
        })

        return config
      })

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe("Failure")
      // Should fail with NoApiKeyError
    })

    it("should fail for non-free model without API key", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: "anthropic/claude-3.5-sonnet",
          preferFree: true, // preferFree true but model is not free
        })
        return config
      })

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe("Failure")
    })
  })

  describe("Free Models Configuration", () => {
    it("should have all expected free models", () => {
      const expectedModels = [
        "deepseek/deepseek-chat:free",
        "deepseek/deepseek-r1:free",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
      ]

      expectedModels.forEach((modelId) => {
        const model = Object.values(FREE_MODELS).find(
          (m) => typeof m === "object" && m.modelId === modelId,
        )
        expect(model).toBeDefined()
      })
    })

    it("should have default free model", () => {
      expect(FREE_MODELS.default).toBeDefined()
      expect(typeof FREE_MODELS.default).toBe("string")
    })
  })

  describe("Effect Error Handling", () => {
    it("should handle errors in Effect pipeline", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(new Error("Test error"))
        return "success"
      }).pipe(
        Effect.catchAll((error) => Effect.succeed(`caught: ${error.message}`)),
      )

      const result = await Effect.runPromise(program)
      expect(result).toBe("caught: Test error")
    })

    it("should use Effect.either for error handling", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({ preferFree: true })
        return config
      }).pipe(Effect.either)

      const result = await Effect.runPromise(program)
      expect(result._tag).toBe("Right")
    })
  })

  describe("Language Model Creation", () => {
    it("should create language model with config", () => {
      const config = {
        apiKey: "test-key",
        modelId: "deepseek/deepseek-chat:free",
        baseUrl: "https://openrouter.ai/api/v1",
      }

      const model = makeLanguageModel(config)
      expect(model).toBeDefined()
      expect(typeof model.generate).toBe("function")
      expect(typeof model.generateWithMetadata).toBe("function")
    })
  })

  describe("Error Types", () => {
    it("should create NoApiKeyError", () => {
      const error = new NoApiKeyError({ source: "test" })
      expect(error._tag).toBe("NoApiKeyError")
      expect(error.source).toBe("test")
    })

    it("should create ProviderError", () => {
      const error = new ProviderError({
        message: "test error",
        cause: new Error("cause"),
      })
      expect(error._tag).toBe("ProviderError")
      expect(error.message).toBe("test error")
    })
  })
})
