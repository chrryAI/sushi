import * as AiLanguageModel from "@effect/ai/LanguageModel"
import { Effect, Schema } from "effect"
import { describe, expect, it, vi } from "vitest"
import {
  generateStructuredOutput,
  generateStructuredOutputWithFallback,
  runStructuredOutputWithFallback,
} from "./structuredOutput"

/* ─── Schema ─── */
const TestSchema = Schema.Struct({
  answer: Schema.Number,
})

describe("structuredOutput timeout & fallback", () => {
  it("runStructuredOutputWithFallback returns a promise", () => {
    const fakeLayer: any = { _tag: "Layer" }
    const program = runStructuredOutputWithFallback(
      TestSchema,
      "What is 2+2?",
      fakeLayer,
    )
    expect(typeof program.then).toBe("function")
  })

  it("generateStructuredOutput uses model.generateObject", async () => {
    const mockModel = {
      generateObject: vi
        .fn()
        .mockImplementation(() => Effect.succeed({ value: { answer: 42 } })),
      generateText: vi.fn(),
    }

    const program = generateStructuredOutput(TestSchema, "What is 6*7?", {
      system: "You are a calculator",
    }).pipe(
      Effect.provideService(AiLanguageModel.LanguageModel, mockModel as any),
    )

    const result = await Effect.runPromise(program)
    expect(result).toEqual({ answer: 42 })
    expect(mockModel.generateObject).toHaveBeenCalled()
  })

  it("generateStructuredOutputWithFallback falls back to generateText + parseAIJson", async () => {
    const mockModel = {
      generateObject: vi
        .fn()
        .mockImplementation(() => Effect.fail(new Error("No object mode"))),
      generateText: vi
        .fn()
        .mockImplementation(() => Effect.succeed({ text: '{"answer": 99}' })),
    }

    const program = generateStructuredOutputWithFallback(
      TestSchema,
      "What is 9+9?",
    ).pipe(
      Effect.provideService(AiLanguageModel.LanguageModel, mockModel as any),
    )

    const result = await Effect.runPromise(program)
    expect(result).toEqual({ answer: 99 })
    expect(mockModel.generateObject).toHaveBeenCalled()
    expect(mockModel.generateText).toHaveBeenCalled()
  })

  it("returns empty object when both generateObject and parseAIJson fail", async () => {
    const mockModel = {
      generateObject: vi
        .fn()
        .mockImplementation(() => Effect.fail(new Error("No object mode"))),
      generateText: vi
        .fn()
        .mockImplementation(() => Effect.succeed({ text: "not json" })),
    }

    const program = generateStructuredOutputWithFallback(
      TestSchema,
      "What is 9+9?",
    ).pipe(
      Effect.provideService(AiLanguageModel.LanguageModel, mockModel as any),
    )

    const result = await Effect.runPromise(program)
    console.log("result:", result)
    expect(result).toEqual({})
  })
})
