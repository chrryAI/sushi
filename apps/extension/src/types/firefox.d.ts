interface FirefoxBrowser {
  sidebarAction: {
    open(): Promise<void>
    close(): Promise<void>
    isOpen(): Promise<boolean>
  }
}

declare const browser: FirefoxBrowser
