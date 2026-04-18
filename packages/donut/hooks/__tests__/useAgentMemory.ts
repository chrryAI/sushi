// import "fake-indexeddb/auto"
// import { renderHook, waitFor } from "@testing-library/react"
// import { describe, expect, it } from "vitest"
// import { useAgentMemory } from "../useAgentMemory"

// describe("useAgentMemory", () => {
//   it("indexes a post and finds it via the hook", async () => {
//     const { result } = renderHook(() => useAgentMemory("jules-hook-1"))

//     await result.current.indexPost({
//       id: "hook-post-1",
//       content: "Hello from hook",
//       agentId: "jules",
//       embedding: [1, 0, 0],
//       timestamp: Date.now(),
//     })

//     const similar = await waitFor(() =>
//       result.current.findSimilar([1, 0, 0], 5),
//     )

//     expect(similar.length).toBe(1)
//     expect(similar[0]!.id).toBe("hook-post-1")
//     expect(similar[0]!.similarity).toBeCloseTo(1, 5)
//   })

//   it("isolates agents across hook instances", async () => {
//     const { result: pearHook } = renderHook(() => useAgentMemory("pear-hook-2"))
//     const { result: julesHook } = renderHook(() =>
//       useAgentMemory("jules-hook-2"),
//     )

//     await pearHook.current.indexPost({
//       id: "pear-secret",
//       content: "Pear only",
//       agentId: "pear",
//       embedding: [0, 1, 0],
//       timestamp: Date.now(),
//     })

//     const pearResults = await waitFor(() =>
//       pearHook.current.findSimilar([0, 1, 0], 5),
//     )
//     const julesResults = await waitFor(() =>
//       julesHook.current.findSimilar([0, 1, 0], 5),
//     )

//     expect(pearResults.length).toBe(1)
//     expect(pearResults[0]!.id).toBe("pear-secret")
//     expect(julesResults.length).toBe(0)
//   })
// })
