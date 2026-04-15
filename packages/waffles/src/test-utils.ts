import { faker } from "@faker-js/faker"
import type { ConsoleMessage, Page } from "@playwright/test"
import { type APIRequestContext, request } from "@playwright/test"

export { APIClient } from "./api/client"
export type { ScheduledJob } from "./fixtures/api/scheduledJobs"
export { scheduledJobFactory } from "./fixtures/api/scheduledJobs"

export const simulateInputPaste = async (page: Page, text: string) => {
  await page.evaluate((content: string) => {
    const textarea = document.querySelector(
      'textarea[data-testid="chat-textarea"]',
    ) as HTMLTextAreaElement
    if (!textarea) return

    const pasteEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
    })

    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        getData: () => content,
        types: ["text/plain"],
        files: [],
        items: [
          {
            kind: "string",
            type: "text/plain",
            getAsString: (callback: (text: string) => void) =>
              callback(content),
          },
        ],
      },
      writable: false,
    })

    textarea.dispatchEvent(pasteEvent)
    textarea.value = content
    const inputEvent = new Event("input", { bubbles: true })
    textarea.dispatchEvent(inputEvent)
  }, text)
}

export const simulatePaste = async (page: Page, text: string) => {
  await page.evaluate(async (content: string) => {
    await navigator.clipboard.writeText(content)
    const pasteButton = document.querySelector(
      '[data-testid*="artifacts-paste-button"]',
    ) as HTMLButtonElement
    if (pasteButton) {
      pasteButton.click()
    }
  }, text)
}

const logs = new Map<string, number>() // msg → timestamp
export const log = ({ page }: { page: Page }) => {
  page.on("console", (msg: ConsoleMessage) => {
    const now = Date.now()
    const lastSeen = logs.get(msg.text())

    if (lastSeen && now - lastSeen < 5000) return

    msg.type() !== "warning" &&
      !msg.text().includes("token") &&
      !msg.text().includes("fp") &&
      console.log(`[browser][${msg.type()}] ${msg.text()}`)
    logs.set(msg.text(), now)
  })
}
