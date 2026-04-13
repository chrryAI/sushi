import { test } from "@playwright/test"
import { v4 as uuidv4 } from "uuid"
import { getURL, VEX_TEST_EMAIL_3, VEX_TEST_PASSWORD_3, wait } from "."
import { app } from "./shared/app"
import { clean } from "./shared/clean"
import { signIn } from "./shared/signIn"
import { subscribe } from "./shared/subscribe"

const isMember = true

const isLive = true

test.skip("Subscribe As Member", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(
    getURL({
      isMember,
      isLive,
    }),
    {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    },
  )

  await signIn({ page })

  await wait(2000)

  await subscribe({
    page,
    isMember,
    createChat: false,
  })
})

test.skip("Invite", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(
    getURL({
      isLive,
      isMember,
    }),
    {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    },
  )
  await signIn({ page })

  await subscribe({
    page,
    isMember,
    invite: `${uuidv4()}@gmail.com`,
    createChat: false,
  })
})

test.skip("Gift", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(getURL({ isLive, isMember }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })

  await subscribe({
    page,
    isMember,
    email: VEX_TEST_EMAIL_3!,
    password: VEX_TEST_PASSWORD_3!,
    gift: VEX_TEST_EMAIL_3!,
  })
})

test.skip("App", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(getURL({ isLive, isMember }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })
  await app({
    page,
    isMember,
    isLive,
    slug: "vex",
    nav: [
      {
        name: "vault", // Finance & Budgeting
        chat: {
          prompts: [
            { model: "sushi", text: "Where am I overspending this month?" },
            { model: "sushi", text: "Compare my spending to last month" },
            { model: "sushi", text: "What's my biggest expense category?" },
          ],
        },
      },
      {
        name: "peach", // Feedback & Insights
        chat: {
          prompts: [
            { model: "sushi", text: "What feedback patterns are emerging?" },
            {
              model: "sushi",
              text: "Which features are users requesting most?",
            },
            {
              model: "sushi",
              text: "Show me sentiment analysis from recent feedback",
            },
          ],
        },
      },
      {
        name: "bloom", // Productivity & Focus
        chat: {
          prompts: [
            { model: "sushi", text: "What's my most productive time of day?" },
            { model: "sushi", text: "Show my focus session statistics" },
            { model: "sushi", text: "Help me plan a deep work session" },
          ],
        },
      },

      {
        name: "atlas", // Travel & Navigation
        chat: {
          prompts: [
            { model: "sushi", text: "Plan a day trip in Amsterdam" },
            { model: "sushi", text: "Find the best coffee shops nearby" },
            { model: "sushi", text: "What's the fastest route to Centraal?" },
          ],
        },
      },
      {
        name: "chrry", // App Marketplace
        chat: {
          prompts: [
            { model: "sushi", text: "What are the top-rated apps this week?" },
            { model: "sushi", text: "Show me apps for productivity" },
            { model: "sushi", text: "How do I monetize my app idea?" },
          ],
        },
      },
    ],
    isNewChat: true,
  })
})

test.skip("Grape", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(getURL({ isLive, isMember }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })

  await app({
    page,
    isMember,
    isLive,
    slug: "vex",
    nav: undefined,
    isGrape: true,
    isNewChat: true,
  })
})

test.skip("Retro", async ({ page }) => {
  await clean({ page, isLive, isMember })

  await page.goto(getURL({ isLive, isMember }), {
    waitUntil: "domcontentloaded",
    timeout: 100000,
  })

  await signIn({ page })

  await app({
    page,
    isMember,
    isLive,
    slug: "vex",
    nav: [
      {
        name: "vault", // Finance & Budgeting
        chat: {
          isRetro: true,
        },
      },

      {
        name: "grape", // Productivity & Focus
        chat: {
          isRetro: true,
        },
      },

      {
        name: "pear", // Travel & Navigation
        chat: {
          isRetro: true,
        },
      },
    ],
    isGrape: true,
    isNewChat: true,
  })
})
