import { expect, type Page } from "@playwright/test"
import { wait } from ".."
import { prepare } from "./clean"

export const signIn = async ({
  page,
  isOpened = false,
  signOut = false,
  register = false,
  email = process.env.VEX_TEST_EMAIL_2!,
  password = process.env.VEX_TEST_PASSWORD_2!,
}: {
  page: Page
  isOpened?: boolean
  signOut?: boolean
  register?: boolean
  email?: string
  password?: string
}) => {
  const registerButton = page.getByTestId("register-button")

  if (!isOpened) {
    await expect(registerButton).toBeVisible({
      timeout: 15000,
    })
    await registerButton.click()
  }

  // const memberButton = page.getByTestId("member-button")
  // await expect(memberButton).toBeVisible({
  //   timeout: 5000,
  // })

  // await memberButton.click()

  // const signInButton = page.getByTestId("login-button")
  // await expect(signInButton).toBeVisible({
  //   timeout: 5000,
  // })

  // await signInButton.click()

  const modal = page.getByTestId("sign-in-modal")
  await expect(modal).toBeVisible()

  const emailInput = page.getByTestId("sign-in-email")
  await expect(emailInput).toBeVisible()

  await emailInput.fill(email)

  const passwordInput = page.getByTestId("sign-in-password")
  await expect(passwordInput).toBeVisible()

  await passwordInput.fill(password)

  await wait(2000)

  const signInSubmit = page.getByTestId("login-submit")
  await expect(signInSubmit).toBeVisible()

  await signInSubmit.click({
    force: true,
  })

  // await expect(signInButton).not.toBeVisible({
  //   timeout: 1000000,
  // })

  const accountButton = page.getByTestId("account-button")
  await expect(accountButton).toBeVisible({
    timeout: 50000,
  })

  await wait(5000)

  await prepare({ page })

  if (signOut) {
    await accountButton.click()

    const email = page.getByTestId("account-email")
    await expect(email).toBeVisible()

    const logoutButton = page.getByTestId("account-logout-button")
    await expect(logoutButton).toBeVisible()

    await logoutButton.click()

    await expect(signInButton).toBeVisible({
      timeout: 15000,
    })
  }
}
