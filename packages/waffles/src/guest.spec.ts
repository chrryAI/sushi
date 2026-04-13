import { test } from "@playwright/test"
import { getURL } from "."
import { chat } from "./shared/chat"
import { collaboration } from "./shared/collaboration"
import { limit } from "./shared/limit"
import { subscribe } from "./shared/subscribe"
import { thread } from "./shared/thread"

const isMember = false
const isLive = false

import { v4 as uuidv4 } from "uuid"
import { clean, prepare } from "./shared/clean"

test.beforeEach(async ({ page }) => {
  await clean({ page })
})

test("Invite", async ({ page }) => {
  await page.goto(
    getURL({
      isLive: false,
      isMember,
    }),
    {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    },
  )
  await prepare({ page })
  await subscribe({
    page,
    isMember,
    invite: `${uuidv4()}@gmail.com`,
  })
})

test("Gift", async ({ page }) => {
  await page.goto(getURL({ isLive: false, isMember }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })
  await page.goto(
    getURL({
      isLive: false,
      isMember,
    }),
    {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    },
  )
  await prepare({ page })
  await subscribe({
    page,
    isMember,
    email: process.env.VEX_TEST_EMAIL_3!,
    password: process.env.VEX_TEST_PASSWORD_3!,
    gift: process.env.VEX_TEST_EMAIL_3!,
  })
})

test("Chat", async ({ page }) => {
  test.slow()

  await page.goto(getURL({ isMember, isLive }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await prepare({ page })

  await chat({
    artifacts: {
      paste: 1,
      pdf: 1,
    },
    hasCP: true,
    hasPH: true,
    isNewChat: false,
    page,
    isMember,
    isLive,
    instruction: "Help me plan a 3-day trip to Tokyo",
    prompts: [
      {
        text: "List shortly the top 3 must-see attractions in Tokyo",
        model: "sushi",
        mix: {
          audio: 1,
          image: 1,
          pdf: 1,
        },
      },
      {
        text: "Suggest briefly a simple itinerary for day 1",
        model: "claude",
        mix: {
          paste: 1,
          pdf: 1,
          video: 1,
        },
      },
      {
        text: "Shortly explain the best way to get around",
        model: "chatGPT",
        mix: {
          paste: 1,
          pdf: 1,
          image: 1,
          video: 1,
          audio: 1,
        },
      },
      {
        text: "How can I enable character profile? Answer shortly",
        model: "perplexity",
      },
      {
        text: "Create a futuristic cityscape at sunset with flying cars, 4K, hyperrealistic",
        imageGenerationEnabled: true,
        model: "sushi",
      },
    ],
  })
})

test("Chat - Hourly Limit Test", async ({ page }) => {
  test.slow()
  await limit({ page })
})

test("Thread", async ({ page }) => {
  test.slow()
  await thread({ page, bookmark: true })
})

test("Long text", async ({ page }) => {
  const _result = await chat({
    page,
    isMember,
    isLive,
    instruction: "Help me write a short story",
    // agentMessageTimeout: 12000,
    prompts: [
      {
        text: "Write a 300-word story about a time traveler who discovers they can't change the past",
        model: "sushi",
        stop: true,
      },
      {
        text: "I stopped you. Need a short one. Now summarize that story shortly in 1 sentence",
        model: "sushi",
      },
    ],
  })
})

test.skip("Collaboration", async ({ page, browser }) => {
  await collaboration({ page, browser, isMember })
})
