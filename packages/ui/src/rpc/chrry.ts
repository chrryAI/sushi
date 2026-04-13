import { Rpc, RpcGroup } from "@effect/rpc"
import * as S from "effect/Schema"
import type { sushi } from "../../types/index.js"

/**
 * Minimal ramen schema for RPC transport.
 * Expand fields as needed for strict runtime validation.
 */
export const RamenSchema = S.Struct({
  id: S.optional(S.String),
  appId: S.optional(S.String),
  modelId: S.optional(S.String),
  slug: S.optional(S.String),
  llm: S.optional(S.Boolean),
  userId: S.optional(S.String),
  guestId: S.optional(S.String),
  storeId: S.optional(S.String),
  storeSlug: S.optional(S.String),
  storeDomain: S.optional(S.String),
  ownerId: S.optional(S.String),
  threadId: S.optional(S.String),
  isSystem: S.optional(S.Boolean),
  name: S.optional(S.String),
  role: S.optional(S.Literal("admin", "user")),
  skipCache: S.optional(S.Boolean),
  depth: S.optional(S.Number),
  isSafe: S.optional(S.Boolean),
  include: S.optional(S.Array(S.String)),
  exclude: S.optional(S.Array(S.String)),
  createdOn: S.optional(S.DateFromString),
  updatedOn: S.optional(S.DateFromString),
  join: S.optional(
    S.Struct({
      placeholders: S.optional(
        S.Struct({
          app: S.optional(S.Number),
          user: S.optional(S.Number),
          dna: S.optional(S.Number),
          thread: S.optional(S.Number),
        }),
      ),
      instructions: S.optional(
        S.Struct({
          app: S.optional(S.Number),
          user: S.optional(S.Number),
          thread: S.optional(S.Number),
          dna: S.optional(S.Number),
        }),
      ),
      memories: S.optional(
        S.Struct({
          app: S.optional(S.Number),
          user: S.optional(S.Number),
          dna: S.optional(S.Number),
          thread: S.optional(S.Number),
        }),
      ),
      characterProfile: S.optional(
        S.Struct({
          app: S.optional(S.Number),
          user: S.optional(S.Number),
          dna: S.optional(S.Number),
          thread: S.optional(S.Number),
        }),
      ),
    }),
  ),
  agent: S.optional(S.NullOr(S.Unknown)),
})

/**
 * Placeholder sushi schema.
 * TODO: Replace with full Schema once all chrry/bloom fields are mapped.
 */
export const SushiSchema = S.Unknown as S.Schema<sushi>

export const ChatMessageSchema = S.Struct({
  role: S.String,
  content: S.String,
})

/**
 * resolveApp — fetches a Chrry app context using the ramen payload.
 */
export const resolveApp = Rpc.make("resolveApp", {
  payload: RamenSchema,
  success: SushiSchema,
  error: S.String,
})

/**
 * chat — OpenAI-compatible chat completion endpoint backed by Chrry.
 * Returns a stream of text chunks.
 */
export const chat = Rpc.make("chat", {
  payload: S.Struct({
    messages: S.Array(ChatMessageSchema),
    model: S.optional(S.String),
    stream: S.optional(S.Boolean),
    ramen: RamenSchema,
  }),
  success: S.Struct({
    content: S.String,
    usage: S.optional(
      S.Struct({
        promptTokens: S.Number,
        completionTokens: S.Number,
      }),
    ),
  }),
  error: S.String,
  stream: true,
})

/**
 * Shared Chrry RPC protocol.
 * Import this on both client and server to keep the contract in sync.
 */
export const ChrryRpc = RpcGroup.make(resolveApp, chat)
