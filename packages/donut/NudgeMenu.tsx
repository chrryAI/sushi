// // NudgeMenu.tsx - Inline Style, Apple Helium Stili
// import React, { useCallback, useEffect, useRef, useState } from "react"
// import { Div, P, Span } from "./platform"

// // ─── Types ───────────────────────────────────────────────
// interface MenuItem {
//   label: string
//   icon?: React.ReactNode
//   href?: string
//   onClick?: () => void
//   children?: MenuItem[]
// }

// interface NudgeMenuProps {
//   items: MenuItem[]
//   trigger: React.ReactNode
//   position?: "bottom" | "right"
// }

// // ─── Constants (Apple/Helium Stili) ─────────────────────
// const STYLES = {
//   container: {
//     position: "relative" as const,
//     display: "inline-block",
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
//   },
//   menu: {
//     position: "absolute" as const,
//     top: "calc(100% + 8px)",
//     left: "0",
//     backgroundColor: "rgba(0, 0, 0, 0.85)",
//     backdropFilter: "blur(20px) saturate(180%)",
//     WebkitBackdropFilter: "blur(20px) saturate(180%)",
//     borderRadius: "14px",
//     border: "1px solid rgba(255, 255, 255, 0.08)",
//     boxShadow:
//       "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
//     padding: "8px 0",
//     minWidth: "220px",
//     zIndex: 1000,
//     overflow: "hidden",
//     animation: "nudgeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
//   },
//   nestedMenu: {
//     position: "absolute" as const,
//     top: "-8px",
//     left: "calc(100% + 4px)",
//     backgroundColor: "rgba(0, 0, 0, 0.85)",
//     backdropFilter: "blur(20px) saturate(180%)",
//     WebkitBackdropFilter: "blur(20px) saturate(180%)",
//     borderRadius: "14px",
//     border: "1px solid rgba(255, 255, 255, 0.08)",
//     boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
//     padding: "8px 0",
//     minWidth: "200px",
//     zIndex: 1001,
//     animation: "nudgeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
//   },
//   item: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     padding: "8px 16px",
//     color: "rgba(255, 255, 255, 0.9)",
//     fontSize: "14px",
//     fontWeight: 400,
//     letterSpacing: "-0.01em",
//     cursor: "pointer",
//     transition: "all 0.15s ease",
//     whiteSpace: "nowrap" as const,
//     userSelect: "none" as const,
//   },
//   itemHover: {
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//     color: "#fff",
//   },
//   icon: {
//     width: "18px",
//     height: "18px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     opacity: 0.7,
//   },
//   arrow: {
//     marginLeft: "auto",
//     fontSize: "11px",
//     opacity: 0.5,
//     transition: "transform 0.2s ease",
//   },
//   divider: {
//     height: "1px",
//     backgroundColor: "rgba(255, 255, 255, 0.06)",
//     margin: "6px 12px",
//   },
//   trigger: {
//     display: "inline-flex",
//     alignItems: "center",
//     gap: "6px",
//     padding: "8px 16px",
//     backgroundColor: "rgba(0, 0, 0, 0.8)",
//     backdropFilter: "blur(20px)",
//     borderRadius: "24px",
//     border: "1px solid rgba(255, 255, 255, 0.1)",
//     color: "#fff",
//     fontSize: "14px",
//     fontWeight: 500,
//     cursor: "pointer",
//     transition: "all 0.2s ease",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
//   },
// }

// // ─── Keyframes (inject once) ─────────────────────────────
// const injectKeyframes = () => {
//   if (typeof document === "undefined") return
//   if (document.getElementById("nudge-keyframes")) return

//   const style = document.createElement("style")
//   style.id = "nudge-keyframes"
//   style.textContent = `
//     @keyframes nudgeIn {
//       from { opacity: 0; transform: scale(0.96) translateY(-4px); }
//       to { opacity: 1; transform: scale(1) translateY(0); }
//     }
//     @keyframes nudgeOut {
//       from { opacity: 1; transform: scale(1); }
//       to { opacity: 0; transform: scale(0.96); }
//     }
//   `
//   document.head.appendChild(style)
// }

// // ─── Menu Item Component ─────────────────────────────────
// const MenuItemComponent: React.FC<{
//   item: MenuItem
//   depth: number
//   onClose: () => void
// }> = ({ item, depth, onClose }) => {
//   const [hovered, setHovered] = useState(false)
//   const [nestedOpen, setNestedOpen] = useState(false)
//   const hasChildren = item.children && item.children.length > 0
//   const timeoutRef = useRef<NodeJS.Timeout>()

//   const handleMouseEnter = useCallback(() => {
//     setHovered(true)
//     if (hasChildren) {
//       clearTimeout(timeoutRef.current)
//       setNestedOpen(true)
//     }
//   }, [hasChildren])

//   const handleMouseLeave = useCallback(() => {
//     setHovered(false)
//     if (hasChildren) {
//       timeoutRef.current = setTimeout(() => setNestedOpen(false), 150)
//     }
//   }, [hasChildren])

//   const handleClick = useCallback(() => {
//     if (item.onClick) item.onClick()
//     if (item.href) window.location.href = item.href
//     if (!hasChildren) onClose()
//   }, [item, hasChildren, onClose])

//   const itemStyle = {
//     ...STYLES.item,
//     ...(hovered ? STYLES.itemHover : {}),
//     paddingLeft: depth > 0 ? "16px" : "16px",
//   }

//   return (
//     <Div
//       style={{ position: "relative" }}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//     >
//       <Div style={itemStyle} onClick={handleClick}>
//         {item.icon && <span style={STYLES.icon}>{item.icon}</span>}
//         <span>{item.label}</span>
//         {hasChildren && <span style={STYLES.arrow}>›</span>}
//       </Div>

//       {hasChildren && nestedOpen && (
//         <Div
//           style={STYLES.nestedMenu}
//           onMouseEnter={() => clearTimeout(timeoutRef.current)}
//           onMouseLeave={() => {
//             timeoutRef.current = setTimeout(() => setNestedOpen(false), 150)
//           }}
//         >
//           {item.children!.map((child, idx) => (
//             <MenuItemComponent
//               key={idx}
//               item={child}
//               depth={depth + 1}
//               onClose={onClose}
//             />
//           ))}
//         </Div>
//       )}
//     </Div>
//   )
// }

// // ─── Main NudgeMenu Component ────────────────────────────
// export const NudgeMenu: React.FC<NudgeMenuProps> = ({
//   items,
//   trigger,
//   position = "bottom",
// }) => {
//   const [open, setOpen] = useState(false)
//   const containerRef = useRef<HTMLDivElement>(null)
//   const menuRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     injectKeyframes()
//   }, [])

//   // Close on outside click
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(e.target as Node)
//       ) {
//         setOpen(false)
//       }
//     }
//     if (open) {
//       document.addEventListener("mousedown", handleClickOutside)
//       return () => document.removeEventListener("mousedown", handleClickOutside)
//     }
//   }, [open])

//   // Close on Escape
//   useEffect(() => {
//     const handleEscape = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setOpen(false)
//     }
//     if (open) {
//       document.addEventListener("keydown", handleEscape)
//       return () => document.removeEventListener("keydown", handleEscape)
//     }
//   }, [open])

//   const menuStyle = {
//     ...STYLES.menu,
//     ...(position === "right" ? { top: "0", left: "calc(100% + 8px)" } : {}),
//   }

//   return (
//     <div style={STYLES.container} ref={containerRef}>
//       <Div
//         style={STYLES.trigger}
//         onClick={() => setOpen(!open)}
//         onMouseEnter={() => setOpen(true)} // Optional: hover trigger
//       >
//         {trigger}
//       </Div>

//       {open && (
//         <div style={menuStyle} ref={menuRef}>
//           {items.map((item, idx) => (
//             <React.Fragment key={idx}>
//               {idx > 0 && item.label === "---" ? (
//                 <div style={STYLES.divider} />
//               ) : (
//                 <MenuItemComponent
//                   item={item}
//                   depth={0}
//                   onClose={() => setOpen(false)}
//                 />
//               )}
//             </React.Fragment>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// // ─── Usage Example ───────────────────────────────────────
// export const Example: React.FC = () => {
//   const menuItems: MenuItem[] = [
//     {
//       label: "Mobile Network",
//       icon: "📱",
//       children: [
//         { label: "5G Coverage", href: "#5g" },
//         { label: "LTE Maps", href: "#lte" },
//         {
//           label: "Roaming",
//           children: [
//             { label: "International", href: "#intl" },
//             { label: "Domestic", href: "#domestic" },
//           ],
//         },
//       ],
//     },
//     {
//       label: "IoT Network",
//       icon: "🌐",
//       children: [
//         { label: "Sensors", href: "#sensors" },
//         { label: "Gateways", href: "#gateways" },
//       ],
//     },
//     { label: "---" },
//     {
//       label: "HNT Token",
//       icon: "🪙",
//       href: "#token",
//     },
//     {
//       label: "Hardware",
//       icon: "⚙️",
//       children: [
//         { label: "Hotspots", href: "#hotspots" },
//         { label: "Miners", href: "#miners" },
//         {
//           label: "Accessories",
//           children: [
//             { label: "Antennas", href: "#antennas" },
//             { label: "Cables", href: "#cables" },
//             { label: "Mounts", href: "#mounts" },
//           ],
//         },
//       ],
//     },
//   ]

//   return (
//     <div
//       style={{ padding: "100px", background: "#1a1a2e", minHeight: "100vh" }}
//     >
//       <NudgeMenu
//         items={menuItems}
//         trigger={
//           <>
//             <span>Networks</span>
//             <span style={{ fontSize: "10px", opacity: 0.6 }}>▼</span>
//           </>
//         }
//       />
//     </div>
//   )
// }
