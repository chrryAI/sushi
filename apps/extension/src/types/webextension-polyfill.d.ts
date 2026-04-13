declare module "webextension-polyfill" {
  namespace Browser {
    interface Tabs {
      sendMessage(tabId: number, message: any): Promise<any>
      query(params: any): Promise<any[]>
      update(tabId: number, params: any): Promise<any>
      create(params: any): Promise<any>
    }

    interface SidePanel {
      open(options: { tabId?: number }): Promise<void>
      setOptions(options: {
        tabId?: number
        path?: string
        enabled: boolean
      }): Promise<void>
      setPanelBehavior(options: {
        openPanelOnActionClick?: boolean
      }): Promise<void>
    }

    interface SidebarAction {
      open(): Promise<void>
      close(): Promise<void>
      isOpen(): Promise<boolean>
      setPanel(options: { panel: string }): Promise<void>
    }

    interface Static {
      tabs: Tabs
      sidePanel?: SidePanel
      sidebarAction?: SidebarAction
    }
  }

  interface Browser {
    sidePanel?: SidePanel
  }

  interface SidebarAction {
    open(): Promise<void>
    close(): Promise<void>
    isOpen(): Promise<boolean>
  }
}

interface FirefoxBrowser {
  sidebarAction: {
    open(): Promise<void>
    close(): Promise<void>
    isOpen(): Promise<boolean>
  }
}

declare global {
  interface Window {
    browser: FirefoxBrowser
  }
}
