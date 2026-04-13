/**
 * @chrryai/machine - Effect.js + XState AI Machine Core
 *
 * Provides:
 * - Effect-based AI abstractions with FREE model support
 * - XState machines for complex workflows
 * - Spatial navigation utilities
 * - Integration tests with real API calls
 */

export * as Context from "effect/Context"
// Effect exports
export * as Effect from "effect/Effect"
export * as Either from "effect/Either"
export * as Layer from "effect/Layer"
export * as Option from "effect/Option"

// XState exports
export { assign, createActor, createMachine, fromPromise } from "xstate"

// Package version
export const VERSION = "0.1.0"

// Free models for testing
export { FREE_MODELS } from "./ai/index.js"
