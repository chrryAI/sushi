// "use client"

// import { useCallback, useEffect, useState } from "react"
// import toast from "react-hot-toast"
// import {
//   type BoardData,
//   type ConfigMap,
//   dropColumnHandler,
//   Kanban,
// } from "react-kanban-kit"
// import useSWR from "swr"
// import { useAuth } from "./context/providers"
// import { Div, P, Span } from "./platform"
// import { useNavigation } from "./platform/navigation"

// /* ── Helpers ──────────────────────────────────────────────────────────────── */

// function getApiUrl(): string {
//   if (typeof window === "undefined") return ""
//   const fromEnv = (window as any).__ENV__?.VITE_API_URL
//   if (fromEnv) return fromEnv
//   const meta = document
//     .querySelector('meta[name="api-url"]')
//     ?.getAttribute("content")
//   if (meta) return meta
//   return ""
// }

// function getToken(): string | null {
//   if (typeof window === "undefined") return null
//   try {
//     return localStorage.getItem("token")
//   } catch {
//     return null
//   }
// }

// /* ── Data fetchers ──────────────────────────────────────────────────────── */

// async function fetchUserBoard(token: string | null) {
//   if (!token) throw new Error("Unauthorized")
//   const res = await fetch(`${getApiUrl()}/kanban/user/board`, {
//     headers: { Authorization: `Bearer ${token}` },
//   })
//   if (!res.ok) throw new Error("Failed to load board")
//   return res.json()
// }

// async function fetchThreadMessages(
//   threadId: string,
//   token: string | null,
//   pageSize?: number,
// ) {
//   if (!token) throw new Error("Unauthorized")
//   const qs = pageSize ? `?pageSize=${pageSize}` : ""
//   const res = await fetch(
//     `${getApiUrl()}/kanban/user/board/unknown/threads/${threadId}/messages${qs}`,
//     { headers: { Authorization: `Bearer ${token}` } },
//   )
//   if (!res.ok) throw new Error("Failed to load messages")
//   return res.json()
// }

// /* ── Card Renderer ──────────────────────────────────────────────────────── */

// interface CardContentProps {
//   data: BoardData[string]
//   isSelected: boolean
//   onSelect: () => void
// }

// function ThreadCardContent({ data, isSelected, onSelect }: CardContentProps) {
//   return (
//     <Div
//       style={{
//         padding: "10px",
//         borderRadius: "8px",
//         background: isSelected ? "#3b2f4a" : "#1e1e2e",
//         border: `1px solid ${isSelected ? "#8b5cf6" : "#2e2e3e"}`,
//         cursor: "pointer",
//         transition: "all 0.15s ease",
//       }}
//       /* eslint-disable-next-line -- web handler */
//       onClick={(e) => {
//         e.stopPropagation()
//         onSelect()
//       }}
//     >
//       <P
//         style={{
//           margin: 0,
//           fontSize: "13px",
//           fontWeight: 500,
//           color: "#e2e8f0",
//           lineHeight: 1.35,
//           wordBreak: "break-word",
//         }}
//       >
//         {String(data.title ?? "Untitled")}
//       </P>
//       <span
//         style={{
//           display: "block",
//           marginTop: "6px",
//           fontSize: "11px",
//           color: "#94a3b8",
//         }}
//       >
//         {new Date().toLocaleDateString()}
//       </span>
//     </Div>
//   )
// }

// /* ── Messages Panel ──────────────────────────────────────────────────────── */

// function ThreadMessagesPanel({
//   threadId,
//   onClose,
// }: {
//   threadId: string
//   onClose: () => void
// }) {
//   const { token } = useAuth()
//   const { data, isLoading, error } = useSWR(
//     threadId ? ["thread-messages", threadId] : null,
//     () => fetchThreadMessages(threadId, token),
//     { revalidateOnFocus: false },
//   )

//   const messages = data?.messages ?? []

//   return (
//     <Div
//       style={{
//         position: "fixed",
//         top: 0,
//         right: 0,
//         width: "380px",
//         height: "100vh",
//         background: "#0f0f1a",
//         borderLeft: "1px solid #2e2e3e",
//         zIndex: 1000,
//         display: "flex",
//         flexDirection: "column",
//         boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
//       }}
//     >
//       {/* Header */}
//       <Div
//         style={{
//           padding: "16px 20px",
//           borderBottom: "1px solid #2e2e3e",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <Span style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
//           Thread Messages
//         </Span>
//         <Span
//           style={{
//             fontSize: "20px",
//             color: "#94a3b8",
//             cursor: "pointer",
//             lineHeight: 1,
//           }}
//           /* eslint-disable-next-line -- web handler */
//           onClick={onClose}
//         >
//           ×
//         </Span>
//       </Div>

//       {/* Messages */}
//       <Div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
//         {isLoading && (
//           <Div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
//             {Array.from({ length: 4 }).map((_, i) => (
//               <Div
//                 key={i}
//                 style={{
//                   height: "48px",
//                   borderRadius: "8px",
//                   background: "#1e1e2e",
//                   animation: "pulse 1.5s infinite",
//                 }}
//               />
//             ))}
//           </Div>
//         )}

//         {error && (
//           <P style={{ color: "#f87171", fontSize: "13px" }}>
//             Failed to load messages.
//           </P>
//         )}

//         {messages.map((msg: any) => (
//           <Div
//             key={msg.id || msg.message?.id}
//             style={{
//               padding: "10px 12px",
//               marginBottom: "8px",
//               borderRadius: "8px",
//               background: msg.message?.isUser ? "#1e3a5f" : "#1e1e2e",
//               border: `1px solid ${msg.message?.isUser ? "#3b82f6" : "#2e2e3e"}`,
//             }}
//           >
//             <P
//               style={{
//                 margin: 0,
//                 fontSize: "12px",
//                 color: "#cbd5e1",
//                 lineHeight: 1.4,
//                 whiteSpace: "pre-wrap",
//                 wordBreak: "break-word",
//               }}
//             >
//               {msg.message?.content || msg.content || ""}
//             </P>
//             <Span
//               style={{
//                 display: "block",
//                 marginTop: "4px",
//                 fontSize: "10px",
//                 color: "#64748b",
//               }}
//             >
//               {msg.message?.createdOn
//                 ? new Date(msg.message.createdOn).toLocaleString()
//                 : ""}
//             </Span>
//           </Div>
//         ))}
//       </Div>
//     </Div>
//   )
// }

// /* ── Main Board ──────────────────────────────────────────────────────────── */

// export default function AppThreadBoard() {
//   const { token } = useAuth()
//   const nav = useNavigation()

//   const { data, isLoading, error, mutate } = useSWR(
//     token ? ["kanban-user-board"] : null,
//     () => fetchUserBoard(token),
//     { revalidateOnFocus: false },
//   )

//   const [dataSource, setDataSource] = useState<BoardData | null>(null)
//   const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

//   useEffect(() => {
//     if (data?.dataSource) {
//       setDataSource(data.dataSource)
//     }
//   }, [data])

//   const handleColumnMove = useCallback(
//     (move: { columnId: string; fromIndex: number; toIndex: number }) => {
//       if (!dataSource) return
//       const next = dropColumnHandler(move, dataSource)
//       setDataSource(next)
//     },
//     [dataSource],
//   )

//   const handleCardClick = useCallback(
//     (cardId: string) => {
//       setSelectedThreadId((prev) => {
//         const next = prev === cardId ? null : cardId
//         if (next === null) return next

//         /* 1. Navigate to thread chat */
//         if (nav.push) {
//           nav.push(`/thread/${cardId}`, { clientOnly: true })
//         }
//         return next
//       })
//     },
//     [nav],
//   )

//   const configMap: ConfigMap = {
//     card: {
//       render: ({ data }) => {
//         const cardId = String(data.id)
//         return (
//           <ThreadCardContent
//             data={data}
//             isSelected={selectedThreadId === cardId}
//             onSelect={() => handleCardClick(cardId)}
//           />
//         )
//       },
//       isDraggable: true,
//     },
//   }

//   if (isLoading) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           gap: "16px",
//           padding: "16px",
//           overflowX: "auto",
//           minHeight: "100%",
//           background: "#0a0a14",
//         }}
//       >
//         {Array.from({ length: 4 }).map((_, i) => (
//           <div
//             key={i}
//             style={{
//               minWidth: "280px",
//               height: "500px",
//               borderRadius: "12px",
//               background: "#13131f",
//               animation: "pulse 2s infinite",
//             }}
//           />
//         ))}
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div
//         style={{
//           padding: "40px",
//           textAlign: "center",
//           color: "#94a3b8",
//           fontSize: "14px",
//         }}
//       >
//         Failed to load board.{" "}
//         <button
//           style={{
//             background: "none",
//             border: "none",
//             color: "#8b5cf6",
//             cursor: "pointer",
//             textDecoration: "underline",
//             fontSize: "14px",
//           }}
//           onClick={() => {
//             mutate()
//           }}
//           type="button"
//         >
//           Retry
//         </button>
//       </div>
//     )
//   }

//   if (!dataSource) {
//     return (
//       <div
//         style={{
//           padding: "40px",
//           textAlign: "center",
//           color: "#64748b",
//           fontSize: "14px",
//         }}
//       >
//         No threads yet.
//       </div>
//     )
//   }

//   // Count actual threads per column for header
//   const columnCardCounts: Record<string, number> = {}
//   for (const key in dataSource) {
//     const item = dataSource[key]
//     if (item.parentId === "root") {
//       columnCardCounts[key] = item.children?.length ?? 0
//     }
//   }

//   return (
//     <div
//       style={{ position: "relative", height: "100%", background: "#0a0a14" }}
//     >
//       <Kanban
//         dataSource={dataSource}
//         configMap={configMap}
//         allowColumnDrag
//         viewOnly={false}
//         virtualization={false}
//         cardsGap={8}
//         onColumnMove={handleColumnMove}
//         renderColumnHeader={(column) => (
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               padding: "12px 14px",
//               borderBottom: "1px solid #2e2e3e",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 color: "#e2e8f0",
//                 letterSpacing: "0.2px",
//                 textTransform: "capitalize",
//               }}
//             >
//               {String(column.title ?? "Untitled")}
//             </span>
//             <span
//               style={{
//                 fontSize: "11px",
//                 fontWeight: 500,
//                 color: "#8b5cf6",
//                 background: "rgba(139,92,246,0.12)",
//                 borderRadius: "10px",
//                 padding: "2px 8px",
//               }}
//             >
//               {columnCardCounts[column.id] ?? 0}
//             </span>
//           </div>
//         )}
//         columnWrapperStyle={() => ({
//           background: "#13131f",
//           borderRadius: "12px",
//           minWidth: "280px",
//           maxWidth: "280px",
//           border: "1px solid #2e2e3e",
//           overflow: "hidden",
//         })}
//         columnWrapperClassName="kanban-column"
//         columnListContentStyle={() => ({
//           padding: "10px",
//         })}
//         rootClassName="kanban-user-board"
//         rootStyle={{
//           padding: "16px",
//           gap: "14px",
//           background: "#0a0a14",
//           minHeight: "100%",
//         }}
//       />

//       {/* Inline Messages Panel */}
//       {selectedThreadId && (
//         <ThreadMessagesPanel
//           threadId={selectedThreadId}
//           onClose={() => setSelectedThreadId(null)}
//         />
//       )}
//     </div>
//   )
// }
