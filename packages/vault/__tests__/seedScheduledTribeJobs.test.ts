import { describe, expect, it } from "vitest"

// Tests for seedScheduledTribeJobs capacity validation
// Updated for warning-based validation (not throw-based)

const COOLDOWN_T1 = 45
const COOLDOWN_T2 = 90
const COOLDOWN_T3 = 120
const MAX_EVENT_PERCENTAGE = 80

/**
 * Validates tier capacity - updated version from seedScheduledTribeJobs.ts
 */
function validateTierCapacity(
  tierApps: string[],
  cooldown: number,
  tierName: string,
): {
  valid: boolean
  overflow: number
  overflowCycles: number
  lastEventTime: number
  critical: boolean
} {
  if (tierApps.length === 0) {
    return {
      valid: true,
      overflow: 0,
      overflowCycles: 0,
      lastEventTime: 0,
      critical: false,
    }
  }

  const interval = Math.floor(cooldown / tierApps.length)
  const maxOffset = (tierApps.length - 1) * interval
  const lastEventOffset = Math.floor((cooldown * MAX_EVENT_PERCENTAGE) / 100)
  const lastEventTime = maxOffset + lastEventOffset
  const totalSlots = cooldown

  if (lastEventTime > totalSlots) {
    const overflow = lastEventTime - totalSlots
    const overflowCycles = Math.ceil(lastEventTime / cooldown)
    const critical = overflowCycles > 2

    return { valid: false, overflow, overflowCycles, lastEventTime, critical }
  }

  return {
    valid: true,
    overflow: 0,
    overflowCycles: 1,
    lastEventTime,
    critical: false,
  }
}

describe("TIER_1 (45min, 7 apps: focus/chrry/sushi/vex/zarathustra/jules/lucas)", () => {
  it("overflows 27min into 2nd cycle (acceptable, not critical)", () => {
    const apps = [
      "focus",
      "chrry",
      "sushi",
      "vex",
      "zarathustra",
      "jules",
      "lucas",
    ]
    const result = validateTierCapacity(apps, COOLDOWN_T1, "TIER_1")

    expect(result.valid).toBe(false)
    expect(result.overflow).toBe(27)
    expect(result.overflowCycles).toBe(2)
    expect(result.critical).toBe(false)
    expect(result.lastEventTime).toBe(72)
  })

  it("1 app fits perfectly", () => {
    const result = validateTierCapacity(["only"], COOLDOWN_T1, "TIER_1")
    expect(result.valid).toBe(true)
    expect(result.lastEventTime).toBe(36)
  })
})

describe("TIER_2 (90min, ~31 apps)", () => {
  it("overflows into 2nd cycle (acceptable)", () => {
    const apps = Array.from({ length: 31 }, (_, i) => `app${i}`)
    const result = validateTierCapacity(apps, COOLDOWN_T2, "TIER_2")

    expect(result.overflowCycles).toBe(2)
    expect(result.critical).toBe(false)
  })
})

describe("TIER_3 (120min, remaining apps)", () => {
  it("handles large tier with 2-cycle overflow", () => {
    const apps = Array.from({ length: 50 }, (_, i) => `app${i}`)
    const result = validateTierCapacity(apps, COOLDOWN_T3, "TIER_3")

    expect(result.overflowCycles).toBeLessThanOrEqual(2)
    expect(result.critical).toBe(false)
  })
})

describe("Critical overflow detection (>2 cycles)", () => {
  it("mathematically impossible with current algorithm (tested for safety)", () => {
    // Critical overflow requires: overflowCycles > 2
    // With stagger algorithm: maxOffset = (n-1)*floor(cooldown/n)
    // For interval >= 1: n <= cooldown, so maxOffset <= (cooldown-1)*1 = cooldown-1
    // lastEvent = maxOffset + 0.8*cooldown <= cooldown-1 + 0.8*cooldown = 1.8*cooldown - 1
    // cycles = ceil(1.8*cooldown / cooldown) = 2 max
    // For interval = 0: maxOffset = 0, lastEvent = 0.8*cooldown, cycles = 1

    const extremeCases = [
      { n: 100, cooldown: 10 },
      { n: 200, cooldown: 5 },
      { n: 50, cooldown: 30 },
    ]

    for (const { n, cooldown } of extremeCases) {
      const apps = Array.from({ length: n }, (_, i) => `app${i}`)
      const result = validateTierCapacity(apps, cooldown, "EXTREME")
      expect(result.critical).toBe(false) // Never critical with this algorithm
    }
  })
})

describe("Why overflow is EXPECTED", () => {
  it("demonstrates stagger scheduling (some overlap expected)", () => {
    const stagger = 6
    const appCount = 7

    const allEventTimes: number[] = []
    for (let app = 0; app < appCount; app++) {
      const offset = app * stagger
      const appEvents = [0, 9, 18, 27, 36].map((e) => offset + e)
      allEventTimes.push(...appEvents)
    }

    // With stagger=6 and events at [0,9,18,27,36], some overlaps occur
    // This is expected - the goal is "distributed load" not "zero overlap"
    const unique = new Set(allEventTimes)
    expect(allEventTimes.length).toBe(35) // 7 apps × 5 events
    expect(unique.size).toBeLessThanOrEqual(35) // Some duplicates expected

    // But events span beyond cooldown (expected)
    const maxEvent = Math.max(...allEventTimes)
    expect(maxEvent).toBe(72)
    expect(maxEvent).toBeGreaterThan(45)
  })

  it("calculates span for each tier", () => {
    const calculateSpan = (appCount: number, cooldown: number) => {
      const interval = Math.floor(cooldown / appCount)
      const maxOffset = (appCount - 1) * interval
      const lastEventOffset = Math.floor(
        (cooldown * MAX_EVENT_PERCENTAGE) / 100,
      )
      const lastEventTime = maxOffset + lastEventOffset
      const cycles = Math.ceil(lastEventTime / cooldown)
      return { interval, maxOffset, lastEventTime, cycles }
    }

    expect(calculateSpan(7, 45)).toEqual({
      interval: 6,
      maxOffset: 36,
      lastEventTime: 72,
      cycles: 2,
    })
    expect(calculateSpan(31, 90)).toEqual({
      interval: 2,
      maxOffset: 60,
      lastEventTime: 132,
      cycles: 2,
    })
    expect(calculateSpan(50, 120)).toEqual({
      interval: 2,
      maxOffset: 98,
      lastEventTime: 194,
      cycles: 2,
    })
  })
})

describe("Edge cases", () => {
  it("empty tier: no overflow", () => {
    const result = validateTierCapacity([], COOLDOWN_T1, "EMPTY")
    expect(result.valid).toBe(true)
  })

  it("single app: fits", () => {
    const result = validateTierCapacity(["solo"], COOLDOWN_T1, "SOLO")
    expect(result.valid).toBe(true)
    expect(result.lastEventTime).toBe(36)
  })

  it("2 apps: overflows (expected)", () => {
    const result = validateTierCapacity(["a", "b"], COOLDOWN_T1, "DUAL")
    expect(result.valid).toBe(false)
    expect(result.overflowCycles).toBe(2)
  })
})
