// Background script for Vex extension
import "./types/webextension-polyfill.d.ts"
import browser from "webextension-polyfill"
import { initializeContextMenu } from "./contextMenu"

// Track sidebar state for toggle functionality
const sidebarState: Record<number, boolean> = {}

type MessageRequest = {
  action: string
  url?: string
  type?: string
  text?: string
}

// Initialize extension state
browser.storage.local.set({ running: false })

// Initialize context menu
initializeContextMenu()

// Handle open in same tab requests
browser.runtime.onMessage.addListener((request: unknown) => {
  const req = request as MessageRequest
  if (req.action === "openInSameTab" && req.url) {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.id) {
        browser.tabs.update(tabs[0].id, { url: req.url })
        console.log(`🔄 Navigating to: ${req.url}`)
      }
    })
  }
  return true
})

// Handle context menu actions and sidebar close messages
browser.runtime.onMessage.addListener(async (request: unknown) => {
  const req = request as MessageRequest

  // Handle sidebar close message
  if (req.action === "closeSidebar") {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (tabs[0]?.id) {
        await closeSidebar(tabs[0].id)
        sidebarState[tabs[0].id] = false
      }
    } catch (error) {
      console.error("Error closing sidebar:", error)
    }
    return true
  }

  if (req.action !== "contextMenuAction") {
    return false
  }

  const messageMap: Record<string, string> = {
    writeReply: `✍️ Please help me write a reply to: "${req.text}"`,
    checkGrammar: `📝 Please check the grammar in this text: "${req.text}"`,
    aiDebate: `⚖️ Let's have a debate about this: "${req.text}"`,
    factCheck: `🔍 Please fact check this statement: "${req.text}"`,
    summarize: `📋 Please summarize this text: "${req.text}"`,
  }

  const message = req.type ? messageMap[req.type] : undefined
  if (!message) {
    console.warn("Unknown context menu action:", req.type)
    return true
  }

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (!tab?.id) {
      console.error("No active tab found")
      return true
    }

    // Store the action with a timestamp to ensure it triggers a change
    await browser.storage.local.set({
      contextMenuAction: {
        type: req.type,
        text: req.text,
        message: message,
        timestamp: Date.now(),
      },
    })

    // Open the sidebar and update state
    await openSidebar(tab.id)
    sidebarState[tab.id] = true
  } catch (error) {
    console.error("Error in context menu handler:", error)
  }

  return true
})

// Remove the problematic browser.runtime.sendMessage call in storage listener
browser.storage.onChanged.addListener((changes, _areaName) => {
  // Just log the change, let the React component handle it
  if (changes.contextMenuAction) {
    console.log(
      "Context menu action stored:",
      changes.contextMenuAction.newValue,
    )
  }
})

// Handle extension installation
browser.runtime.onInstalled.addListener(() => {
  console.log("Vex extension installed")
  initializeContextMenu()
})

// Handle extension icon click with browser-specific toggle support
browser.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return

  const tabId = tab.id
  const isFirefox = typeof (browser as any).sidebarAction !== "undefined"

  try {
    if (isFirefox) {
      // Firefox: Use toggle logic with state tracking
      const isCurrentlyOpen = sidebarState[tabId] || false

      if (isCurrentlyOpen) {
        await closeSidebar(tabId)
        sidebarState[tabId] = false
        console.log("🔒 Firefox sidebar closed for tab", tabId)
      } else {
        await openSidebar(tabId)
        sidebarState[tabId] = true
        console.log("🔓 Firefox sidebar opened for tab", tabId)
      }
    } else {
      // Chrome: Always open (Chrome handles toggle internally)
      await openSidebar(tabId)
      console.log("🔓 Chrome sidebar opened for tab", tabId)
    }
    // Chrome handles toggle internally via setPanelBehavior
  } catch (error) {
    console.error("Failed to toggle sidebar:", error)
    if (isFirefox) {
      sidebarState[tabId] = false
    }
  }
})

// Enable side panel for all sites and reset state
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url) return

  // Reset sidebar state on navigation
  if (changeInfo.status === "loading") {
    sidebarState[tabId] = false
  }

  // Enable side panel for all URLs
  if ("sidePanel" in browser) {
    try {
      await (browser as any).sidePanel.setOptions({
        tabId,
        path: "index.html",
        enabled: true,
      })
    } catch (error) {
      console.error("Failed to set sidePanel options:", error)
    }
  }
})

// Configure side panel behavior - Chrome uses built-in toggle, Firefox manual
if ("sidePanel" in browser) {
  try {
    // Chrome: Enable built-in toggle behavior
    ;(browser as any).sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    })
  } catch (error) {
    console.error("Failed to set panel behavior:", error)
  }
}

// Clean up sidebar state when tabs are closed
browser.tabs.onRemoved.addListener((tabId) => {
  delete sidebarState[tabId]
})

// Universal sidebar opener for both Chrome and Firefox
async function openSidebar(tabId: number): Promise<void> {
  const errors: string[] = []

  try {
    // Method 1: Firefox sidebarAction API
    if (typeof (browser as any).sidebarAction?.open === "function") {
      await (browser as any).sidebarAction.open()
      console.log("✅ Firefox sidebarAction opened")
      return
    }
  } catch (error) {
    errors.push(`Firefox sidebarAction failed: ${error}`)
  }

  try {
    // Method 2: Chrome sidePanel API - just ensure it's enabled
    if (
      "sidePanel" in browser &&
      typeof (browser as any).sidePanel?.setOptions === "function"
    ) {
      await (browser as any).sidePanel.setOptions({
        tabId,
        path: "index.html",
        enabled: true,
      })
      console.log("✅ Chrome sidePanel enabled (Chrome handles opening)")
      return
    }
  } catch (error) {
    errors.push(`Chrome sidePanel failed: ${error}`)
  }

  try {
    // Method 3: Message-based fallback
    await browser.tabs.sendMessage(tabId, {
      type: "openSidebar",
      source: "background",
    })
    console.log("✅ Message-based sidebar opened")
    return
  } catch (error) {
    errors.push(`Message-based fallback failed: ${error}`)
  }

  console.error("❌ All sidebar opening methods failed:", errors)
  throw new Error(`Failed to open sidebar: ${errors.join(", ")}`)
}

// Universal sidebar closer (primarily for Firefox)
async function closeSidebar(tabId: number): Promise<void> {
  const errors: string[] = []

  try {
    // Method 1: Firefox sidebarAction close
    if (typeof (browser as any).sidebarAction?.close === "function") {
      await (browser as any).sidebarAction.close()
      console.log("✅ Firefox sidebarAction closed")
      return
    }
  } catch (error) {
    errors.push(`Firefox sidebarAction close failed: ${error}`)
  }

  try {
    // Method 2: Message-based fallback
    await browser.tabs.sendMessage(tabId, {
      type: "closeSidebar",
      source: "background",
    })
    console.log("✅ Message-based sidebar closed")
    return
  } catch (error) {
    errors.push(`Message-based close fallback failed: ${error}`)
  }

  console.warn("⚠️ Some sidebar closing methods failed:", errors)
}

declare module "webextension-polyfill" {
  interface SidePanel {
    open?(options: { tabId?: number }): Promise<void>
    close?(options: { tabId?: number }): Promise<void>
    setOptions(options: {
      tabId?: number
      path?: string
      enabled: boolean
    }): Promise<void>
    setPanelBehavior(options: {
      openPanelOnActionClick?: boolean
    }): Promise<void>
  }

  interface Browser {
    sidePanel?: SidePanel
  }
}

export type RuntimeMessageHandler = (
  request: unknown,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | Promise<boolean>
