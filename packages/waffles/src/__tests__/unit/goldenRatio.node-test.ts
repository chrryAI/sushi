/**
 * Golden Ratio φ-Engine Tests
 * Run with: npx tsx src/__tests__/unit/goldenRatio.node-test.ts
 */

import assert from "node:assert"
import { describe, it } from "node:test"
import {
  DEFAULT_TRIGGERS,
  evaluateGoldenRatio,
  FIBONACCI,
  formatFibonacciPreview,
  type GoldenFeature,
  getDefaultTriggers,
  getNewlyTriggeredFeatures,
  getNextFibonacciThreshold,
  getUserGoldenRatioConfig,
} from "../../agent/goldenRatio"

describe("Golden Ratio φ-Engine (Unit)", () => {
  it("getDefaultTriggers returns a copy", () => {
    const triggers = getDefaultTriggers()
    assert.strictEqual(triggers.length, DEFAULT_TRIGGERS.length)
    assert.notStrictEqual(triggers, DEFAULT_TRIGGERS)
  })

  it("getUserGoldenRatioConfig returns defaults when null", () => {
    const config = getUserGoldenRatioConfig(null)
    assert.strictEqual(config.memory.threadThreshold, 3)
    assert.strictEqual(config.memory.messageThreshold, 2)
    assert.strictEqual(config.memory.enabled, true)
    assert.strictEqual(config.vectorEmbed.threadThreshold, 13)
    assert.strictEqual(config.vectorEmbed.messageThreshold, 8)
  })

  it("getUserGoldenRatioConfig merges overrides", () => {
    const config = getUserGoldenRatioConfig({
      memory: { threadThreshold: 1, messageThreshold: 1, enabled: false },
    })
    assert.strictEqual(config.memory.enabled, false)
    assert.strictEqual(config.instructions.threadThreshold, 8)
  })

  it("evaluateGoldenRatio triggers memory at 3/2", () => {
    const results = evaluateGoldenRatio(3, 2, [])
    const memory = results.find((r) => r.feature === "memory")
    assert.ok(memory)
    assert.strictEqual(memory!.triggered, true)
    assert.strictEqual(memory!.alreadyTriggered, false)
  })

  it("evaluateGoldenRatio does not trigger below threshold", () => {
    const results = evaluateGoldenRatio(2, 1, [])
    const memory = results.find((r) => r.feature === "memory")
    assert.ok(memory)
    assert.strictEqual(memory!.triggered, false)
  })

  it("evaluateGoldenRatio triggers all features at 21/21", () => {
    const results = evaluateGoldenRatio(21, 21, [])
    const triggered = results.filter((r) => r.triggered).map((r) => r.feature)
    assert.ok(triggered.includes("memory"))
    assert.ok(triggered.includes("kanban"))
    assert.ok(triggered.includes("characterProfile"))
    assert.ok(triggered.includes("placeholders"))
    assert.ok(triggered.includes("instructions"))
    assert.ok(triggered.includes("vectorEmbed"))
  })

  it("evaluateGoldenRatio respects already triggered", () => {
    const results = evaluateGoldenRatio(3, 2, ["memory"])
    const memory = results.find((r) => r.feature === "memory")
    assert.ok(memory)
    assert.strictEqual(memory!.triggered, true)
    assert.strictEqual(memory!.alreadyTriggered, true)
  })

  it("evaluateGoldenRatio respects disabled config", () => {
    const results = evaluateGoldenRatio(21, 21, [], {
      memory: { threadThreshold: 3, messageThreshold: 2, enabled: false },
    })
    const memory = results.find((r) => r.feature === "memory")
    assert.ok(memory)
    assert.strictEqual(memory!.triggered, false)
  })

  it("getNewlyTriggeredFeatures returns only new features", () => {
    const results = getNewlyTriggeredFeatures(5, 5, ["memory"])
    const features = results.map((r) => r.feature)
    assert.ok(features.includes("kanban"))
    assert.ok(features.includes("characterProfile"))
    assert.ok(!features.includes("memory"))
  })

  it("getNextFibonacciThreshold returns correct values", () => {
    assert.strictEqual(getNextFibonacciThreshold(0), 1)
    assert.strictEqual(getNextFibonacciThreshold(1), 2)
    assert.strictEqual(getNextFibonacciThreshold(2), 3)
    assert.strictEqual(getNextFibonacciThreshold(3), 5)
    assert.strictEqual(getNextFibonacciThreshold(5), 8)
    assert.strictEqual(getNextFibonacciThreshold(8), 13)
    assert.strictEqual(getNextFibonacciThreshold(13), 21)
    assert.strictEqual(getNextFibonacciThreshold(1000), 144)
  })

  it("formatFibonacciPreview shows correct progress", () => {
    const preview = formatFibonacciPreview(4, 4)
    assert.strictEqual(preview.length, DEFAULT_TRIGGERS.length)
    const memory = preview.find((p) => p.feature === "memory")
    assert.ok(memory)
    assert.strictEqual(memory!.ready, true)
  })

  it("formatFibonacciPreview marks features not ready", () => {
    const preview = formatFibonacciPreview(1, 1)
    const vectorEmbed = preview.find((p) => p.feature === "vectorEmbed")
    assert.ok(vectorEmbed)
    assert.strictEqual(vectorEmbed!.ready, false)
  })
})
