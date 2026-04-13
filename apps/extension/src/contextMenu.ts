import browser from "webextension-polyfill"

// Track Firefox context menu state
let firefoxMenuVisible = false
let lastClickTime = 0
const DOUBLE_CLICK_THRESHOLD = 500 // ms

// Define the type for context menu items
interface ContextMenuItem {
  id: string
  title: string
  contexts: (
    | "all"
    | "page"
    | "frame"
    | "selection"
    | "link"
    | "editable"
    | "image"
    | "video"
    | "audio"
  )[]
}

// Context menu items configuration
const CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "writeReply",
    title: "✍️ Write a reply",
    contexts: ["selection"],
  },
  {
    id: "checkGrammar",
    title: "📝 Check my grammar",
    contexts: ["selection"],
  },
  {
    id: "aiDebate",
    title: "⚖️ AI debate",
    contexts: ["selection"],
  },
  {
    id: "factCheck",
    title: "🔍 Fact check",
    contexts: ["selection"],
  },
  {
    id: "summarize",
    title: "📋 Summarize",
    contexts: ["selection"],
  },
]

// Initialize context menu items
export function initializeContextMenu(): void {
  browser.contextMenus.removeAll()

  browser.contextMenus.create({
    id: "vexMenu",
    title: "Vex",
    contexts: ["selection"],
  })

  CONTEXT_MENU_ITEMS.forEach((item) => {
    browser.contextMenus.create({
      id: item.id,
      parentId: "vexMenu",
      title: item.title,
      contexts: item.contexts,
    })
  })

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id || !info.selectionText) return

    const currentTime = Date.now()
    const isFirefox = navigator.userAgent.includes("Firefox")

    // Firefox toggle logic - check for second click within threshold
    if (isFirefox) {
      const timeSinceLastClick = currentTime - lastClickTime
      lastClickTime = currentTime

      if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && firefoxMenuVisible) {
        // Second click - toggle menu off
        firefoxMenuVisible = false
        return
      }

      firefoxMenuVisible = true
    }

    try {
      // Open both Chrome and Firefox sidebars
      await openUniversalSidebar(tab.id)

      // Store the action after sidebar is open
      await browser.storage.local.set({
        contextMenuAction: {
          type: info.menuItemId,
          text: info.selectionText,
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      console.error("Error in context menu handler:", error)
    }
  })
}

// Universal sidebar opener for both Chrome and Firefox
async function openUniversalSidebar(tabId: number): Promise<void> {
  const errors: string[] = []

  try {
    // Method 1: Chrome sidePanel API
    if (
      "sidePanel" in browser &&
      typeof (browser as any).sidePanel?.open === "function"
    ) {
      await (browser as any).sidePanel.open({ tabId })
      console.log("✅ Chrome sidePanel opened")
      return
    }
  } catch (error) {
    errors.push(`Chrome sidePanel failed: ${error}`)
  }

  try {
    // Method 2: Firefox sidebarAction API
    if (typeof (browser as any).sidebarAction?.open === "function") {
      await (browser as any).sidebarAction.open()
      console.log("✅ Firefox sidebarAction opened")
      return
    }
  } catch (error) {
    errors.push(`Firefox sidebarAction failed: ${error}`)
  }

  try {
    // Method 3: Message-based fallback
    await browser.tabs.sendMessage(tabId, {
      type: "openSidebar",
      source: "contextMenu",
    })
    console.log("✅ Message-based sidebar opened")
    return
  } catch (error) {
    errors.push(`Message-based fallback failed: ${error}`)
  }

  // Method 4: Final Chrome fallback with setOptions
  try {
    if (
      "sidePanel" in browser &&
      typeof (browser as any).sidePanel?.setOptions === "function"
    ) {
      await (browser as any).sidePanel.setOptions({
        tabId,
        path: "index.html",
        enabled: true,
      })
      console.log("✅ Chrome sidePanel setOptions fallback")
      return
    }
  } catch (error) {
    errors.push(`Chrome setOptions fallback failed: ${error}`)
  }

  console.error("❌ All sidebar opening methods failed:", errors)
  throw new Error(`Failed to open sidebar: ${errors.join(", ")}`)
}
