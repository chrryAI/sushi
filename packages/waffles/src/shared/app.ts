import { expect, type Page } from "@playwright/test"
import { getModelCredits, getURL, type modelName, storeApps, wait } from ".."
import { chat } from "./chat"
import { prepare } from "./clean"
import { grape } from "./grape"

const app = async ({
  app: appName,
  isRetro,
  slug,
  page,
  isLive,
  isMember,
  nav,
  isNewChat,
  creditsConsumed,
  messagesConsumed,
  isGrape,
  ...props
}: {
  isStoreApp?: boolean
  app?: string
  isRetro?: boolean
  slug: string
  page: Page
  isLive: boolean
  isMember: boolean
  isGrape?: boolean
  nav?: {
    name: string
    chat: {
      isRetro?: boolean
      instruction?: string
      prompts?: {
        model?: modelName
        stop?: boolean
        text: string
        agentMessageTimeout?: number
        webSearch?: boolean
        delete?: boolean
        mix?: {
          image?: number
          video?: number
          audio?: number
          paste?: number
          pdf?: number
        }
      }[]
      agentMessageTimeout?: number
      isNewChat?: boolean
      isLive?: boolean
      threadId?: string
      creditsConsumed?: number
      messagesConsumed?: number
      bookmark?: boolean
    }
  }[]
  isNewChat?: boolean
  creditsConsumed?: number
  messagesConsumed?: number
}) => {
  if (isNewChat) {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await prepare({ page })
    await wait(5000) // Increased wait to ensure page is fully loaded
  }

  const storeAppButton = page.getByTestId(`store-app-${slug}`)

  await expect(storeAppButton).not.toBeVisible()

  // Track cumulative credits and messages consumed across all apps
  // Track cumulative credits and messages consumed across all apps
  let totalCreditsConsumed = creditsConsumed || 0
  let totalMessagesConsumed = messagesConsumed || 0

  if (nav)
    for (const item of nav) {
      const index = nav.indexOf(item)
      const remainingNav = nav.slice(index + 1)

      const appButton = page.getByTestId(`app-${item.name}`)
      await expect(appButton).toBeVisible()

      await appButton.click()

      const isStoreApp = props.isStoreApp ?? storeApps.includes(item.name)

      await expect(storeAppButton).toBeVisible({
        visible: !isStoreApp,
        timeout: 5000,
      })

      await expect(appButton).not.toBeVisible()

      if (!isStoreApp) {
        await storeAppButton.click()

        await expect(storeAppButton).not.toBeVisible({
          timeout: 5000,
        })
        await expect(appButton).toBeVisible({
          timeout: 5000,
        })

        await appButton.click()

        await expect(appButton).not.toBeVisible({
          timeout: 5000,
        })

        await expect(storeAppButton).toBeVisible({
          timeout: 5000,
        })
      }

      await chat({
        page,
        isMember,
        isLive,
        isNewChat: false,
        threadId: item.chat.threadId,
        creditsConsumed: totalCreditsConsumed, // Use cumulative total
        messagesConsumed: totalMessagesConsumed, // Use cumulative total
        bookmark: item.chat.bookmark ?? false,
        prompts: item.chat.prompts,
        // Pass retro params
        isRetro: item.chat.isRetro,
        app: item.name,
      })

      // Add this app's credits and messages to the running totals
      const creditsForThisApp =
        item.chat.prompts?.reduce(
          (total, prompt) => total + getModelCredits(prompt.model || "sushi"),
          0,
        ) || 0
      const messagesForThisApp = item.chat.prompts?.length || 0

      totalCreditsConsumed += creditsForThisApp
      totalMessagesConsumed += messagesForThisApp

      await wait(4000)

      const newChatButton = page.getByTestId("new-chat-button")
      await expect(newChatButton).toBeVisible()
      await newChatButton.click()

      await wait(2000)

      // Check store app button visibility based on whether we're in a store app
      if (isStoreApp) {
        await expect(storeAppButton).not.toBeVisible({ timeout: 10000 })
      } else {
        await prepare({ page })
        await expect(storeAppButton).toBeVisible({ timeout: 10000 })
      }

      if (isStoreApp) {
        // Only recurse if there are more items to process
        if (remainingNav.length > 0) {
          return await app({
            page,
            isMember,
            isLive,
            nav: remainingNav,
            slug,
            isNewChat: true,
            creditsConsumed: totalCreditsConsumed,
            messagesConsumed: totalMessagesConsumed,
          })
        }
      }
    }

  if (isGrape) {
    await grape({ page, isMember, isLive })
  }
}

export { app }
