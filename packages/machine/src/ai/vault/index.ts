// ─────────────────────────────────────────────────────────────────
// vault/index.ts — Pricing data, model limits, capabilities, API key helpers
//
// Model routing logic (getModelProvider, getEmbeddingProvider) has moved
// to packages/machine/src/ai/sushi/provider.ts
// ─────────────────────────────────────────────────────────────────

import type { nil } from "@chrryai/donut/types"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ModelProviderResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any
  modelId: string
  agentName: string
  lastKey: string
  supportsTools: boolean
  canAnalyze: boolean
  isBYOK: boolean
  isBELEŞ?: boolean
  isFree?: boolean
  /** Kredi bitti, free pool'a düştü — frontend banner gösterebilir */
  isDegraded?: boolean
}

export type JobWithModelConfig = {
  metadata?: { modelId?: string } | null
  modelConfig?: { model?: string } | null
}

export type routeTier = "free" | "cheap" | "mid" | "quality" | "premium"

// ─────────────────────────────────────────────────────────────────
// Pricing table ($/1M tokens)
// ─────────────────────────────────────────────────────────────────

export const prizes: Record<
  string,
  { input: number; output: number; tools: boolean; canAnalyze: boolean | null }
> = {
  "qwen/qwen3.6-plus": {
    input: 0.0,
    output: 0.0,
    tools: true,
    canAnalyze: true,
  },
  "deepseek/deepseek-v3.2": {
    input: 0.28,
    output: 0.4,
    tools: true,
    canAnalyze: null,
  },
  "deepseek/deepseek-v3.2-thinking": {
    input: 0.28,
    output: 0.4,
    tools: true,
    canAnalyze: null,
  },
  "deepseek/deepseek-v3.2-speciale": {
    input: 0.0,
    output: 0.001,
    tools: false,
    canAnalyze: null,
  },
  "minimax/minimax-m2.5": {
    input: 0.3,
    output: 1.1,
    tools: true,
    canAnalyze: null,
  },
  "minimax/minimax-m2.7": {
    input: 0.3,
    output: 1.2,
    tools: true,
    canAnalyze: null,
  },
  "google/gemini-3.1-pro-preview": {
    input: 0.35,
    output: 1.05,
    tools: true,
    canAnalyze: true,
  },
  "x-ai/grok-4.1-fast": {
    input: 0.5,
    output: 2.0,
    tools: true,
    canAnalyze: true,
  },
  "perplexity/sonar-pro": {
    input: 2.0,
    output: 8.0,
    tools: false,
    canAnalyze: null,
  },
  "anthropic/claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    tools: true,
    canAnalyze: true,
  },
  "openai/gpt-5.4": { input: 2.5, output: 15.0, tools: true, canAnalyze: true },
  "openrouter/free": {
    input: 0.0,
    output: 0.0,
    tools: false,
    canAnalyze: false,
  },
  "openai/gpt-oss-120b:free": {
    input: 0.0,
    output: 0.073,
    tools: false,
    canAnalyze: true,
  },
  "gpt-4o": { input: 2.5, output: 10.0, tools: true, canAnalyze: true },
  "gpt-4o-mini": { input: 0.15, output: 0.6, tools: true, canAnalyze: true },
}

// ─────────────────────────────────────────────────────────────────
// Model limits & capabilities
// ─────────────────────────────────────────────────────────────────

interface modelLimits {
  maxTokens: number
  name: string
}

export const DEFAULT_LIMIT: modelLimits = { maxTokens: 64000, name: "Default" }

export const MODEL_LIMITS: Record<string, modelLimits> = {
  "deepseek-chat": { maxTokens: 128000, name: "DeepSeek Chat" },
  "deepseek-reasoner": { maxTokens: 131000, name: "DeepSeek Reasoner" },
  "deepseek/deepseek-chat": { maxTokens: 128000, name: "DeepSeek Chat" },
  "deepseek/deepseek-r1": { maxTokens: 131000, name: "DeepSeek R1" },
  "deepseek/deepseek-v3": { maxTokens: 128000, name: "DeepSeek V3" },
  "deepseek-v3.2": { maxTokens: 163000, name: "DeepSeek V3.2" },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    maxTokens: 262000,
    name: "DeepSeek Thinking",
  },
  "nvidia/nemotron-3-super-120b-a12b": {
    maxTokens: 262000,
    name: "DeepSeek Thinking",
  },
  "qwen/qwen3.6-plus": { maxTokens: 1000000, name: "Qwen 3.6 Plus Preview" },
  "qwen/qwen3-235b-a22b-thinking-2507": {
    maxTokens: 131000,
    name: "Qwen3 Thinking",
  },
  "qwen/qwen3-vl-235b-a22b-thinking": {
    maxTokens: 131000,
    name: "Qwen3 VL Thinking",
  },
  "qwen/qwen3-235b": { maxTokens: 131000, name: "Qwen3" },
  "claude-3-5-sonnet-20241022": {
    maxTokens: 200000,
    name: "Claude 3.5 Sonnet",
  },
  "claude-3-opus-20240229": { maxTokens: 200000, name: "Claude 3 Opus" },
  "anthropic/claude-sonnet-4.5": {
    maxTokens: 200000,
    name: "Claude Sonnet 4.5",
  },
  "anthropic/claude-sonnet-4-6": {
    maxTokens: 200000,
    name: "Claude Sonnet 4.6",
  },
  "claude-sonnet-4-20250514": { maxTokens: 200000, name: "Claude Sonnet 4.5" },
  "gpt-4o-mini": { maxTokens: 128000, name: "gpt-4o-mini" },
  "gpt-4-turbo": { maxTokens: 128000, name: "GPT-4 Turbo" },
  "gpt-3.5-turbo": { maxTokens: 16000, name: "GPT-3.5 Turbo" },
  "gpt-5.1": { maxTokens: 128000, name: "GPT-5.1" },
  "openai/gpt-5.1-chat": { maxTokens: 128000, name: "GPT-5.1" },
  "gpt-5.2-pro": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "openai/gpt-5.2-pro": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "gpt-5.2-2025-12-11": { maxTokens: 128000, name: "GPT-5.2 Pro" },
  "gemini-2.0-flash-exp": { maxTokens: 1000000, name: "Gemini 2.0 Flash" },
  "gemini-3.1-pro-preview": { maxTokens: 2000000, name: "Gemini 3.1 Pro" },
  "google/gemini-3.1-pro-preview": {
    maxTokens: 2000000,
    name: "Gemini 3.1 Pro",
  },
  "sonar-pro": { maxTokens: 200000, name: "Sonar Pro" },
  "perplexity/sonar-pro": { maxTokens: 200000, name: "Sonar Pro" },
  "grok-4-1-fast": { maxTokens: 128000, name: "Grok 4.1 Fast" },
  "grok-4-1-fast-reasoning": {
    maxTokens: 128000,
    name: "Grok 4.1 Fast Reasoning",
  },
  "x-ai/grok-4-1-fast-reasoning": {
    maxTokens: 128000,
    name: "Grok 4.1 Fast Reasoning",
  },
  "grok-4-1": { maxTokens: 128000, name: "Grok 4.1" },
  "minimax/minimax-m2.7:free": { maxTokens: 200000, name: "MiniMax M2.7 Free" },
  "minimax/minimax-m2.7": { maxTokens: 200000, name: "MiniMax M2.7" },
  "minimax/minimax-m2.5:free": { maxTokens: 200000, name: "MiniMax M2.5 Free" },
  "minimax/minimax-m2.5": { maxTokens: 200000, name: "MiniMax M2.5" },
  "black-forest-labs/flux-schnell": { maxTokens: 4000, name: "Flux Schnell" },
}

export const modelCapabilities: Record<
  string,
  { tools: boolean; canAnalyze?: boolean }
> = {
  "gpt-4o": { tools: true, canAnalyze: true },
  "gpt-4o-mini": { tools: true, canAnalyze: true },
  "anthropic/claude-sonnet-4-6": { tools: true, canAnalyze: true },
  "google/gemini-3.1-pro-preview": { tools: true, canAnalyze: true },
  "qwen/qwen3.6-plus": { tools: true, canAnalyze: true },
  "deepseek/deepseek-v3.2": { tools: true, canAnalyze: false },
  "deepseek/deepseek-v3.2-thinking": { tools: true },
  "deepseek/deepseek-v3.2-speciale": { tools: false },
  "minimax/minimax-m2.5:free": { tools: true },
  "minimax/minimax-m2.5": { tools: true },
  "minimax/minimax-m2.7:free": { tools: true },
  "minimax/minimax-m2.7": { tools: true },
  "nvidia/nemotron-3-super-120b-a12b:free": { tools: true },
  "nvidia/nemotron-3-super-120b-a12b": { tools: true, canAnalyze: false },
  "x-ai/grok-4.1-fast": { tools: true, canAnalyze: true },
  "perplexity/sonar-pro": { tools: false },
  "openrouter/free": { tools: false, canAnalyze: false },
  "openai/gpt-oss-120b:free": { tools: false, canAnalyze: true },
}
