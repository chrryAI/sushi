import type { ramen, sushi } from "@chrryai/donut/types"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePayloadBuilder } from "../usePayloadBuilder"

// Mock @xstate/react
const mockSend = vi.fn()
const mockState = {
  value: "idle",
  context: {
    payload: {},
    resolvedApp: null,
    n8nJobId: null,
    error: null,
  },
  matches: vi.fn(() => false),
}

vi.mock("@xstate/react", () => ({
  useMachine: () => [mockState, mockSend],
}))

// Mock spatialNav store
const mockNavigate = vi.fn()
const mockCurrentApp: { app: { id: string; slug: string } } | null = null

vi.mock("@chrryai/ai-core/stores/spatialNav", () => ({
  useSpatialNav: () => ({ navigate: mockNavigate }),
  useCurrentApp: () => mockCurrentApp,
}))

// Mock payloadMachine
vi.mock("@chrryai/ai-core/machines/payloadMachine", () => ({
  payloadMachine: {},
}))

describe("usePayloadBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    Object.assign(mockState, {
      value: "idle",
      context: {
        payload: {},
        resolvedApp: null,
        n8nJobId: null,
        error: null,
      },
      matches: vi.fn(() => false),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("return values", () => {
    it("should return machineState", () => {
      mockState.value = "resolving"
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.machineState).toBe("resolving")
    })

    it("should return payload from context", () => {
      mockState.context.payload = { id: "test-id", slug: "test-slug" }
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.payload).toEqual({
        id: "test-id",
        slug: "test-slug",
      })
    })

    it("should return resolvedApp from context", () => {
      const resolvedApp = { id: "resolved-1", name: "Test App" } as sushi
      mockState.context.resolvedApp = resolvedApp
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.resolvedApp).toEqual(resolvedApp)
    })

    it("should return n8nJobId from context", () => {
      mockState.context.n8nJobId = "job-123"
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.n8nJobId).toBe("job-123")
    })

    it("should return error from context", () => {
      mockState.context.error = "Something went wrong"
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.error).toBe("Something went wrong")
    })

    it("should return currentApp from spatial nav", () => {
      vi.mocked(mockCurrentApp, { partial: true }).mockReturnValue({
        app: { id: "spatial-app", slug: "spatial-slug" },
      } as any)

      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.currentApp).toEqual({
        app: { id: "spatial-app", slug: "spatial-slug" },
      })
    })
  })

  describe("isLoading", () => {
    it("should be true in resolving state", () => {
      mockState.matches = vi.fn((state) => state === "resolving")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(true)
    })

    it("should be true in running state", () => {
      mockState.matches = vi.fn((state) => state === "running")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(true)
    })

    it("should be true in previewing state", () => {
      mockState.matches = vi.fn((state) => state === "previewing")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(true)
    })

    it("should be false in idle state", () => {
      mockState.matches = vi.fn((state) => state === "resolving")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(false)
    })

    it("should be false in done state", () => {
      mockState.matches = vi.fn((state) => state === "resolving")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("isDone", () => {
    it("should be true in done state", () => {
      mockState.matches = vi.fn((state) => state === "done")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isDone).toBe(true)
    })

    it("should be false in other states", () => {
      mockState.matches = vi.fn((state) => state === "done")
      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isDone).toBe(false)
    })
  })

  describe("actions", () => {
    describe("update", () => {
      it("should send UPDATE event with patch", () => {
        const { result } = renderHook(() => usePayloadBuilder())
        const patch: Partial<ramen> = { id: "test-id", slug: "test-slug" }

        act(() => {
          result.current.update(patch)
        })

        expect(mockSend).toHaveBeenCalledWith({ type: "UPDATE", patch })
      })
    })

    describe("preview", () => {
      it("should send PREVIEW event", () => {
        const { result } = renderHook(() => usePayloadBuilder())

        act(() => {
          result.current.preview()
        })

        expect(mockSend).toHaveBeenCalledWith({ type: "PREVIEW" })
      })
    })

    describe("sendToN8n", () => {
      it("should send SEND_TO_N8N event", () => {
        const { result } = renderHook(() => usePayloadBuilder())

        act(() => {
          result.current.sendToN8n()
        })

        expect(mockSend).toHaveBeenCalledWith({ type: "SEND_TO_N8N" })
      })
    })

    describe("reset", () => {
      it("should send RESET event", () => {
        const { result } = renderHook(() => usePayloadBuilder())

        act(() => {
          result.current.reset()
        })

        expect(mockSend).toHaveBeenCalledWith({ type: "RESET" })
      })
    })

    describe("retry", () => {
      it("should send RETRY event", () => {
        const { result } = renderHook(() => usePayloadBuilder())

        act(() => {
          result.current.retry()
        })

        expect(mockSend).toHaveBeenCalledWith({ type: "RETRY" })
      })
    })
  })

  describe("updateFromSpatial", () => {
    it("should inject current app id and slug when currentApp exists", () => {
      // Need to mock the module with currentApp
      vi.doMock("@chrryai/ai-core/stores/spatialNav", () => ({
        useSpatialNav: () => ({ navigate: mockNavigate }),
        useCurrentApp: () => ({
          app: { id: "spatial-id", slug: "spatial-slug" },
        }),
      }))

      const { result } = renderHook(() => usePayloadBuilder())
      const patch: Partial<ramen> = { join: { memories: { user: 5 } } }

      act(() => {
        result.current.updateFromSpatial(patch)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE",
        patch: {
          join: { memories: { user: 5 } },
          id: "spatial-id",
          slug: "spatial-slug",
        },
      })

      vi.doUnmock("@chrryai/ai-core/stores/spatialNav")
    })

    it("should send patch as-is when currentApp is null", () => {
      vi.doMock("@chrryai/ai-core/stores/spatialNav", () => ({
        useSpatialNav: () => ({ navigate: mockNavigate }),
        useCurrentApp: () => null,
      }))

      const { result } = renderHook(() => usePayloadBuilder())
      const patch: Partial<ramen> = { id: "manual-id" }

      act(() => {
        result.current.updateFromSpatial(patch)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE",
        patch: { id: "manual-id" },
      })

      vi.doUnmock("@chrryai/ai-core/stores/spatialNav")
    })
  })

  describe("navigateAndBuild", () => {
    it("should call spatial navigate with app", () => {
      const { result } = renderHook(() => usePayloadBuilder())
      const app = { id: "new-app", slug: "new-slug", name: "New App" }

      act(() => {
        result.current.navigateAndBuild(app)
      })

      expect(mockNavigate).toHaveBeenCalledWith(app)
    })

    it("should send UPDATE with app id, slug and patch", () => {
      const { result } = renderHook(() => usePayloadBuilder())
      const app = { id: "new-app", slug: "new-slug", name: "New App" }
      const patch = { join: { memories: { user: 5 } } }

      act(() => {
        result.current.navigateAndBuild(app, patch)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE",
        patch: {
          id: "new-app",
          slug: "new-slug",
          ...patch,
        },
      })
    })

    it("should work without optional patch", () => {
      const { result } = renderHook(() => usePayloadBuilder())
      const app = { id: "new-app", slug: "new-slug", name: "New App" }

      act(() => {
        result.current.navigateAndBuild(app)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE",
        patch: {
          id: "new-app",
          slug: "new-slug",
        },
      })
    })
  })

  describe("integration scenarios", () => {
    it("should handle complete workflow from idle to done", () => {
      const { result, rerender } = renderHook(() => usePayloadBuilder())

      // Initial state
      expect(result.current.machineState).toBe("idle")
      expect(result.current.isLoading).toBe(false)

      // Update payload
      const patch = { id: "app-1", slug: "test-app" }
      act(() => {
        result.current.update(patch)
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "UPDATE", patch })

      // Send to n8n
      act(() => {
        result.current.sendToN8n()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "SEND_TO_N8N" })
    })

    it("should handle spatial navigation integration", () => {
      const { result } = renderHook(() => usePayloadBuilder())

      // Navigate to an app with additional payload data
      const app = { id: "atlas-id", slug: "atlas", name: "Atlas" }
      const additionalPayload = { join: { memories: { user: 5 } } }

      act(() => {
        result.current.navigateAndBuild(app, additionalPayload)
      })

      // Should have called navigate
      expect(mockNavigate).toHaveBeenCalledWith(app)

      // Should have updated payload with merged data
      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE",
        patch: {
          id: "atlas-id",
          slug: "atlas",
          join: { memories: { user: 5 } },
        },
      })
    })

    it("should handle error and retry flow", () => {
      const { result } = renderHook(() => usePayloadBuilder())

      // Simulate error state
      mockState.context.error = "Network error"

      // Retry
      act(() => {
        result.current.retry()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "RETRY" })
    })

    it("should handle reset after completion", () => {
      const { result } = renderHook(() => usePayloadBuilder())

      // Complete workflow
      act(() => {
        result.current.update({ id: "app-1" })
        result.current.sendToN8n()
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(mockSend).toHaveBeenLastCalledWith({ type: "RESET" })
    })
  })

  describe("state transitions visibility", () => {
    it("should expose correct loading states during preview", () => {
      mockState.matches = vi.fn((state) => state === "previewing")

      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isDone).toBe(false)
    })

    it("should expose correct loading states during n8n execution", () => {
      mockState.matches = vi.fn((state) => state === "running")

      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isDone).toBe(false)
    })

    it("should show done state correctly", () => {
      mockState.matches = vi.fn((state) => state === "done")

      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isDone).toBe(true)
    })

    it("should show error state correctly", () => {
      mockState.context.error = "Something failed"
      mockState.value = "error"

      const { result } = renderHook(() => usePayloadBuilder())

      expect(result.current.error).toBe("Something failed")
      expect(result.current.machineState).toBe("error")
    })
  })
})
