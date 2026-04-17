import "./index.css"
// Import Sentry/GlitchTip client config FIRST
// import "./sentry"
// Import global styles to ensure they're loaded
import "@chrryai/donut/styles.scss"

import "@chrryai/donut/styles/view-transitions.css"
import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import App from "./App"
import type { ServerData } from "./server-loader"

// Polyfill process.env for compatibility with libraries expecting it
if (typeof process === "undefined") {
  ;(window as any).process = { env: {} }
}
// Copy Vite env vars to process.env for backward compatibility
Object.assign((window as any).process.env, import.meta.env)

// Read server data from window (injected by server)
declare global {
  interface Window {
    __SERVER_DATA__?: ServerData
  }
}

const serverData = window.__SERVER_DATA__

hydrateRoot(
  document.getElementById("root") as HTMLElement,
  <StrictMode>
    <App serverData={serverData} />
  </StrictMode>,
)
