import { expect, type Page } from "@playwright/test"

export const taskReports = async ({
  page,
  isGuest = true,
}: {
  page: Page
  isGuest?: boolean
}) => {
  if (isGuest) {
    const showDemoTaskReports = page.getByTestId("show-demo-task-reports")
    await expect(showDemoTaskReports).toBeVisible()
    await showDemoTaskReports.click()

    const hideDemoTaskReportsButton = page.getByTestId(
      "show-demo-task-reports-button-hide",
    )
    await expect(hideDemoTaskReportsButton).toBeVisible()
    await hideDemoTaskReportsButton.click()

    const showDemoTaskReportsButton = page.getByTestId(
      "show-demo-task-reports-button-show",
    )
    await expect(showDemoTaskReportsButton).toBeVisible()
    await showDemoTaskReportsButton.click()

    await page.waitForTimeout(1000)
  } else {
    const taskReportsButton = page.getByTestId("task-reports-button")
    await expect(taskReportsButton).toBeVisible()
    await taskReportsButton.click()

    const showDemoTaskReportsButton = page.getByTestId(
      "show-demo-task-reports-button-show",
    )
    await expect(showDemoTaskReportsButton).toBeVisible()
    await showDemoTaskReportsButton.click()

    await page.waitForTimeout(5000)

    const hideDemoTaskReportsButton = page.getByTestId(
      "show-demo-task-reports-button-hide",
    )
    await expect(hideDemoTaskReportsButton).toBeVisible()
    await hideDemoTaskReportsButton.click()

    await page.waitForTimeout(1000)
  }
}
