import { expect, type Page } from "@playwright/test"
import { getURL, wait } from "../index"
import { signIn } from "./signIn"

export async function maximize({ page }: { page: Page }) {
  await wait(2000)
  const max = page.getByTestId("maximize")
  const isVisible = await max.isVisible()
  isVisible && (await max.click())
}

export async function prepare({ page }: { page: Page }) {
  await wait(500)
  const newChatButton = page.getByTestId("new-chat-button")
  const isVisible = await newChatButton.isVisible({
    timeout: 20000,
  })
  isVisible && (await wait(500))

  isVisible && (await newChatButton.click())

  isVisible && (await wait(750))

  await maximize({ page })
}

export async function clean({
  page,
  fingerprint,
  isLive,
  isMember,
  waitForDelete = true,
}: {
  page: Page
  fingerprint?: string
  isLive?: boolean
  isMember?: boolean
  waitForDelete?: boolean
}) {
  await page.goto(getURL({ isLive, isMember, fingerprint }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })

  await page.getByTestId("new-chat-button").click()

  await maximize({ page })

  await wait(500)

  const clearSessionButton = page.getByTestId("clear-session")

  await expect(clearSessionButton).toBeVisible({
    timeout: 20000,
  })

  // First click to show confirm
  await clearSessionButton.click()

  await wait(1000)

  const accountButton = page.getByTestId("account-button")

  await wait(1000)

  // Second click to confirm
  await clearSessionButton.click()

  // unstable
  waitForDelete
    ? await expect(page.getByTestId("is-deleted")).toBeAttached({
        timeout: 50000,
      })
    : await wait(5000)

  await wait(5000)

  await accountButton.click()

  const email = page.getByTestId("account-email")
  await expect(email).toBeVisible()

  const logoutButton = page.getByTestId("account-logout-button")
  await expect(logoutButton).toBeVisible()

  await logoutButton.click()

  const registerInButton = page.getByTestId("register-button")

  await expect(registerInButton).toBeVisible({
    timeout: 15000,
  })

  // Wait for the API call to complete
}

export const newChat = async ({ page }: { page: Page }) => {
  const newChatButton = page.getByTestId("new-chat-button")

  await expect(newChatButton).toBeVisible({
    timeout: 5000,
  })
}
