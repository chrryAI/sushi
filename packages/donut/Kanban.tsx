// "use client"

// import { useCallback, useEffect, useState } from "react"
// import toast from "react-hot-toast"
// import useSWR from "swr"
// import { useAuth } from "./context/providers"
// import { Button, Div, P, Span } from "./platform"

// interface Label {
//   name: string
//   color: string
// }

// interface Task {
//   id: string
//   title: string
//   description?: string
//   columnId: string
//   labels?: string[]
//   labelColors?: Record<string, string>
//   selected?: boolean
//   order?: number
// }

// interface Column {
//   id: string
//   title: string
//   color?: string
//   order: number
//   tasks: Task[]
// }

// interface KanbanProps {
//   boardId: string
//   appId?: string
//   /** Called when a task is selected — integrates with TimerContext */
//   onTaskSelect?: (taskId: string, selected: boolean) => void
//   viewOnly?: boolean
// }

// export default function Kanban({
//   boardId,
//   appId,
//   onTaskSelect,
//   viewOnly = false,
// }: KanbanProps) {
//   const { token, actions } = useAuth()
//   const [addingCard, setAddingCard] = useState<string | null>(null)
//   const [newCardTitle, setNewCardTitle] = useState("")
//   const [selectedLabels, setSelectedLabels] = useState<string[]>([])

//   const { data, isLoading, mutate } = useSWR(
//     token && boardId ? ["kanban", boardId] : null,
//     () => actions.getKanbanBoard(boardId),
//   )

//   const { data: labelsData } = useSWR(
//     token && boardId ? ["kanban-labels", boardId] : null,
//     () => actions.getKanbanLabels?.(boardId),
//   )

//   const handleCardMove = useCallback(
//     async (taskId: string, toColumnId: string) => {
//       try {
//         await actions.moveKanbanTask(taskId, {
//           toStateId: toColumnId,
//         })
//         mutate()
//       } catch {
//         toast.error("Failed to move task")
//       }
//     },
//     [actions, mutate],
//   )

//   const handleAddCard = useCallback(
//     async (columnId: string) => {
//       if (!newCardTitle.trim()) return
//       try {
//         await actions.createKanbanTask(boardId, {
//           title: newCardTitle.trim(),
//           taskStateId: columnId,
//           labels: selectedLabels.length > 0 ? selectedLabels : undefined,
//         })
//         setNewCardTitle("")
//         setSelectedLabels([])
//         setAddingCard(null)
//         mutate()
//       } catch {
//         toast.error("Failed to create task")
//       }
//     },
//     [actions, boardId, newCardTitle, selectedLabels, mutate],
//   )

//   const handleDeleteCard = useCallback(
//     async (taskId: string) => {
//       try {
//         await actions.deleteKanbanTask(taskId)
//         mutate()
//       } catch {
//         toast.error("Failed to delete task")
//       }
//     },
//     [actions, mutate],
//   )

//   const handleToggleSelect = useCallback(
//     async (taskId: string, current: boolean) => {
//       try {
//         await actions.updateKanbanTask(taskId, { selected: !current })
//         onTaskSelect?.(taskId, !current)
//         mutate()
//       } catch {
//         toast.error("Failed to update task")
//       }
//     },
//     [actions, onTaskSelect, mutate],
//   )

//   const availableLabels: Label[] = labelsData?.labels || []

//   // Transform dataSource into columns
//   const columns: Column[] = []
//   if (data?.dataSource && data?.states) {
//     for (const state of data.states) {
//       const colTasks: Task[] = []
//       const columnData = data.dataSource[state.id]
//       if (columnData?.children) {
//         for (const taskId of columnData.children) {
//           const taskData = data.dataSource[taskId]
//           if (taskData) {
//             colTasks.push({
//               id: taskId,
//               title: taskData.title,
//               description: taskData.content?.description,
//               columnId: state.id,
//               labels: taskData.content?.labels || [],
//               labelColors: taskData.content?.labelColors || {},
//               selected: taskData.content?.selected,
//               order: taskData.content?.order,
//             })
//           }
//         }
//       }
//       columns.push({
//         id: state.id,
//         title: state.title,
//         color: state.color,
//         order: state.order,
//         tasks: colTasks.sort((a, b) => (a.order || 0) - (b.order || 0)),
//       })
//     }
//     columns.sort((a, b) => a.order - b.order)
//   }

//   if (isLoading) {
//     return (
//       <Div
//         style={{
//           display: "flex",
//           gap: "16px",
//           padding: "16px",
//           overflowX: "auto",
//         }}
//       >
//         {[1, 2, 3].map((i) => (
//           <Div
//             key={i}
//             style={{
//               minWidth: "280px",
//               height: "400px",
//               background: "#f3f4f6",
//               borderRadius: "8px",
//               animation: "pulse 2s infinite",
//             }}
//           />
//         ))}
//       </Div>
//     )
//   }

//   if (!data?.dataSource) return null

//   return (
//     <Div
//       style={{
//         display: "flex",
//         gap: "16px",
//         padding: "16px",
//         overflowX: "auto",
//         minHeight: "100%",
//       }}
//     >
//       {columns.map((column) => (
//         <Div
//           key={column.id}
//           style={{
//             minWidth: "280px",
//             maxWidth: "280px",
//             background: "#f9fafb",
//             borderRadius: "8px",
//             display: "flex",
//             flexDirection: "column",
//             maxHeight: "calc(100vh - 200px)",
//           }}
//         >
//           {/* Column Header */}
//           <Div
//             style={{
//               padding: "12px 16px",
//               borderTop: `3px solid ${column.color || "#6366f1"}`,
//               borderBottom: "1px solid #e5e7eb",
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <Span style={{ fontWeight: 600, fontSize: "14px" }}>
//               {column.title}
//             </Span>
//             <Span
//               style={{
//                 fontSize: "12px",
//                 color: "#6b7280",
//                 background: "#e5e7eb",
//                 padding: "2px 8px",
//                 borderRadius: "12px",
//               }}
//             >
//               {column.tasks.length}
//             </Span>
//           </Div>

//           {/* Tasks */}
//           <Div
//             style={{
//               flex: 1,
//               overflowY: "auto",
//               padding: "8px",
//               display: "flex",
//               flexDirection: "column",
//               gap: "8px",
//             }}
//           >
//             {column.tasks.map((task) => (
//               <Div
//                 key={task.id}
//                 onClick={() => handleToggleSelect(task.id, !!task.selected)}
//                 style={{
//                   background: task.selected ? "#eff6ff" : "#ffffff",
//                   border: task.selected
//                     ? "2px solid #3b82f6"
//                     : "1px solid #e5e7eb",
//                   borderRadius: "6px",
//                   padding: "12px",
//                   cursor: "pointer",
//                   position: "relative",
//                 }}
//               >
//                 {/* Labels */}
//                 {task.labels && task.labels.length > 0 && (
//                   <Div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "4px",
//                       marginBottom: "8px",
//                     }}
//                   >
//                     {task.labels.map((label) => (
//                       <Span
//                         key={label}
//                         style={{
//                           fontSize: "10px",
//                           padding: "2px 8px",
//                           borderRadius: "4px",
//                           backgroundColor:
//                             task.labelColors?.[label] || "#6366f1",
//                           color: "#fff",
//                           fontWeight: 500,
//                         }}
//                       >
//                         {label}
//                       </Span>
//                     ))}
//                   </Div>
//                 )}

//                 <P style={{ fontSize: "14px", margin: 0 }}>{task.title}</P>

//                 {task.description && (
//                   <P
//                     style={{
//                       fontSize: "12px",
//                       color: "#6b7280",
//                       margin: "4px 0 0 0",
//                     }}
//                   >
//                     {task.description.slice(0, 100)}
//                     {task.description.length > 100 ? "..." : ""}
//                   </P>
//                 )}

//                 <Div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginTop: "8px",
//                   }}
//                 >
//                   {task.selected && (
//                     <Span
//                       style={{
//                         fontSize: "11px",
//                         color: "#3b82f6",
//                         background: "#dbeafe",
//                         padding: "2px 8px",
//                         borderRadius: "4px",
//                       }}
//                     >
//                       ⏱ Timer
//                     </Span>
//                   )}
//                   {!viewOnly && (
//                     <Button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         handleDeleteCard(task.id)
//                       }}
//                       style={{
//                         background: "transparent",
//                         border: "none",
//                         color: "#9ca3af",
//                         cursor: "pointer",
//                         fontSize: "18px",
//                         padding: "0 4px",
//                       }}
//                     >
//                       ×
//                     </Button>
//                   )}
//                 </Div>
//               </Div>
//             ))}
//           </Div>

//           {/* Add Card */}
//           {!viewOnly && (
//             <Div style={{ padding: "8px" }}>
//               {addingCard === column.id ? (
//                 <Div
//                   style={{
//                     background: "#ffffff",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: "6px",
//                     padding: "12px",
//                   }}
//                 >
//                   <input
//                     autoFocus
//                     style={{
//                       width: "100%",
//                       padding: "8px",
//                       border: "1px solid #d1d5db",
//                       borderRadius: "4px",
//                       fontSize: "14px",
//                       marginBottom: "8px",
//                     }}
//                     placeholder="Task title..."
//                     value={newCardTitle}
//                     onChange={(e) => setNewCardTitle(e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") handleAddCard(column.id)
//                       if (e.key === "Escape") {
//                         setAddingCard(null)
//                         setNewCardTitle("")
//                         setSelectedLabels([])
//                       }
//                     }}
//                   />

//                   {/* Label selector */}
//                   {availableLabels.length > 0 && (
//                     <Div style={{ marginBottom: "8px" }}>
//                       <Span
//                         style={{
//                           fontSize: "11px",
//                           color: "#6b7280",
//                           marginBottom: "4px",
//                           display: "block",
//                         }}
//                       >
//                         Labels:
//                       </Span>
//                       <Div
//                         style={{
//                           display: "flex",
//                           flexWrap: "wrap",
//                           gap: "4px",
//                         }}
//                       >
//                         {availableLabels.map((label) => (
//                           <Button
//                             key={label.name}
//                             onClick={() => {
//                               setSelectedLabels((prev) =>
//                                 prev.includes(label.name)
//                                   ? prev.filter((l) => l !== label.name)
//                                   : [...prev, label.name],
//                               )
//                             }}
//                             style={{
//                               fontSize: "10px",
//                               padding: "4px 8px",
//                               borderRadius: "4px",
//                               border: `1px solid ${label.color}`,
//                               background: selectedLabels.includes(label.name)
//                                 ? label.color
//                                 : "transparent",
//                               color: selectedLabels.includes(label.name)
//                                 ? "#fff"
//                                 : label.color,
//                               cursor: "pointer",
//                             }}
//                           >
//                             {label.name}
//                           </Button>
//                         ))}
//                       </Div>
//                     </Div>
//                   )}

//                   <Div style={{ display: "flex", gap: "8px" }}>
//                     <Button
//                       onClick={() => handleAddCard(column.id)}
//                       style={{
//                         padding: "6px 12px",
//                         background: "#3b82f6",
//                         color: "#fff",
//                         border: "none",
//                         borderRadius: "4px",
//                         cursor: "pointer",
//                         fontSize: "13px",
//                       }}
//                     >
//                       Add
//                     </Button>
//                     <Button
//                       onClick={() => {
//                         setAddingCard(null)
//                         setNewCardTitle("")
//                         setSelectedLabels([])
//                       }}
//                       style={{
//                         padding: "6px 12px",
//                         background: "transparent",
//                         color: "#6b7280",
//                         border: "1px solid #d1d5db",
//                         borderRadius: "4px",
//                         cursor: "pointer",
//                         fontSize: "13px",
//                       }}
//                     >
//                       Cancel
//                     </Button>
//                   </Div>
//                 </Div>
//               ) : (
//                 <Button
//                   onClick={() => setAddingCard(column.id)}
//                   style={{
//                     width: "100%",
//                     padding: "8px",
//                     background: "transparent",
//                     border: "1px dashed #d1d5db",
//                     borderRadius: "6px",
//                     color: "#6b7280",
//                     cursor: "pointer",
//                     fontSize: "13px",
//                     textAlign: "left",
//                   }}
//                 >
//                   + Add card
//                 </Button>
//               )}
//             </Div>
//           )}
//         </Div>
//       ))}
//     </Div>
//   )
// }
