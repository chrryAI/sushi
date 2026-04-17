import {
  FREE_MODELS,
  makeLanguageModel,
  resolveProvider,
} from "@chrryai/machine/ai"
import { Effect } from "effect"
import { describe, expect, it } from "vitest"

describe("AI Provider Tests", () => {
  describe("Free Model Configuration", () => {
    it("should resolve DeepSeek free model", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        })

        expect(config.modelId).toBe("deepseek/deepseek-chat:free")
        expect(config.isFree).toBe(true)
        expect(config.baseUrl).toBe("https://openrouter.ai/api/v1")
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })

    it("should resolve Gemini Flash free model", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["google/gemini-2.0-flash-exp:free"].modelId,
          preferFree: true,
        })

        expect(config.modelId).toBe("google/gemini-2.0-flash-exp:free")
        expect(config.isFree).toBe(true)
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })

    it("should resolve Llama free model", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId:
            FREE_MODELS["meta-llama/llama-3.3-70b-instruct:free"].modelId,
          preferFree: true,
        })

        expect(config.modelId).toBe("meta-llama/llama-3.3-70b-instruct:free")
        expect(config.isFree).toBe(true)
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result).toBeDefined()
    })
  })

  describe("Language Model Creation", () => {
    it("should create language model instance", () => {
      const config = {
        apiKey: "",
        modelId: "deepseek/deepseek-chat:free",
        baseUrl: "https://openrouter.ai/api/v1",
      }

      const model = makeLanguageModel(config)

      expect(model).toBeDefined()
      expect(typeof model.generate).toBe("function")
      expect(typeof model.generateWithMetadata).toBe("function")
    })

    it("should create model with API key", () => {
      const config = {
        apiKey: "test-api-key-123",
        modelId: "anthropic/claude-3.5-sonnet",
        baseUrl: "https://openrouter.ai/api/v1",
      }

      const model = makeLanguageModel(config)

      expect(model).toBeDefined()
      expect(typeof model.generate).toBe("function")
    })
  })

  describe("Effect Error Handling", () => {
    it("should handle missing API key for paid models", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: "anthropic/claude-3.5-sonnet",
          preferFree: false,
        })
        return config
      })

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe("Failure")
    })

    it("should allow free models without API key", async () => {
      const program = Effect.gen(function* () {
        const config = yield* resolveProvider({
          modelId: FREE_MODELS["deepseek/deepseek-chat:free"].modelId,
          preferFree: true,
        })
        expect(config.apiKey).toBe("")
        return config
      })

      const result = await Effect.runPromise(program)
      expect(result.apiKey).toBe("")
    })
  })
})
