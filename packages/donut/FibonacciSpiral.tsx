// import React from "react"

// const fibs = [1, 1, 2, 3, 5, 8, 13, 21]

// type Rect = {
//   x: number
//   y: number
//   w: number
//   h: number
//   label: number
//   rotation: number
// }

// function buildSpiralSquares(scale = 12): Rect[] {
//   const sizes = fibs.map((n) => n * scale)
//   const rects: Rect[] = []

//   let x = 0
//   let y = 0
//   let dir = 0

//   rects.push({ x, y, w: sizes[0], h: sizes[0], label: fibs[0], rotation: 0 })
//   rects.push({
//     x: sizes[0],
//     y: 0,
//     w: sizes[1],
//     h: sizes[1],
//     label: fibs[1],
//     rotation: 0,
//   })

//   x = sizes[0]
//   y = 0

//   for (let i = 2; i < sizes.length; i++) {
//     const s = sizes[i]
//     if (dir === 0) {
//       x = x
//       y = y + rects[i - 1].h
//     } else if (dir === 1) {
//       x = x - s
//       y = y
//     } else if (dir === 2) {
//       x = x - s
//       y = y - s
//     } else {
//       x = x + rects[i - 1].w
//       y = y - s
//     }

//     rects.push({ x, y, w: s, h: s, label: fibs[i], rotation: dir * 90 })
//     dir = (dir + 1) % 4
//   }

//   return rects
// }

// function arcPath(x: number, y: number, s: number, dir: number) {
//   if (dir === 0) return `M ${x + s} ${y} A ${s} ${s} 0 0 1 ${x} ${y + s}`
//   if (dir === 1) return `M ${x + s} ${y + s} A ${s} ${s} 0 0 1 ${x} ${y}`
//   if (dir === 2) return `M ${x} ${y + s} A ${s} ${s} 0 0 1 ${x + s} ${y}`
//   return `M ${x} ${y} A ${s} ${s} 0 0 1 ${x + s} ${y + s}`
// }

// export default function FibonacciSpiral() {
//   const rects = buildSpiralSquares(14)

//   const minX = Math.min(...rects.map((r) => r.x))
//   const minY = Math.min(...rects.map((r) => r.y))
//   const maxX = Math.max(...rects.map((r) => r.x + r.w))
//   const maxY = Math.max(...rects.map((r) => r.y + r.h))

//   const pad = 24
//   const width = maxX - minX + pad * 2
//   const height = maxY - minY + pad * 2

//   return (
//     <svg
//       width="100%"
//       viewBox={`${minX - pad} ${minY - pad} ${width} ${height}`}
//       style={{}}
//     >
//       {rects.map((r, i) => (
//         <g key={i}>
//           <rect
//             x={r.x}
//             y={r.y}
//             width={r.w}
//             height={r.h}
//             fill="none"
//             stroke="#f28c28"
//             strokeWidth="2"
//           />
//           <text
//             x={r.x + r.w / 2}
//             y={r.y + r.h / 2}
//             textAnchor="middle"
//             dominantBaseline="middle"
//             fontSize={Math.max(10, r.w / 4)}
//             fill="#f28c28"
//           >
//             {r.label}
//           </text>
//           {i > 0 && (
//             <path
//               d={arcPath(r.x, r.y, r.w, (i - 1) % 4)}
//               fill="none"
//               stroke="#f28c28"
//               strokeWidth="2"
//             />
//           )}
//         </g>
//       ))}
//       <text x={minX} y={minY - 8} fontSize="14" fill="#333">
//         Fibonacci Spiral
//       </text>
//     </svg>
//   )
// }
