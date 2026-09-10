import { expect, test } from '@playwright/test'

test.describe('Frontend access funnel', () => {
  test('guest sees public and locked catalog items', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle('Пульс — учебная платформа')
    await expect(page.locator('h1')).toContainText('Готовься к экзамену')
    await expect(page.getByText('Открыто всем').first()).toBeVisible()
    await expect(page.getByText('После регистрации').first()).toBeVisible()
    await expect(page.getByText('По подписке').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
  })

  test('guest can open registration form', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: 'Регистрация' }).first().click()

    await expect(page).toHaveURL(/\/register$/)
    await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible()
    await expect(page.getByLabel('Почта')).toBeVisible()
  })

  test('registration unlocks registered materials', async ({ page }) => {
    const email = `student-${Date.now()}@example.com`
    await page.goto('http://localhost:3000/register')
    await page.getByLabel('Почта').fill(email)
    await page.getByLabel('Пароль').fill('student-password-123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page).toHaveURL('http://localhost:3000/')
    await expect(page.getByText('Зарегистрирован', { exact: true })).toBeVisible()
    await expect(page.getByText(/\d+ материалов доступно сейчас/)).toBeVisible()
  })
})
