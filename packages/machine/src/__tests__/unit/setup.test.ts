import { describe, expect, it } from "vitest"

describe("@chrryai/machine setup", () => {
  it("should be configured correctly", () => {
    expect(true).toBe(true)
  })

  it("should import effect modules", async () => {
    const { Effect } = await import("effect")
    expect(Effect).toBeDefined()
    expect(typeof Effect.gen).toBe("function")
  })

  it("should import xstate modules", async () => {
    const { createMachine } = await import("xstate")
    expect(createMachine).toBeDefined()
    expect(typeof createMachine).toBe("function")
  })
})
