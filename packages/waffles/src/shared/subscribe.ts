import { expect, type Page } from "@playwright/test"
import { getModelCredits, log, type modelName, wait } from "../index"
import { chat } from "./chat"
import { prepare } from "./clean"
import { signIn } from "./signIn"

export const subscribe = async ({
  page,
  isMember,
  email = process.env.VEX_TEST_EMAIL_2!,
  password = process.env.VEX_TEST_PASSWORD_2!,
  gift,
  invite,
  createChat = true,
  plan = "plus",
}: {
  page: Page
  isMember?: boolean
  email?: string
  password?: string
  gift?: string
  invite?: string
  createChat?: boolean
  plan?: "plus" | "pro" | "credits" | "grape" | "pear" | "coder" | "watermelon"
}) => {
  log({ page })
  const inviteOrGift = invite || gift

  const newChat = createChat && !inviteOrGift && !isMember

  const prompts = [
    {
      text: "List shortly the top 3 must-see attractions in Tokyo",
      model: "sushi" as modelName,
    },
    {
      mix: {
        paste: 1,
        pdf: 1,
        image: 1,
      },
      text: "Suggest briefly a simple itinerary for day 1",
      model: "claude" as modelName,
    },
    {
      text: "Shortly explain the best way to get around",
      model: "chatGPT" as modelName,
      mix: {
        paste: 1,
        pdf: 1,
        video: 1,
      },
    },
    {
      text: "How can I enable character profile? Answer shortly",
      model: "perplexity" as modelName,
    },
  ]

  if (!inviteOrGift) {
    await chat({
      artifacts: {
        paste: 1,
        pdf: 1,
      },
      hasCP: true,
      hasPH: true,
      page,
      isMember,
      isNewChat: false,
      prompts,
    })
  }

  let threadUrl

  if (newChat) {
    threadUrl = page.url()
    const threadId = threadUrl.split("/threads/")[1]?.split("?")[0]
    expect(threadId).toBeTruthy()

    const guestCount = await page.getByTestId("guest-message").count()

    expect(guestCount).toBeGreaterThanOrEqual(1)
  }

  const subscribeButton = page.getByTestId("subscribe-button")
  await expect(subscribeButton).toBeVisible({
    timeout: 15000,
  })
  await subscribeButton.click()

  const modal = page.getByTestId("subscribe-modal")
  await expect(modal).toBeVisible()

  // Select the plan
  if (plan === "pro") {
    const proButton = page.getByTestId("pro-button")
    await expect(proButton).toBeVisible()
    await proButton.click()
  } else if (plan === "credits") {
    const creditsButton = page.getByTestId("credits-button")
    await expect(creditsButton).toBeVisible()
    await creditsButton.click()
  } else if (plan === "grape") {
    const grapeButton = page.getByTestId("grape-button")
    await expect(grapeButton).toBeVisible()
    await grapeButton.click()
  } else if (plan === "pear") {
    const pearButton = page.getByTestId("pear-button")
    await expect(pearButton).toBeVisible()
    await pearButton.click()
  } else if (plan === "coder") {
    const coderButton = page.getByTestId("coder-button")
    await expect(coderButton).toBeVisible()
    await coderButton.click()
  } else if (plan === "watermelon") {
    const watermelonButton = page.getByTestId("watermelon-button")
    await expect(watermelonButton).toBeVisible()
    await watermelonButton.click()
  }

  await page.waitForTimeout(1000)

  const checkoutButton = page.getByTestId("subscribe-checkout")

  const subscribeGift = page.getByTestId("subscribe-gift")
  await expect(subscribeGift).toBeVisible()

  // if (!isMember) {
  // }

  if (inviteOrGift) {
    await subscribeGift.click()
    const subscribeGiftInput = page.getByTestId("subscribe-gift-input")
    await expect(subscribeGiftInput).toBeVisible()
    await subscribeGiftInput.fill(inviteOrGift)

    const subscribeGiftSearch = page.getByTestId("subscribe-gift-search")
    await expect(subscribeGiftSearch).toBeVisible()
    await subscribeGiftSearch.click()
    await page.waitForTimeout(5000)
  }

  const getCreditsLeft = async (page: Page) => {
    await prepare({ page })
    const creditsInfo = page.getByTestId("credits-info")

    await expect(creditsInfo).toBeVisible({
      timeout: 100000,
    })

    return Number.parseInt(
      (await creditsInfo.getAttribute("data-credits-left", {
        timeout: 1000,
      })) || "0",
      10,
    )
  }

  if (invite) {
    await subscribeGift.click()
  } else if (gift) {
    await subscribeGift.click()
  } else {
    await expect(checkoutButton).toBeVisible()
    await checkoutButton.click()
  }

  await page.waitForSelector("form.PaymentForm-form")

  // Fill payment form
  await page.selectOption("#billingCountry", "NL")
  await page.fill("#email", "test@example.com")
  await page.fill("#cardNumber", "4242424242424242") // Stripe test card
  await page.fill("#cardExpiry", "12/30") // MM/YY
  await page.fill("#cardCvc", "123")
  await page.fill("#billingName", "Test User")

  // Fill address fields for USA billing

  // if (isCI) {
  // }

  //   await page.selectOption("#billingCountry", "US") // Select country

  await page.waitForTimeout(1000)

  await page.click('[data-testid="hosted-payment-submit-button"]')

  const plusButton = page.getByTestId("plus-button")
  await expect(plusButton).toBeVisible({
    timeout: 50000,
    visible: !inviteOrGift,
  })

  await expect(subscribeButton).toBeVisible({
    visible: !!inviteOrGift,
    timeout: 30000,
  })

  const purchaseTypeInput = page.getByTestId("purchase-type")

  // Wait for toast with partial text match (handles emoji and variations)
  await expect(purchaseTypeInput).toHaveValue(
    inviteOrGift ? "gift" : "subscription",
  )

  const getNthMenuThread = async (nth: number) => {
    const threads = page.getByTestId("menu-thread-link")
    return threads.nth(nth)
  }
  const getFirstMenuThread = async () => {
    return getNthMenuThread(0)
  }

  if (newChat && threadUrl) {
    const expectedCredits =
      2000 -
      prompts.reduce(
        (total, prompt) => total + getModelCredits(prompt.model),
        0,
      )
    expect(await getCreditsLeft(page)).toBe(expectedCredits)

    await signIn({
      page,
      email,
      password,
    })

    const first = await getFirstMenuThread()
    await expect(first).toBeVisible({
      timeout: 25000,
    })

    await wait(3000)

    await first.click()

    await wait(3000)

    const getLastMessage = async () => {
      // Wait for either user or guest messages to appear
      await page.waitForFunction(
        () => {
          const userMessages = document.querySelectorAll(
            '[data-testid="user-message"]',
          )
          const guestMessages = document.querySelectorAll(
            '[data-testid="guest-message"]',
          )
          console.log(
            `Debug: Found ${userMessages.length} user messages, ${guestMessages.length} guest messages`,
          )
          return userMessages.length > 0 || guestMessages.length > 0
        },
        { timeout: 100000 },
      )

      // Try both user and guest message types since the test ID depends on actual user context
      const userMessages = page.getByTestId("user-message")
      const guestMessages = page.getByTestId("guest-message")

      const userCount = await userMessages.count()
      const guestCount = await guestMessages.count()

      console.log(
        `Debug: After wait - ${userCount} user messages, ${guestCount} guest messages`,
      )

      if (userCount > 0) {
        console.log(`Debug: Using user message (${userCount} found)`)
        return userMessages.nth(userCount - 1)
      } else if (guestCount > 0) {
        console.log(`Debug: Using guest message (${guestCount} found)`)
        return guestMessages.nth(guestCount - 1)
      } else {
        throw new Error("No user or guest messages found after waiting")
      }
    }

    await expect(await getLastMessage()).toBeVisible({
      timeout: 100000,
    })
  }

  if (inviteOrGift) {
    const fingerprint = page.getByTestId("gifted-fingerprint")

    expect(fingerprint).toBeAttached({
      timeout: 20000,
    })

    const fingerprintValue = await fingerprint.getAttribute("value")
    expect(fingerprintValue).toBeTruthy()

    await wait(5000)

    // Open gift redemption in fresh browser context with video recording
    const giftBrowser = page.context().browser()!
    const giftContext = await giftBrowser.newContext({
      recordVideo: {
        dir: "test-results/videos",
        size: { width: 1280, height: 720 },
      },
    })
    const giftPage = await giftContext.newPage()
    await giftPage.goto(
      `${page.url().split("?")[0]}?gift=${fingerprintValue}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 100000,
      },
    )

    await giftPage.bringToFront()

    if (gift) {
      await signIn({
        page: giftPage,
        email,
        password,
      })
    }

    // Verify guest receives subscription
    const giftSubscribeButton = giftPage.getByTestId("subscribe-button")
    await expect(giftSubscribeButton).not.toBeVisible({
      timeout: 100000,
    })

    // Check for subscription confirmation
    const giftPlusButton = giftPage.getByTestId("plus-button")
    await expect(giftPlusButton).toBeVisible({
      timeout: 20000,
    })

    expect(await getCreditsLeft(giftPage)).toBeGreaterThan(150)

    // await clean({ page: giftPage })
    await giftContext.close()
  }
  return true
}
