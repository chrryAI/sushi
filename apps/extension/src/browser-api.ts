import type { Runtime } from "webextension-polyfill"
import browser from "webextension-polyfill"

/// <reference types="chrome" />

// Declare chrome global for TypeScript

const isFirefox = navigator?.userAgent.includes("Firefox")

// Ensure browser API is properly initialized
const getBrowserAPI = (): typeof browser => {
  if (typeof browser !== "undefined") {
    return browser
  }
  if (typeof chrome !== "undefined") {
    return chrome as unknown as typeof browser
  }
  throw new Error("No browser API found")
}

export const BrowserInstance = getBrowserAPI()

export type BrowserAPIType = {
  runtime: typeof BrowserInstance.runtime
  storage: typeof BrowserInstance.storage
  tabs: typeof BrowserInstance.tabs
  notifications: typeof BrowserInstance.notifications
  windows: typeof BrowserInstance.windows
  scripting: typeof BrowserInstance.scripting
  action: typeof BrowserInstance.action
  getURL: (path: string) => string
  sendMessage: <M, R = any>(
    message: M,
    options?: Runtime.SendMessageOptionsType,
  ) => Promise<R | undefined>
  injectContentScript: (tabId: number) => Promise<any>
  getStorageData: (key: string) => Promise<any>
  setStorageData: (key: string, value: any) => Promise<void>
}

export const browserAPI: BrowserAPIType = {
  runtime: BrowserInstance.runtime,
  storage: BrowserInstance.storage,
  tabs: BrowserInstance.tabs,
  notifications: BrowserInstance.notifications,
  windows: BrowserInstance.windows,
  scripting: BrowserInstance.scripting,
  action: BrowserInstance.action,

  getURL: BrowserInstance.runtime.getURL,

  async injectContentScript(tabId: number) {
    const api = getBrowserAPI()
    if (isFirefox) {
      return api.scripting.executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
    } else {
      return api.scripting.executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
    }
  },

  async sendMessage<M, R = any>(
    message: M,
    options?: Runtime.SendMessageOptionsType,
  ): Promise<R | undefined> {
    const api = BrowserInstance
    try {
      return await api.runtime.sendMessage(message, options)
    } catch (error) {
      console.error("Error sending message:", error)
      return undefined
    }
  },

  async getStorageData(key: string) {
    const api = getBrowserAPI()
    const result = await api.storage.local.get(key)
    return result[key]
  },

  async setStorageData(key: string, value: any) {
    const api = getBrowserAPI()
    return api.storage.local.set({ [key]: value })
  },
}
