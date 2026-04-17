import { describe, expect, it } from "vitest"
import {
  DEFAULT_TRIGGERS,
  evaluateGoldenRatio,
  FIBONACCI,
  formatFibonacciPreview,
  getDefaultTriggers,
  getNewlyTriggeredFeatures,
  getNextFibonacciThreshold,
  getUserGoldenRatioConfig,
  type goldenFeature,
} from "../../agent/goldenRatio"

describe("Golden Ratio φ-Engine (Unit)", () => {
  describe("getDefaultTriggers", () => {
    it("should return a copy of default triggers", () => {
      const triggers = getDefaultTriggers()
      expect(triggers).toHaveLength(DEFAULT_TRIGGERS.length)
      expect(triggers).not.toBe(DEFAULT_TRIGGERS)
      expect(triggers[0]).toEqual(DEFAULT_TRIGGERS[0])
    })
  })

  describe("getUserGoldenRatioConfig", () => {
    it("should return defaults when no user config provided", () => {
      const config = getUserGoldenRatioConfig(null)
      expect(config.memory.threadThreshold).toBe(3)
      expect(config.memory.messageThreshold).toBe(2)
      expect(config.memory.enabled).toBe(true)
      expect(config.vectorEmbed.threadThreshold).toBe(13)
      expect(config.vectorEmbed.messageThreshold).toBe(8)
    })

    it("should merge user overrides with defaults", () => {
      const config = getUserGoldenRatioConfig({
        memory: { threadThreshold: 1, messageThreshold: 1, enabled: false },
        kanban: { threadThreshold: 10, enabled: true, messageThreshold: 5 },
      })

      expect(config.memory.enabled).toBe(false)
      expect(config.memory.threadThreshold).toBe(1)
      expect(config.memory.messageThreshold).toBe(1)
      expect(config.kanban.threadThreshold).toBe(10)
      expect(config.kanban.messageThreshold).toBe(5)
      // Unchanged defaults
      expect(config.instructions.threadThreshold).toBe(8)
    })
  })

  describe("evaluateGoldenRatio", () => {
    it("should trigger memory at 3 threads / 2 messages", () => {
      const results = evaluateGoldenRatio(3, 2, [])
      const memory = results.find((r) => r.feature === "memory")
      expect(memory?.triggered).toBe(true)
      expect(memory?.alreadyTriggered).toBe(false)
    })

    it("should NOT trigger memory below threshold", () => {
      const results = evaluateGoldenRatio(2, 1, [])
      const memory = results.find((r) => r.feature === "memory")
      expect(memory?.triggered).toBe(false)
    })

    it("should trigger multiple features at high counts", () => {
      const results = evaluateGoldenRatio(21, 21, [])
      const triggered = results.filter((r) => r.triggered)
      expect(triggered.map((t) => t.feature)).toEqual(
        expect.arrayContaining([
          "memory",
          "kanban",
          "characterProfile",
          "placeholders",
          "instructions",
          "vectorEmbed",
        ]),
      )
    })

    it("should respect already triggered features", () => {
      const results = evaluateGoldenRatio(3, 2, ["memory"])
      const memory = results.find((r) => r.feature === "memory")
      expect(memory?.triggered).toBe(true)
      expect(memory?.alreadyTriggered).toBe(true)
    })

    it("should respect disabled features in user config", () => {
      const results = evaluateGoldenRatio(21, 21, [], {
        memory: { threadThreshold: 3, messageThreshold: 2, enabled: false },
      })
      const memory = results.find((r) => r.feature === "memory")
      expect(memory?.triggered).toBe(false)
    })
  })

  describe("getNewlyTriggeredFeatures", () => {
    it("should return only newly triggered features", () => {
      const results = getNewlyTriggeredFeatures(5, 5, ["memory"])
      expect(results.map((r) => r.feature)).toEqual(
        expect.arrayContaining(["kanban", "characterProfile"]),
      )
      expect(results.some((r) => r.feature === "memory")).toBe(false)
    })

    it("should return empty array when nothing new triggers", () => {
      const results = getNewlyTriggeredFeatures(1, 1, [])
      expect(results).toHaveLength(0)
    })
  })

  describe("getNextFibonacciThreshold", () => {
    it("should return next Fibonacci number", () => {
      expect(getNextFibonacciThreshold(0)).toBe(1)
      expect(getNextFibonacciThreshold(1)).toBe(2)
      expect(getNextFibonacciThreshold(2)).toBe(3)
      expect(getNextFibonacciThreshold(3)).toBe(5)
      expect(getNextFibonacciThreshold(5)).toBe(8)
      expect(getNextFibonacciThreshold(8)).toBe(13)
      expect(getNextFibonacciThreshold(13)).toBe(21)
    })

    it("should return max Fibonacci for very large values", () => {
      expect(getNextFibonacciThreshold(1000)).toBe(144)
    })
  })

  describe("formatFibonacciPreview", () => {
    it("should show progress bars for all features", () => {
      const preview = formatFibonacciPreview(4, 4)
      expect(preview).toHaveLength(DEFAULT_TRIGGERS.length)
      const memory = preview.find((p) => p.feature === "memory")
      expect(memory?.ready).toBe(true)
      expect(memory?.progressThread).toBeCloseTo(4 / 3, 1)
      expect(memory?.progressMessage).toBeCloseTo(4 / 2, 1)
    })

    it("should mark features as not ready below thresholds", () => {
      const preview = formatFibonacciPreview(1, 1)
      const vectorEmbed = preview.find((p) => p.feature === "vectorEmbed")
      expect(vectorEmbed?.ready).toBe(false)
      expect(vectorEmbed?.progressThread).toBe(1 / 13)
      expect(vectorEmbed?.progressMessage).toBe(1 / 8)
    })
  })
})
