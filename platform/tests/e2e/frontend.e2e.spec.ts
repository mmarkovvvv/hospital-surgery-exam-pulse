import { expect, test } from '@playwright/test'

test.describe('Frontend access funnel', () => {
  test('guest sees public and locked catalog items', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle('Beep Academy — учебная платформа')
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

  test('subject catalog opens a subject workspace', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: 'Госпитальная хирургия' }).click()

    await expect(page).toHaveURL(/\/subjects\/hospital-surgery$/)
    await expect(page.getByRole('heading', { name: 'Госпитальная хирургия' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Тест', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Избранное', exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Тест', exact: true }).click()
    await expect(page).toHaveURL(/\/subjects\/hospital-surgery\/test$/)
    await expect(page.getByRole('heading', { name: 'Тест', exact: true })).toBeVisible()
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

  test('registered learner can use interactive formats', async ({ page }) => {
    const email = `interactive-${Date.now()}@example.com`
    await page.goto('http://localhost:3000/register')
    await page.getByLabel('Почта').fill(email)
    await page.getByLabel('Пароль').fill('student-password-123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()
    await expect(page).toHaveURL('http://localhost:3000/')

    await page.goto('http://localhost:3000/subjects/hospital-surgery/cards')
    await expect(page.getByRole('button', { name: 'Показать ответ' })).toBeVisible()
    await page.getByRole('button', { name: 'Показать ответ' }).click()
    await expect(page.getByText('Эталон', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Знаю' }).click()

    await page.goto('http://localhost:3000/subjects/hospital-surgery/tickets')
    await expect(page.getByRole('button', { name: 'Показать эталон' })).toBeVisible()
    await page.getByRole('button', { name: 'Показать эталон' }).click()
    await expect(page.getByRole('heading', { name: 'Что ответить' })).toBeVisible()
    await page.getByRole('button', { name: 'Дальше' }).click()

    await page.goto('http://localhost:3000/subjects/hospital-surgery/test')
    await expect(page.getByRole('button', { name: 'Проверить ответ' })).toBeVisible()
    await page.locator('.interactive-option').first().click()
    await page.getByRole('button', { name: 'Проверить ответ' }).click()
    await expect(page.getByText(/Правильно|Неправильно/)).toBeVisible()

    await page.goto('http://localhost:3000/subjects/hospital-surgery/clinical-cases')
    await expect(page.getByRole('button', { name: 'Показать разбор' })).toBeVisible()
    await page.getByRole('button', { name: 'Показать разбор' }).click()
    await expect(page.getByText('Эталон разбора', { exact: true })).toBeVisible()

    const verifyImageCases = async (url: string, total: number) => {
      await page.goto(url)
      await expect(page.locator('.interactive-image img')).toHaveCount(1)

      for (let index = 0; index < total; index += 1) {
        const image = page.locator('.interactive-image img')
        await expect(image).toBeVisible()
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
        await page.getByRole('button', { name: 'Показать разбор' }).click()

        if (index < total - 1) {
          await page.getByRole('button', { name: 'Дальше' }).click()
        }
      }
    }

    await verifyImageCases('http://localhost:3000/subjects/hospital-surgery/image-cases', 10)
    await verifyImageCases('http://localhost:3000/subjects/healthcare-basics/image-cases', 10)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/subjects/healthcare-basics/image-cases')
    await expect(page.locator('.interactive-image img')).toHaveCount(1)
    await expect.poll(() => page.locator('.interactive-image img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Показать разбор' }).click()
    await expect(page.getByRole('button', { name: 'Дальше' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
  })

  test('mobile subject workspace stays usable across sections', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    const paths = [
      '/subjects/hospital-surgery',
      '/subjects/hospital-surgery/cards',
      '/subjects/hospital-surgery/test',
      '/subjects/hospital-surgery/tickets',
      '/subjects/hospital-surgery/clinical-cases',
      '/subjects/hospital-surgery/image-cases',
      '/subjects/hospital-surgery/section/progress',
      '/subjects/hospital-surgery/section/errors',
      '/subjects/hospital-surgery/section/favorites',
      '/subjects/hospital-surgery/section/sources',
    ]

    for (const path of paths) {
      await page.goto(`http://localhost:3000${path}`)
      await expect(page.locator('.subject-main')).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
    }

    await page.goto('http://localhost:3000/subjects/hospital-surgery')
    await page.getByRole('button', { name: 'Открыть меню предмета' }).click()
    await expect(page.locator('.subject-sidebar')).toHaveClass(/is-open/)
    await expect(page.getByRole('link', { name: 'Билеты', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Билеты', exact: true }).click()
    await expect(page).toHaveURL(/\/subjects\/hospital-surgery\/tickets$/)
  })
})
