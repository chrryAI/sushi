import { AiError, LanguageModel } from "@effect/ai";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import type { ramen } from "../../types/index.js";

export interface chrryLanguageModelOptions {
  readonly ramen: ramen;
  readonly baseUrl?: string;
}

export const makeChrryLanguageModel = (
  options: chrryLanguageModelOptions,
): LanguageModel.Service => ({
  generateText: (opts) =>
    Effect.gen(function* () {
      // TODO: wire to Chrry API / RPC handler
      // const response = yield* Effect.tryPromise(() =>
      //   fetch(`${options.baseUrl ?? ""}/api/ai/chat`, {
      //     method: "POST",
      //     body: JSON.stringify({ ...opts, ramen: options.ramen }),
      //   })
      // )
      return {
        text: "TODO: implement Chrry generateText",
        usage: Option.none(),
        finishReason: "stop" as const,
        messages: [],
        toolCalls: [],
        toolResults: [],
      } as any;
    }),

  streamText: (opts) => {
    // TODO: wire SSE stream from Chrry API / RPC handler
    return Stream.empty as any;
  },

  generateObject: (opts) =>
    Effect.fail(
      new AiError.MalformedOutput({
        module: "ChrryLanguageModel",
        method: "generateObject",
        description: "NotYetImplemented",
      }),
    ) as any,
});

export const chrryLanguageModelLive = (options: chrryLanguageModelOptions) =>
  Layer.succeed(LanguageModel as any, makeChrryLanguageModel(options));
