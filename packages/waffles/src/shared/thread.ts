import { expect, type Page } from "@playwright/test"
import { wait } from ".."
import { chat } from "./chat"
import { prepare } from "./clean"

export const thread = async ({
  page,
  isMember,
  bookmark,
  createChat = true,
  isLive = false,
}: {
  page: Page
  isMember?: boolean
  createChat?: boolean
  bookmark?: boolean
  isLive?: boolean
}) => {
  let total = 0
  createChat &&
    (await chat({
      bookmark,
      isNewChat: true,
      page,
      isMember,
      isLive,
      instruction: "Help me write a short story",
      prompts: [
        {
          text: "Explain shortly the difference between async/await and promises in JavaScript",
          model: "sushi",
        },
        {
          text: "List briefly 3 best practices for optimizing React performance",
          model: "sushi",
        },
        {
          text: "Describe shortly how to design a scalable microservices architecture",
          model: "sushi",
        },
      ],
    }))

  createChat && (total = total + 3)

  const getNthMenuThread = async (nth: number) => {
    const threads = page.getByTestId("menu-thread-item")
    const _threadCount = await threads.count()
    return threads.nth(nth)
  }
  const _getFirstMenuThread = async () => {
    return getNthMenuThread(0)
  }

  const getNthThread = async (nth: number) => {
    const threads = page.getByTestId("threads-item")
    const _threadCount = await threads.count()
    return threads.nth(nth)
  }

  const getFirstThread = async () => {
    return getNthThread(0)
  }

  const getSecondThread = async () => {
    return getNthThread(1)
  }

  const threadsContainer = page.getByTestId("threads-container")

  const loadMore = page.getByTestId("load-more-threads-menu")

  if (createChat) {
    await expect(loadMore).toBeVisible()
    await loadMore.click()
    await wait(5000)
  }

  await expect(
    (await getFirstThread()).getByTestId("threads-bookmarked"),
  ).toBeVisible({
    timeout: 15000,
  })

  await expect(
    (await getFirstThread()).getByTestId("threads-not-bookmarked"),
  ).not.toBeVisible({
    timeout: 15000,
  })

  const threadsCount = page.getByTestId("threads-item")
  const count = await threadsCount.count()

  createChat ? expect(count).toBe(1) : expect(count).toBe(2)

  await expect(threadsContainer).toBeVisible()

  const search = page.getByTestId("threads-search")
  await expect(search).toBeVisible()

  const threadsCollaboration = page.getByTestId("threads-collaboration")
  await expect(threadsCollaboration).toBeVisible()

  const threadsSortButtonDate = page.getByTestId("threads-sort-button-date")
  await expect(threadsSortButtonDate).toBeVisible()

  await threadsSortButtonDate.click()

  const threadsSortButton = page.getByTestId("threads-sort-button-star")
  await expect(threadsSortButton).toBeVisible()

  await threadsSortButton.click()

  const editThreadButton = (await getFirstThread()).getByTestId(
    "edit-thread-button",
  )

  await expect(editThreadButton).toBeVisible()

  await editThreadButton.click()

  const editThreadTextarea = page.getByTestId("edit-thread-textarea")

  await editThreadTextarea.fill("New thread title")

  const editThreadSaveButton = page.getByTestId("edit-thread-save-button")

  await expect(editThreadSaveButton).toBeVisible()

  await editThreadSaveButton.click()

  const threadTitle = threadsContainer.getByText("New thread title")

  await expect(threadTitle).toBeVisible()

  await editThreadButton.click()

  const editThreadGenerateTitleButton = page.getByTestId(
    "edit-thread-generate-title-button",
  )

  await expect(editThreadGenerateTitleButton).toBeVisible()

  await editThreadGenerateTitleButton.click()
  await wait(7500)
  await editThreadSaveButton.click()
  await wait(5000)

  await expect(threadTitle).not.toBeVisible({
    timeout: 100000,
  })

  const threadTitleGenerated2 = (await getFirstThread()).getByTestId(
    "threads-item-title",
  )

  await expect(threadTitleGenerated2).toBeVisible()

  const newTitle = await threadTitleGenerated2.textContent()

  if (!newTitle) {
    throw new Error("Thread title not found")
  }

  await editThreadButton.click()

  const deleteThreadButton = page.getByTestId("delete-thread-button")

  await expect(deleteThreadButton).toBeVisible()

  await deleteThreadButton.click()

  await wait(1000)

  await deleteThreadButton.click()

  await wait(8000)

  await expect(threadsContainer).toBeVisible()

  await expect(page.getByText(newTitle)).not.toBeVisible()

  if (createChat) {
    await prepare({ page })

    await chat({
      isNewChat: true,
      page,
      isLive,
      creditsConsumed: total * 2,
      messagesConsumed: 0,
      isMember,
      instruction: "Help me write a short story",
      bookmark,
      prompts: [
        {
          text: "Explain the concept of dependency injection and its benefits shortly",
          model: "sushi",
        },
        {
          text: "What's the difference between SQL and NoSQL databases briefly?",
          model: "sushi",
        },
        {
          text: "How do you implement authentication with JWT tokens briefly?",
          model: "sushi",
        },
      ],
    })

    total = total + 3

    const menuHomeButton = page.getByTestId("menu-home-button")

    await expect(menuHomeButton).toBeVisible()

    await menuHomeButton.click()

    await wait(3000)

    await prepare({ page })

    await chat({
      isNewChat: false,
      creditsConsumed: total * 2,
      messagesConsumed: 3,
      bookmark: false,
      page,
      isMember,
      isLive,
      instruction: "Help me write a short story",
      prompts: [
        {
          text: "What are the key principles of clean code shortly?",
          model: "sushi",
        },
        {
          text: "Explain the SOLID principles with examples shortly?",
          model: "sushi",
        },
        {
          text: "How do you handle error handling in distributed systems briefly?",
          model: "sushi",
        },
      ],
    })

    total = total + 3

    await loadMore.click()
    await wait(1000)

    await expect(
      (await getFirstThread()).getByTestId("threads-bookmarked"),
    ).not.toBeVisible({
      timeout: 15000,
    })

    await (await getFirstThread()).getByTestId("threads-not-bookmarked").click()
    await wait(1000)

    await expect(
      (await getFirstThread()).getByTestId("threads-bookmarked"),
    ).toBeVisible({
      timeout: 15000,
    })

    await expect(
      (await getSecondThread()).getByTestId("threads-not-bookmarked"),
    ).not.toBeVisible({
      timeout: 15000,
    })

    await thread({
      page,
      isMember,
      createChat: false,
      isLive,
    })
  }

  return true
}
