// "use client"
// // import "./styles.scss"

import { v4 as uuidv4 } from "uuid"
import Chrry from "./Chrry"

// // // Only import styles on web platforms (not React Native)
// // // React Native will skip these imports during bundling
// // if (typeof window !== "undefined") {
// //   try {
// //     require("./styles.scss")
// //     // require("./globals.css")
// //     require("./styles/view-transitions.css")
// //   } catch (_e) {
// //     // React Native will throw here, which is fine
// //   }
// // }

// import Chrry from "./Chrry"

export default function Donut({
  children,
  apiKey,
}: {
  children?: React.ReactNode
  apiKey?: string
}) {
  return <Chrry key={apiKey} donut deviceId={uuidv4()} apiKey={apiKey}></Chrry>
}
