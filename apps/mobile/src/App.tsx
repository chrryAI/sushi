import "@chrryai/chrry/styles.scss"
import Chrry from "@chrryai/chrry/Chrry"
import { HistoryRouterProvider } from "@chrryai/pepper"
import { Component, type ReactNode, useEffect } from "react"
import VConsole from "vconsole"

// Error Boundary to catch crashes
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "white", background: "#000" }}>
          <h1>⚠️ App Crashed</h1>
          <pre
            style={{ color: "red", fontSize: "12px", whiteSpace: "pre-wrap" }}
          >
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  console.log("🍒 App mounting...")

  useEffect(() => {
    // Enable vConsole debug tool on mobile (development only for security)
    const isDev = import.meta.env.DEV || import.meta.env.MODE === "development"
    if (typeof window !== "undefined" && (window as any).Capacitor && isDev) {
      const vConsole = new VConsole()
      console.log("✅ vConsole initialized (dev mode)")
      return () => {
        vConsole.destroy()
      }
    }
  }, [])

  return (
    <ErrorBoundary>
      <HistoryRouterProvider>
        <Chrry />
      </HistoryRouterProvider>
    </ErrorBoundary>
  )
}

export default App
