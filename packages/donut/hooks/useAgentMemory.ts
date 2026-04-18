// import {
//   type AgentPost,
//   type AgentVectorMemory,
//   createAgentVectorMemory,
// } from "@chrryai/agent-memory"
// import { useCallback, useMemo, useRef } from "react"

// export interface UseAgentMemoryReturn {
//   memory: AgentVectorMemory
//   indexPost: (post: AgentPost) => Promise<void>
//   findSimilar: (
//     embedding: number[],
//     limit?: number,
//   ) => ReturnType<AgentVectorMemory["findSimilar"]>
// }

// export function useAgentMemory(agentSlug: string): UseAgentMemoryReturn {
//   const memoryRef = useRef<AgentVectorMemory | null>(null)

//   if (memoryRef.current === null) {
//     memoryRef.current = createAgentVectorMemory(agentSlug)
//   }

//   const memory = memoryRef.current

//   const indexPost = useCallback(
//     async (post: AgentPost) => {
//       await memory.indexPost(post)
//     },
//     [memory],
//   )

//   const findSimilar = useCallback(
//     async (embedding: number[], limit?: number) => {
//       return memory.findSimilar(embedding, limit)
//     },
//     [memory],
//   )

//   return useMemo(
//     () => ({
//       memory,
//       indexPost,
//       findSimilar,
//     }),
//     [memory, indexPost, findSimilar],
//   )
// }
