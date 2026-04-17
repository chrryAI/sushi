import { test } from "@playwright/test"
import { getURL, TEST_MEMBER_FINGERPRINTS } from "."
import { signIn } from "./shared/signIn"
import { subscribe } from "./shared/subscribe"
import { watermelon } from "./shared/watermelon"

const isLive = false

import { clean, prepare } from "./shared/clean"

test.beforeEach(async ({ page }) => {
  await clean({ page })
})

test.skip("Subscribe As Guest", async ({ page }) => {
  await page.goto(
    getURL({
      isLive,
      isMember: false,
      fingerprint: TEST_MEMBER_FINGERPRINTS[0],
    }),
    {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    },
  )
  await prepare({ page })
  await subscribe({
    page,
    isMember: false,
  })
})

test.skip("Subscribe As Member", async ({ page }) => {
  await clean({ page })
  await page.goto(getURL({ isLive: false, isMember: true }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })
  await subscribe({ page, isMember: true })
})

test.skip("Watermelon", async ({ page, browser }) => {
  await clean({ page })
  await page.goto(`${getURL({ isLive: false })}/watermelon`, {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  // await signIn({ page })
  await watermelon({ page })
})
