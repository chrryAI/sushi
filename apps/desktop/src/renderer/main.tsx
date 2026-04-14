import AppProviders from "@chrryai/donut/context/providers"
import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import "@chrryai/donut/styles.scss"
import "./styles/browser-chrome.css"

interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
}

function App() {
  const [isReady, setIsReady] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://www.google.com", title: "Google" },
  ])
  const [activeTabId, setActiveTabId] = useState("1")
  const [_canGoBack, _setCanGoBack] = useState(false)
  const [_canGoForward, _setCanGoForward] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  useEffect(() => {
    // Test the IPC bridge
    if (window.electronAPI) {
      window.electronAPI.ping().then((result: string) => {
        console.log("IPC Bridge working:", result)
      })
    } else {
      console.error(
        "electronAPI is undefined - preload script may not have loaded",
      )
    }
  }, [])

  const handleNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: "https://www.google.com",
      title: "New Tab",
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const handleCloseTab = (id: string) => {
    const newTabs = tabs.filter((t) => t.id !== id)
    if (newTabs.length === 0) {
      // Create a new tab if all tabs are closed
      handleNewTab()
    } else {
      setTabs(newTabs)
      if (activeTabId === id) {
        setActiveTabId(newTabs[0].id)
      }
    }
  }

  return (
    <div className="app">
      <div className="web-content">
        <div className="web-content-placeholder">
          <div className="status-info">
            <h1>🚀 Vex Desktop</h1>
            <p>Active Tab: {activeTab?.title}</p>
            <p>URL: {activeTab?.url}</p>
            <p className="info-text">
              Web content will be displayed here using BrowserView
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
