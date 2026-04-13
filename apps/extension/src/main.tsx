import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// Initialize Sentry for error tracking (must be first)
import "@chrryai/chrry/sentry.client.config"

import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
