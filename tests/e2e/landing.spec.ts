import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders the wordmark and hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('ask me')
    await expect(page.locator('text=Create your profile')).toBeVisible()
  })

  test('nav links are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Sign in')).toBeVisible()
    await expect(page.locator('text=Get started')).toBeVisible()
  })

  test('personas section renders both sides', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=I have something')).toBeVisible()
    await expect(page.locator("text=I'm looking for")).toBeVisible()
  })

  test('sign in link navigates to login', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/login')
  })

  test('get started navigates to signup', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/signup"]')
    await expect(page).toHaveURL('/signup')
  })
})
