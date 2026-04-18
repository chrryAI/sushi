// "use client"

// import { Copy, Download, RotateCcw, Zap } from "lucide-react" // icon istiyorsan
// import React, { useMemo, useState } from "react"

// type JoinKey = "memories" | "instructions" | "characterProfile" | "placeholders";
// type JoinScope = "user" | "app" | "dna" | "thread";

// interface RamenPayload {
//   // Identity
//   id?: string;
//   slug?: string;
//   name?: string;
//   userId?: string;
//   guestId?: string;
//   ownerId?: string;
//   role?: string;
//   isSystem?: boolean;
//   skipCache?: boolean;
//   llm?: string;

//   // Store
//   storeId?: string;
//   storeSlug?: string;
//   storeDomain?: string;
//   threadId?: string;

//   // Query scope
//   depth?: number; // -1 → 5
//   include?: string[];
//   exclude?: string[];

//   // Join config (4x4)
//   join?: Partial<Record<JoinKey, Partial<Record<JoinScope, number>>>>;

//   // Extra (istediğin her şeyi ekleyebilirsin)
//   [key: string]: any;
// }

// export default function ChopStickCalculator() {
//   const [payload, setPayload] =
//     useState <
//     RamenPayload >
//     {
//       id: "",
//       slug: "",
//       userId: "",
//       guestId: "",
//       depth: 2,
//       include: [],
//       exclude: [],
//       join: {
//         memories: { user: 5, app: 3 },
//         instructions: { user: 3, app: 3, thread: 2 },
//         characterProfile: { user: 1, app: 1 },
//         placeholders: { user: 2, thread: 2 },
//       },
//       isSystem: false,
//       skipCache: false,
//       llm: "deepseek/deepseek-v3.2",
//     }

//   const updateField = (key: string, value: any) => {
//     setPayload((prev) => ({ ...prev, [key]: value }))
//   }

//   const updateJoin = (key: JoinKey, scope: JoinScope, value: number) => {
//     setPayload((prev) => ({
//       ...prev,
//       join: {
//         ...prev.join,
//         [key]: {
//           ...(prev.join?.[key] || {}),
//           [scope]: value,
//         },
//       },
//     }))
//   }

//   const toggleArray = (key: "include" | "exclude", item: string) => {
//     setPayload((prev) => {
//       const arr = prev[key] || []
//       return {
//         ...prev,
//         [key]: arr.includes(item)
//           ? arr.filter((i) => i !== item)
//           : [...arr, item],
//       }
//     })
//   }

//   const presets = {
//     reset: {},
//     light: {
//       depth: 1,
//       join: { memories: { user: 3 }, instructions: { user: 2 } },
//     },
//     full: {
//       depth: 3,
//       join: {
//         memories: { user: 8, app: 5, dna: 3 },
//         instructions: { user: 5, app: 5, thread: 5 },
//         characterProfile: { user: 2, app: 2 },
//         placeholders: { user: 3, thread: 3 },
//       },
//     },
//     hippo: {
//       depth: 5,
//       join: {
//         memories: { user: 15, app: 10, dna: 8 },
//         instructions: { user: 10, app: 10, thread: 10 },
//       },
//       skipCache: true,
//     },
//   }

//   const jsonString = useMemo(() => JSON.stringify(payload, null, 2), [payload])
//   const keyCount = Object.keys(payload).length
//   const joinTotal = Object.values(payload.join || {}).reduce(
//     (sum, obj) =>
//       sum + Object.values(obj || {}).reduce((a, b) => a + (b as number), 0),
//     0,
//   )

//   return (
//     <div className="max-w-6xl mx-auto p-6 font-mono text-sm bg-zinc-950 text-zinc-100">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Zap className="w-6 h-6 text-yellow-400" />
//           chopStick Payload Calculator
//         </h1>
//         <div className="flex gap-2">
//           {Object.keys(presets).map((name) => (
//             <button
//               key={name}
//               onClick={() =>
//                 setPayload((p) => ({
//                   ...p,
//                   ...presets[name as keyof typeof presets],
//                 }))
//               }
//               className="px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs uppercase"
//             >
//               {name}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="grid grid-cols-12 gap-6">
//         {/* LEFT FORM */}
//         <div className="col-span-7 space-y-8">
//           {/* Identity */}
//           <div>
//             <h2 className="text-lg mb-3 text-emerald-400">Identity</h2>
//             <div className="grid grid-cols-3 gap-4">
//               {[
//                 "id",
//                 "slug",
//                 "name",
//                 "userId",
//                 "guestId",
//                 "ownerId",
//                 "role",
//                 "llm",
//               ].map((field) => (
//                 <div key={field}>
//                   <label className="block text-xs text-zinc-400 mb-1">
//                     {field}
//                   </label>
//                   <input
//                     value={(payload as any)[field] || ""}
//                     onChange={(e) => updateField(field, e.target.value)}
//                     className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
//                   />
//                 </div>
//               ))}
//               <div className="flex gap-4">
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={payload.isSystem || false}
//                     onChange={(e) => updateField("isSystem", e.target.checked)}
//                   />
//                   <span className="text-xs">isSystem</span>
//                 </label>
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={payload.skipCache || false}
//                     onChange={(e) => updateField("skipCache", e.target.checked)}
//                   />
//                   <span className="text-xs">skipCache</span>
//                 </label>
//               </div>
//             </div>
//           </div>

//           {/* Store */}
//           <div>
//             <h2 className="text-lg mb-3 text-sky-400">Store / Thread</h2>
//             <div className="grid grid-cols-4 gap-4">
//               {["storeId", "storeSlug", "storeDomain", "threadId"].map(
//                 (field) => (
//                   <div key={field}>
//                     <label className="block text-xs text-zinc-400 mb-1">
//                       {field}
//                     </label>
//                     <input
//                       value={(payload as any)[field] || ""}
//                       onChange={(e) => updateField(field, e.target.value)}
//                       className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
//                     />
//                   </div>
//                 ),
//               )}
//             </div>
//           </div>

//           {/* Query Scope */}
//           <div>
//             <h2 className="text-lg mb-3 text-violet-400">Query Scope</h2>
//             <div className="flex items-center gap-8">
//               <div className="flex-1">
//                 <label className="block text-xs text-zinc-400 mb-2">
//                   depth (-1 → 5)
//                 </label>
//                 <input
//                   type="range"
//                   min="-1"
//                   max="5"
//                   value={payload.depth ?? 2}
//                   onChange={(e) => updateField("depth", Number(e.target.value))}
//                   className="w-full accent-violet-500"
//                 />
//                 <div className="text-center text-xs text-violet-400">
//                   {payload.depth ?? 2}
//                 </div>
//               </div>

//               <div className="flex-1">
//                 <label className="block text-xs text-zinc-400 mb-2">
//                   include / exclude
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   {[
//                     "memories",
//                     "instructions",
//                     "dna",
//                     "rag",
//                     "calendar",
//                     "characterProfile",
//                   ].map((item) => (
//                     <button
//                       key={item}
//                       onClick={() => toggleArray("include", item)}
//                       className={`px-3 py-1 text-xs rounded-full border ${
//                         payload.include?.includes(item)
//                           ? "bg-emerald-500 border-emerald-500 text-black"
//                           : "border-zinc-700 hover:border-zinc-400"
//                       }`}
//                     >
//                       +{item}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Join 4x4 Grid */}
//           <div>
//             <h2 className="text-lg mb-3 text-amber-400">Join Config (4×4)</h2>
//             <div className="grid grid-cols-5 gap-px bg-zinc-800 p-px rounded">
//               {/* Header */}
//               <div className="bg-zinc-900 p-2 text-xs font-bold"></div>
//               {(["user", "app", "dna", "thread"] as JoinScope[]).map(
//                 (scope) => (
//                   <div
//                     key={scope}
//                     className="bg-zinc-900 p-2 text-xs font-bold text-center"
//                   >
//                     {scope}
//                   </div>
//                 ),
//               )}

//               {/* Rows */}
//               {(
//                 ["memories", "instructions", "characterProfile", "placeholders"] as JoinKey[]
//               ).map((key) => (
//                 <React.Fragment key={key}>
//                   <div className="bg-zinc-900 p-2 text-xs font-medium">
//                     {key}
//                   </div>
//                   {(["user", "app", "dna", "thread"] as JoinScope[]).map(
//                     (scope) => (
//                       <div key={`${key}-${scope}`} className="bg-zinc-900 p-1">
//                         <input
//                           type="number"
//                           min="0"
//                           max="20"
//                           value={payload.join?.[key]?.[scope] ?? 0}
//                           onChange={(e) =>
//                             updateJoin(key, scope, Number(e.target.value))
//                           }
//                           className="w-full text-center bg-transparent text-sm"
//                         />
//                       </div>
//                     ),
//                   )}
//                 </React.Fragment>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT LIVE JSON + STATS */}
//         <div className="col-span-5 space-y-6">
//           <div className="bg-zinc-900 border border-zinc-700 rounded p-4 h-[520px] flex flex-col">
//             <div className="flex justify-between text-xs mb-2">
//               <span className="text-emerald-400">LIVE PAYLOAD JSON</span>
//               <button
//                 onClick={() => navigator.clipboard.writeText(jsonString)}
//                 className="flex items-center gap-1 hover:text-white"
//               >
//                 <Copy className="w-3 h-3" /> copy
//               </button>
//             </div>
//             <pre className="flex-1 overflow-auto text-xs bg-black p-3 rounded text-zinc-300 font-light">
//               {jsonString}
//             </pre>

//             {/* Stats */}
//             <div className="mt-4 grid grid-cols-3 gap-4 text-[10px] border-t border-zinc-700 pt-4">
//               <div>
//                 <div className="text-zinc-400">Keys</div>
//                 <div className="text-2xl font-mono text-white">{keyCount}</div>
//               </div>
//               <div>
//                 <div className="text-zinc-400">Join Total</div>
//                 <div className="text-2xl font-mono text-amber-400">
//                   {joinTotal}
//                 </div>
//               </div>
//               <div>
//                 <div className="text-zinc-400">Est. Query</div>
//                 <div className="text-2xl font-mono text-violet-400">
//                   1 + {joinTotal}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Usage Snippet */}
//           <div className="bg-zinc-900 border border-zinc-700 rounded p-4">
//             <div className="text-xs text-sky-400 mb-2">USAGE</div>
//             <pre className="text-xs bg-black p-3 rounded overflow-auto">
//               {`const app = await chopStick<${payload.slug ? `"${payload.slug}"` : "sushi"}>(${JSON.stringify(payload, null, 2)})`}
//             </pre>
//             <button
//               onClick={() =>
//                 navigator.clipboard.writeText(
//                   `const app = await chopStick(${jsonString});`,
//                 )
//               }
//               className="mt-3 text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300"
//             >
//               <Copy className="w-3 h-3" /> copy usage
//             </button>
//           </div>

//           <button
//             onClick={() => console.log("chopStick çağrıldı →", payload)}
//             className="w-full py-4 bg-gradient-to-r from-violet-500 to-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition"
//           >
//             <Zap className="w-5 h-5" />
//             TEST ET (console.log)
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
// // import { useCallback, useMemo, useState } from "react"

// // // ─── type mirrors ────────────────────────────────────────────────────────────
// // // Based on ramen = focus<sushi> and chopstick = coder<sushi>

// // const DEFAULT_PAYLOAD = {
// //   // identity
// //   id: "",
// //   slug: "",
// //   name: "",
// //   userId: "",
// //   guestId: "",
// //   ownerId: "",
// //   storeId: "",
// //   storeSlug: "",
// //   storeDomain: "",
// //   threadId: "",
// //   role: "",
// //   isSystem: false,
// //   skipCache: true,

// //   // depth / include / exclude
// //   depth: 0,
// //   include: [],
// //   exclude: [],

// //   // join config
// //   join: {
// //     memories: { user: 0, app: 0, dna: 0, thread: 0 },
// //     instructions: { user: 0, app: 0, dna: 0, thread: 0 },
// //     characterProfile: { user: 0, app: 0, dna: 0, thread: 0 },
// //     placeholders: { user: 0, app: 0, dna: 0, thread: 0 },
// //   },

// //   // llm / agent
// //   llm: false,
// //   agent: null,
// // }

// // const INCLUDE_OPTIONS = [
// //   "characterProfiles",
// //   "highlights",
// //   "store",
// //   "tips",
// //   "features",
// //   "systemPrompt",
// //   "instructions",
// // ]

// // const EXCLUDE_OPTIONS = [
// //   "characterProfiles",
// //   "highlights",
// //   "store",
// //   "tips",
// //   "features",
// //   "systemPrompt",
// //   "instructions",
// // ]

// // const ROLE_OPTIONS = ["", "admin", "user"]

// // const JOIN_SCOPES = ["user", "app", "dna", "thread"]
// // const JOIN_SECTIONS = [
// //   "memories",
// //   "instructions",
// //   "characterProfile",
// //   "placeholders",
// // ]

// // // ─── helpers ─────────────────────────────────────────────────────────────────

// // function buildPayload(form) {
// //   const payload = {}

// //   if (form.id) payload.id = form.id
// //   if (form.slug) payload.slug = form.slug
// //   if (form.name) payload.name = form.name
// //   if (form.userId) payload.userId = form.userId
// //   if (form.guestId) payload.guestId = form.guestId
// //   if (form.ownerId) payload.ownerId = form.ownerId
// //   if (form.storeId) payload.storeId = form.storeId
// //   if (form.storeSlug) payload.storeSlug = form.storeSlug
// //   if (form.storeDomain) payload.storeDomain = form.storeDomain
// //   if (form.threadId) payload.threadId = form.threadId
// //   if (form.role) payload.role = form.role
// //   if (form.isSystem) payload.isSystem = true
// //   if (!form.skipCache) payload.skipCache = false

// //   if (form.depth !== 0) payload.depth = form.depth
// //   if (form.include.length) payload.include = form.include
// //   if (form.exclude.length) payload.exclude = form.exclude
// //   if (form.llm) payload.llm = true

// //   // join — only include non-zero
// //   const join = {}
// //   for (const section of JOIN_SECTIONS) {
// //     const entries = {}
// //     for (const scope of JOIN_SCOPES) {
// //       const v = form.join[section][scope]
// //       if (v > 0) entries[scope] = v
// //     }
// //     if (Object.keys(entries).length) join[section] = entries
// //   }
// //   if (Object.keys(join).length) payload.join = join

// //   return payload
// // }

// // function countJoinTokens(join) {
// //   let total = 0
// //   for (const section of JOIN_SECTIONS)
// //     for (const scope of JOIN_SCOPES) total += join[section][scope] || 0
// //   return total
// // }

// // // rough DB query estimate
// // function estimateQueries(payload) {
// //   let q = 1 // base app query
// //   const join = payload.join || {}
// //   if (join.memories) q += Object.keys(join.memories).length
// //   if (join.instructions) q += Object.keys(join.instructions).length
// //   if (join.characterProfile) q += Object.keys(join.characterProfile).length
// //   if (join.placeholders) q += Object.keys(join.placeholders).length
// //   if (payload.include?.includes("store")) q += 1
// //   if (payload.llm) q += 2
// //   return q
// // }

// // // ─── sub-components ──────────────────────────────────────────────────────────

// // function Field({ label, hint, children }) {
// //   return (
// //     <div style={{ marginBottom: 12 }}>
// //       <label
// //         style={{
// //           display: "block",
// //           fontSize: 11,
// //           fontWeight: 600,
// //           letterSpacing: "0.06em",
// //           textTransform: "uppercase",
// //           color: "var(--cs-muted)",
// //           marginBottom: 4,
// //         }}
// //       >
// //         {label}
// //         {hint && (
// //           <span
// //             style={{
// //               fontWeight: 400,
// //               textTransform: "none",
// //               letterSpacing: 0,
// //               marginLeft: 6,
// //               opacity: 0.6,
// //             }}
// //           >
// //             {hint}
// //           </span>
// //         )}
// //       </label>
// //       {children}
// //     </div>
// //   )
// // }

// // function TextInput({ value, onChange, placeholder = "" }) {
// //   return (
// //     <input
// //       value={value}
// //       onChange={(e) => onChange(e.target.value)}
// //       placeholder={placeholder}
// //       style={{
// //         width: "100%",
// //         padding: "6px 10px",
// //         fontSize: 13,
// //         background: "var(--cs-input-bg)",
// //         border: "1px solid var(--cs-border)",
// //         borderRadius: 6,
// //         color: "var(--cs-text)",
// //         outline: "none",
// //         fontFamily: "var(--cs-mono)",
// //       }}
// //     />
// //   )
// // }

// // function NumInput({ value, onChange, min = 0, max = 50 }) {
// //   return (
// //     <input
// //       type="number"
// //       value={value}
// //       min={min}
// //       max={max}
// //       onChange={(e) => onChange(Number(e.target.value))}
// //       style={{
// //         width: 56,
// //         padding: "4px 6px",
// //         fontSize: 12,
// //         textAlign: "center",
// //         background: "var(--cs-input-bg)",
// //         border: "1px solid var(--cs-border)",
// //         borderRadius: 6,
// //         color: "var(--cs-text)",
// //         outline: "none",
// //         fontFamily: "var(--cs-mono)",
// //       }}
// //     />
// //   )
// // }

// // function Toggle({ checked, onChange, label }) {
// //   return (
// //     <label
// //       style={{
// //         display: "flex",
// //         alignItems: "center",
// //         gap: 8,
// //         cursor: "pointer",
// //         userSelect: "none",
// //       }}
// //     >
// //       <div
// //         onClick={() => onChange(!checked)}
// //         style={{
// //           width: 34,
// //           height: 18,
// //           borderRadius: 9,
// //           cursor: "pointer",
// //           background: checked ? "var(--cs-accent)" : "var(--cs-border)",
// //           position: "relative",
// //           transition: "background 0.2s",
// //           flexShrink: 0,
// //         }}
// //       >
// //         <div
// //           style={{
// //             position: "absolute",
// //             top: 2,
// //             left: checked ? 16 : 2,
// //             width: 14,
// //             height: 14,
// //             borderRadius: "50%",
// //             background: "#fff",
// //             transition: "left 0.2s",
// //           }}
// //         />
// //       </div>
// //       <span style={{ fontSize: 13, color: "var(--cs-text)" }}>{label}</span>
// //     </label>
// //   )
// // }

// // function MultiSelect({ options, selected, onChange }) {
// //   const toggle = (val) =>
// //     onChange(
// //       selected.includes(val)
// //         ? selected.filter((v) => v !== val)
// //         : [...selected, val],
// //     )
// //   return (
// //     <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
// //       {options.map((opt) => (
// //         <button
// //           key={opt}
// //           onClick={() => toggle(opt)}
// //           style={{
// //             padding: "3px 10px",
// //             fontSize: 12,
// //             borderRadius: 20,
// //             cursor: "pointer",
// //             border: `1px solid ${selected.includes(opt) ? "var(--cs-accent)" : "var(--cs-border)"}`,
// //             background: selected.includes(opt)
// //               ? "var(--cs-accent-bg)"
// //               : "transparent",
// //             color: selected.includes(opt)
// //               ? "var(--cs-accent)"
// //               : "var(--cs-muted)",
// //             fontFamily: "var(--cs-mono)",
// //             transition: "all 0.15s",
// //           }}
// //         >
// //           {opt}
// //         </button>
// //       ))}
// //     </div>
// //   )
// // }

// // function JoinGrid({ join, onChange }) {
// //   const setVal = (section, scope, val) => {
// //     onChange({
// //       ...join,
// //       [section]: { ...join[section], [scope]: val },
// //     })
// //   }
// //   return (
// //     <div style={{ overflowX: "auto" }}>
// //       <table
// //         style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}
// //       >
// //         <thead>
// //           <tr>
// //             <th
// //               style={{
// //                 textAlign: "left",
// //                 padding: "4px 8px",
// //                 color: "var(--cs-muted)",
// //                 fontWeight: 600,
// //                 fontSize: 11,
// //               }}
// //             >
// //               section
// //             </th>
// //             {JOIN_SCOPES.map((s) => (
// //               <th
// //                 key={s}
// //                 style={{
// //                   textAlign: "center",
// //                   padding: "4px 8px",
// //                   color: "var(--cs-muted)",
// //                   fontWeight: 600,
// //                   fontSize: 11,
// //                 }}
// //               >
// //                 {s}
// //               </th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {JOIN_SECTIONS.map((section, i) => (
// //             <tr
// //               key={section}
// //               style={{
// //                 background: i % 2 ? "var(--cs-row-alt)" : "transparent",
// //               }}
// //             >
// //               <td
// //                 style={{
// //                   padding: "5px 8px",
// //                   color: "var(--cs-text)",
// //                   fontFamily: "var(--cs-mono)",
// //                 }}
// //               >
// //                 {section}
// //               </td>
// //               {JOIN_SCOPES.map((scope) => (
// //                 <td
// //                   key={scope}
// //                   style={{ padding: "4px 8px", textAlign: "center" }}
// //                 >
// //                   <NumInput
// //                     value={join[section][scope]}
// //                     onChange={(v) => setVal(section, scope, v)}
// //                   />
// //                 </td>
// //               ))}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }

// // function Section({ title, badge, children, collapsible = false }) {
// //   const [open, setOpen] = useState(true)
// //   return (
// //     <div
// //       style={{
// //         marginBottom: 20,
// //         border: "1px solid var(--cs-border)",
// //         borderRadius: 10,
// //         overflow: "hidden",
// //       }}
// //     >
// //       <div
// //         style={{
// //           display: "flex",
// //           alignItems: "center",
// //           justifyContent: "space-between",
// //           padding: "10px 16px",
// //           background: "var(--cs-section-bg)",
// //           cursor: collapsible ? "pointer" : "default",
// //           borderBottom: open ? "1px solid var(--cs-border)" : "none",
// //         }}
// //         onClick={collapsible ? () => setOpen((o) => !o) : undefined}
// //       >
// //         <span
// //           style={{
// //             fontSize: 12,
// //             fontWeight: 700,
// //             letterSpacing: "0.07em",
// //             textTransform: "uppercase",
// //             color: "var(--cs-text)",
// //           }}
// //         >
// //           {title}
// //         </span>
// //         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
// //           {badge !== undefined && (
// //             <span
// //               style={{
// //                 fontSize: 11,
// //                 fontWeight: 600,
// //                 padding: "2px 8px",
// //                 borderRadius: 20,
// //                 background:
// //                   badge > 0 ? "var(--cs-accent-bg)" : "var(--cs-border)",
// //                 color: badge > 0 ? "var(--cs-accent)" : "var(--cs-muted)",
// //                 fontFamily: "var(--cs-mono)",
// //               }}
// //             >
// //               {badge}
// //             </span>
// //           )}
// //           {collapsible && (
// //             <span
// //               style={{
// //                 color: "var(--cs-muted)",
// //                 fontSize: 14,
// //                 transition: "transform 0.2s",
// //                 transform: open ? "rotate(90deg)" : "none",
// //               }}
// //             >
// //               ›
// //             </span>
// //           )}
// //         </div>
// //       </div>
// //       {open && <div style={{ padding: "14px 16px" }}>{children}</div>}
// //     </div>
// //   )
// // }

// // function StatCard({ label, value, accent = false }) {
// //   return (
// //     <div
// //       style={{
// //         padding: "10px 14px",
// //         borderRadius: 8,
// //         background: accent ? "var(--cs-accent-bg)" : "var(--cs-section-bg)",
// //         border: `1px solid ${accent ? "var(--cs-accent)" : "var(--cs-border)"}`,
// //       }}
// //     >
// //       <div
// //         style={{
// //           fontSize: 10,
// //           fontWeight: 600,
// //           letterSpacing: "0.07em",
// //           textTransform: "uppercase",
// //           color: accent ? "var(--cs-accent)" : "var(--cs-muted)",
// //           marginBottom: 4,
// //         }}
// //       >
// //         {label}
// //       </div>
// //       <div
// //         style={{
// //           fontSize: 20,
// //           fontWeight: 700,
// //           color: accent ? "var(--cs-accent)" : "var(--cs-text)",
// //           fontFamily: "var(--cs-mono)",
// //         }}
// //       >
// //         {value}
// //       </div>
// //     </div>
// //   )
// // }

// // // ─── main component ───────────────────────────────────────────────────────────

// // export default function ChopStickCalculator() {
// //   const [form, setForm] = useState(DEFAULT_PAYLOAD)
// //   const [copied, setCopied] = useState(false)

// //   const set = useCallback(
// //     (key, val) => setForm((f) => ({ ...f, [key]: val })),
// //     [],
// //   )
// //   const setJoin = useCallback((join) => setForm((f) => ({ ...f, join })), [])

// //   const payload = useMemo(() => buildPayload(form), [form])
// //   const json = useMemo(() => JSON.stringify(payload, null, 2), [payload])
// //   const joinTokens = useMemo(() => countJoinTokens(form.join), [form.join])
// //   const estimatedQ = useMemo(() => estimateQueries(payload), [payload])

// //   const copy = () => {
// //     navigator.clipboard.writeText(json).then(() => {
// //       setCopied(true)
// //       setTimeout(() => setCopied(false), 1600)
// //     })
// //   }

// //   // css vars injected inline so no external dep
// //   return (
// //     <div
// //       style={{
// //         "--cs-text": "#0f0f0f",
// //         "--cs-muted": "#666",
// //         "--cs-border": "#e2e2e2",
// //         "--cs-input-bg": "#fafafa",
// //         "--cs-section-bg": "#f6f6f6",
// //         "--cs-row-alt": "#f0f0f0",
// //         "--cs-accent": "#5b47e0",
// //         "--cs-accent-bg": "#f0eeff",
// //         "--cs-mono": "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
// //         fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
// //         color: "var(--cs-text)",
// //         maxWidth: 900,
// //         margin: "0 auto",
// //         padding: "0 4px",
// //       }}
// //     >
// //       {/* stats row */}
// //       <div
// //         style={{
// //           display: "grid",
// //           gridTemplateColumns: "repeat(4,minmax(0,1fr))",
// //           gap: 10,
// //           marginBottom: 20,
// //         }}
// //       >
// //         <StatCard label="payload keys" value={Object.keys(payload).length} />
// //         <StatCard
// //           label="join items"
// //           value={joinTokens}
// //           accent={joinTokens > 0}
// //         />
// //         <StatCard
// //           label="est. queries"
// //           value={estimatedQ}
// //           accent={estimatedQ > 5}
// //         />
// //         <StatCard
// //           label="include + exclude"
// //           value={form.include.length + form.exclude.length}
// //         />
// //       </div>

// //       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
// //         {/* LEFT COLUMN */}
// //         <div>
// //           {/* Identity */}
// //           <Section
// //             title="Identity"
// //             badge={
// //               [
// //                 form.id,
// //                 form.slug,
// //                 form.name,
// //                 form.userId,
// //                 form.guestId,
// //                 form.ownerId,
// //               ].filter(Boolean).length
// //             }
// //             collapsible
// //           >
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "1fr 1fr",
// //                 gap: 10,
// //               }}
// //             >
// //               <Field label="id">
// //                 <TextInput
// //                   value={form.id}
// //                   onChange={(v) => set("id", v)}
// //                   placeholder="uuid"
// //                 />
// //               </Field>
// //               <Field label="slug">
// //                 <TextInput
// //                   value={form.slug}
// //                   onChange={(v) => set("slug", v)}
// //                   placeholder="vex"
// //                 />
// //               </Field>
// //               <Field label="name">
// //                 <TextInput
// //                   value={form.name}
// //                   onChange={(v) => set("name", v)}
// //                   placeholder="Atlas"
// //                 />
// //               </Field>
// //               <Field label="userId">
// //                 <TextInput
// //                   value={form.userId}
// //                   onChange={(v) => set("userId", v)}
// //                   placeholder="user-uuid"
// //                 />
// //               </Field>
// //               <Field label="guestId">
// //                 <TextInput
// //                   value={form.guestId}
// //                   onChange={(v) => set("guestId", v)}
// //                   placeholder="guest-uuid"
// //                 />
// //               </Field>
// //               <Field label="ownerId">
// //                 <TextInput
// //                   value={form.ownerId}
// //                   onChange={(v) => set("ownerId", v)}
// //                   placeholder="owner-uuid"
// //                 />
// //               </Field>
// //             </div>
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "1fr 1fr",
// //                 gap: 10,
// //                 marginTop: 10,
// //               }}
// //             >
// //               <Field label="role">
// //                 <select
// //                   value={form.role}
// //                   onChange={(e) => set("role", e.target.value)}
// //                   style={{
// //                     width: "100%",
// //                     padding: "6px 10px",
// //                     fontSize: 13,
// //                     background: "var(--cs-input-bg)",
// //                     border: "1px solid var(--cs-border)",
// //                     borderRadius: 6,
// //                     color: "var(--cs-text)",
// //                   }}
// //                 >
// //                   {ROLE_OPTIONS.map((r) => (
// //                     <option key={r} value={r}>
// //                       {r || "— none —"}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </Field>
// //               <Field label="flags">
// //                 <div
// //                   style={{
// //                     display: "flex",
// //                     flexDirection: "column",
// //                     gap: 6,
// //                     marginTop: 2,
// //                   }}
// //                 >
// //                   <Toggle
// //                     checked={form.isSystem}
// //                     onChange={(v) => set("isSystem", v)}
// //                     label="isSystem"
// //                   />
// //                   <Toggle
// //                     checked={form.skipCache}
// //                     onChange={(v) => set("skipCache", v)}
// //                     label="skipCache"
// //                   />
// //                   <Toggle
// //                     checked={form.llm}
// //                     onChange={(v) => set("llm", v)}
// //                     label="llm"
// //                   />
// //                 </div>
// //               </Field>
// //             </div>
// //           </Section>

// //           {/* Store */}
// //           <Section
// //             title="Store"
// //             badge={
// //               [form.storeId, form.storeSlug, form.storeDomain].filter(Boolean)
// //                 .length
// //             }
// //             collapsible
// //           >
// //             <div
// //               style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "1fr 1fr",
// //                 gap: 10,
// //               }}
// //             >
// //               <Field label="storeId">
// //                 <TextInput
// //                   value={form.storeId}
// //                   onChange={(v) => set("storeId", v)}
// //                   placeholder="store-uuid"
// //                 />
// //               </Field>
// //               <Field label="storeSlug">
// //                 <TextInput
// //                   value={form.storeSlug}
// //                   onChange={(v) => set("storeSlug", v)}
// //                   placeholder="blossom"
// //                 />
// //               </Field>
// //             </div>
// //             <Field label="storeDomain">
// //               <TextInput
// //                 value={form.storeDomain}
// //                 onChange={(v) => set("storeDomain", v)}
// //                 placeholder="https://chrry.ai"
// //               />
// //             </Field>
// //             <Field label="threadId" hint="(for thread-scoped queries)">
// //               <TextInput
// //                 value={form.threadId}
// //                 onChange={(v) => set("threadId", v)}
// //                 placeholder="thread-uuid"
// //               />
// //             </Field>
// //           </Section>

// //           {/* Depth / include / exclude */}
// //           <Section
// //             title="Query scope"
// //             badge={form.include.length + form.exclude.length + form.depth}
// //             collapsible
// //           >
// //             <Field label="depth" hint="0 = shallow, 1+ = store apps">
// //               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
// //                 <input
// //                   type="range"
// //                   min={-1}
// //                   max={5}
// //                   value={form.depth}
// //                   onChange={(e) => set("depth", Number(e.target.value))}
// //                   style={{ flex: 1 }}
// //                 />
// //                 <span
// //                   style={{
// //                     fontFamily: "var(--cs-mono)",
// //                     fontSize: 14,
// //                     minWidth: 20,
// //                     color: "var(--cs-accent)",
// //                     fontWeight: 700,
// //                   }}
// //                 >
// //                   {form.depth}
// //                 </span>
// //               </div>
// //             </Field>
// //             <Field label="include">
// //               <MultiSelect
// //                 options={INCLUDE_OPTIONS}
// //                 selected={form.include}
// //                 onChange={(v) => set("include", v)}
// //               />
// //             </Field>
// //             <Field label="exclude" hint="overrides include">
// //               <MultiSelect
// //                 options={EXCLUDE_OPTIONS}
// //                 selected={form.exclude}
// //                 onChange={(v) => set("exclude", v)}
// //               />
// //             </Field>
// //           </Section>
// //         </div>

// //         {/* RIGHT COLUMN */}
// //         <div>
// //           {/* Join config */}
// //           <Section title="Join config" badge={joinTokens} collapsible>
// //             <p
// //               style={{
// //                 fontSize: 12,
// //                 color: "var(--cs-muted)",
// //                 marginTop: 0,
// //                 marginBottom: 10,
// //               }}
// //             >
// //               Each cell = pageSize for that section×scope. 0 = skip query.
// //             </p>
// //             <JoinGrid join={form.join} onChange={setJoin} />
// //             <div
// //               style={{
// //                 display: "flex",
// //                 gap: 6,
// //                 marginTop: 10,
// //                 flexWrap: "wrap",
// //               }}
// //             >
// //               {[
// //                 {
// //                   label: "reset all",
// //                   vals: { user: 0, app: 0, dna: 0, thread: 0 },
// //                 },
// //                 {
// //                   label: "light (3/2/0/3)",
// //                   vals: { user: 3, app: 2, dna: 0, thread: 3 },
// //                 },
// //                 {
// //                   label: "full (5/3/2/5)",
// //                   vals: { user: 5, app: 3, dna: 2, thread: 5 },
// //                 },
// //                 {
// //                   label: "hippo (10/5/3/10)",
// //                   vals: { user: 10, app: 5, dna: 3, thread: 10 },
// //                 },
// //               ].map((preset) => (
// //                 <button
// //                   key={preset.label}
// //                   onClick={() => {
// //                     const next = {}
// //                     for (const s of JOIN_SECTIONS) next[s] = { ...preset.vals }
// //                     setJoin(next)
// //                   }}
// //                   style={{
// //                     padding: "3px 10px",
// //                     fontSize: 11,
// //                     borderRadius: 20,
// //                     border: "1px solid var(--cs-border)",
// //                     background: "transparent",
// //                     color: "var(--cs-muted)",
// //                     cursor: "pointer",
// //                     fontFamily: "var(--cs-mono)",
// //                   }}
// //                 >
// //                   {preset.label}
// //                 </button>
// //               ))}
// //             </div>
// //           </Section>

// //           {/* Output */}
// //           <Section title="Payload output">
// //             <div style={{ position: "relative" }}>
// //               <pre
// //                 style={{
// //                   margin: 0,
// //                   padding: "12px 14px",
// //                   borderRadius: 8,
// //                   background: "#111",
// //                   color: "#e8e8e8",
// //                   fontSize: 11,
// //                   lineHeight: 1.7,
// //                   fontFamily: "var(--cs-mono)",
// //                   maxHeight: 320,
// //                   overflowY: "auto",
// //                   whiteSpace: "pre-wrap",
// //                   wordBreak: "break-all",
// //                 }}
// //               >
// //                 {json}
// //               </pre>
// //               <button
// //                 onClick={copy}
// //                 style={{
// //                   position: "absolute",
// //                   top: 8,
// //                   right: 8,
// //                   padding: "3px 10px",
// //                   fontSize: 11,
// //                   borderRadius: 6,
// //                   border: "1px solid #444",
// //                   background: copied ? "#5b47e0" : "#222",
// //                   color: copied ? "#fff" : "#aaa",
// //                   cursor: "pointer",
// //                   fontFamily: "var(--cs-mono)",
// //                   transition: "all 0.2s",
// //                 }}
// //               >
// //                 {copied ? "copied!" : "copy"}
// //               </button>
// //             </div>

// //             {/* usage snippet */}
// //             <div style={{ marginTop: 12 }}>
// //               <div
// //                 style={{
// //                   fontSize: 11,
// //                   fontWeight: 600,
// //                   letterSpacing: "0.07em",
// //                   textTransform: "uppercase",
// //                   color: "var(--cs-muted)",
// //                   marginBottom: 6,
// //                 }}
// //               >
// //                 usage
// //               </div>
// //               <pre
// //                 style={{
// //                   margin: 0,
// //                   padding: "10px 14px",
// //                   borderRadius: 8,
// //                   background: "#111",
// //                   color: "#7dd3fc",
// //                   fontSize: 11,
// //                   lineHeight: 1.7,
// //                   fontFamily: "var(--cs-mono)",
// //                   whiteSpace: "pre-wrap",
// //                 }}
// //               >
// //                 {`const app = await chopStick(${json.length < 120 ? json : "payload"})`}
// //               </pre>
// //             </div>
// //           </Section>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
