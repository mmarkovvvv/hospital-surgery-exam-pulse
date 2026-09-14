import { expect, test } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100'

test.describe('Frontend access funnel', () => {
  test('guest sees public and locked catalog items', async ({ page }) => {
    await page.goto(baseURL)

    await expect(page).toHaveTitle('Beep Academy — учебная платформа')
    await expect(page.locator('h1')).toContainText('Готовься к экзамену')
    await expect(page.getByText('Открыто всем').first()).toBeVisible()
    await expect(page.getByText('После регистрации').first()).toBeVisible()
    await expect(page.getByText('По подписке').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
  })

  test('guest can open registration form', async ({ page }) => {
    await page.goto(baseURL)
    await page.getByRole('link', { name: 'Регистрация' }).first().click()

    await expect(page).toHaveURL(/\/register$/)
    await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible()
    await expect(page.getByLabel('Почта')).toBeVisible()
  })

  test('subject catalog opens a subject workspace', async ({ page }) => {
    await page.goto(baseURL)
    await page.getByRole('link', { name: 'Госпитальная хирургия' }).click()

    await expect(page).toHaveURL(/\/subjects\/hospital-surgery$/)
    await expect(page.getByRole('heading', { name: 'Госпитальная хирургия' }).first()).toBeVisible()
    await expect(page.locator('nav.breadcrumbs')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Тест', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Избранное', exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Тест', exact: true }).click()
    await expect(page).toHaveURL(/\/subjects\/hospital-surgery\/test$/)
    await expect(page.getByRole('heading', { name: 'Тест', exact: true })).toBeVisible()
  })

  test('USMLE workspace supports exam modes and interactive answers', async ({ page }) => {
    await page.goto(`${baseURL}/subjects/usmle`)
    await page.getByRole('link', { name: 'Открыть экзамен →' }).click()

    await expect(page).toHaveURL(/\/subjects\/usmle\/exam$/)
    await expect(page.getByRole('heading', { name: 'Экзаменационный режим' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Step 1 · блоки/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Step 3 · CCS/ })).toBeVisible()

    await page.getByRole('button', { name: 'Начать режим' }).click()
    await expect(page.getByText('Вопрос 1 · single-best-answer')).toBeVisible()
    await page.locator('.usmle-option').first().click()
    await page.getByRole('button', { name: 'Проверить ответ' }).click()
    await expect(page.getByText(/Правильно|Неправильно/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Следующий вопрос →' })).toBeVisible()

    await page.getByRole('button', { name: /Step 3 · CCS/ }).click()
    await page.getByRole('button', { name: 'Начать режим' }).click()
    await expect(page.getByText('Динамический случай')).toBeVisible()
    await page.getByRole('button', { name: 'Собрать анамнез' }).click()
    await expect(page.getByText(/Собрать анамнез:/)).toBeVisible()
  })

  test('registration unlocks registered materials', async ({ page }) => {
    const email = `student-${Date.now()}@example.com`
    await page.goto(`${baseURL}/register`)
    await page.getByLabel('Почта').fill(email)
    await page.getByLabel('Пароль').fill('student-password-123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page).toHaveURL(`${baseURL}/`)
    await expect(page.getByText('Зарегистрирован', { exact: true })).toBeVisible()
    await expect(page.getByText(/\d+ материалов доступно сейчас/)).toBeVisible()
  })

  test('registered learner can use interactive formats', async ({ page }) => {
    const email = `interactive-${Date.now()}@example.com`
    await page.goto(`${baseURL}/register`)
    await page.getByLabel('Почта').fill(email)
    await page.getByLabel('Пароль').fill('student-password-123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()
    await expect(page).toHaveURL(`${baseURL}/`)

    await page.goto(`${baseURL}/subjects/hospital-surgery/cards`)
    await expect(page.getByRole('button', { name: 'Показать ответ' })).toBeVisible()
    await page.getByRole('button', { name: 'Показать ответ' }).click()
    await expect(page.getByText('Эталон', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Знаю' }).click()

    await page.goto(`${baseURL}/subjects/hospital-surgery/tickets`)
    await expect(page.locator('.ticket-category-nav a')).toHaveCount(40)
    await expect(page.locator('.ticket-list-card')).toHaveCount(57)
    const firstTicket = page.locator('.ticket-list-card').first()
    await firstTicket.getByRole('button', { name: 'Показать эталон' }).click()
    await expect(firstTicket.getByRole('heading', { name: 'Что ответить' })).toBeVisible()
    await firstTicket.getByRole('button', { name: 'Знаю' }).click()
    await expect(firstTicket.getByText('Освоено', { exact: true })).toBeVisible()

    await page.goto(`${baseURL}/subjects/hospital-surgery/test`)
    await expect(page.getByRole('button', { name: 'Проверить ответ' })).toBeVisible()
    await page.locator('.interactive-option').first().click()
    await page.getByRole('button', { name: 'Проверить ответ' }).click()
    await expect(page.getByText(/Правильно|Неправильно/)).toBeVisible()

    await page.goto(`${baseURL}/subjects/hospital-surgery/clinical-cases`)
    await expect(page.getByRole('button', { name: 'Показать разбор' })).toBeVisible()
    await page.getByRole('button', { name: 'Показать разбор' }).click()
    await expect(page.getByText('Эталон разбора', { exact: true })).toBeVisible()
    await expect(page.locator('.interactive-step-list')).toHaveCSS('display', 'grid')

    const verifyImageCases = async (url: string, total: number) => {
      await page.goto(url)
      await expect(page.locator('.image-case-queue-item')).toHaveCount(total)
      await expect(page.locator('.interactive-image-frame img')).toHaveCount(1)

      for (let index = 0; index < total; index += 1) {
        const image = page.locator('.interactive-image-frame img')
        await expect(image).toBeVisible()
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
        await page.getByRole('button', { name: 'Показать разбор' }).click()

        if (index < total - 1) {
          await page.getByRole('button', { name: 'Дальше' }).click()
        }
      }
    }

    await verifyImageCases(`${baseURL}/subjects/hospital-surgery/image-cases`, 10)
    await verifyImageCases(`${baseURL}/subjects/healthcare-basics/image-cases`, 10)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${baseURL}/subjects/healthcare-basics/image-cases`)
    await expect(page.locator('.image-case-queue-item')).toHaveCount(10)
    await expect(page.locator('.interactive-image-frame img')).toHaveCount(1)
    await expect.poll(() => page.locator('.interactive-image-frame img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Показать разбор' }).click()
    await expect(page.getByRole('button', { name: 'Дальше' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
  })

  test('mobile subject workspace stays usable across sections', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    const email = `mobile-${Date.now()}@example.com`
    await page.goto(`${baseURL}/register`)
    await page.getByLabel('Почта').fill(email)
    await page.getByLabel('Пароль').fill('student-password-123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()
    await expect(page).toHaveURL(`${baseURL}/`)

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
      await page.goto(`${baseURL}${path}`)
      await expect(page.locator('.subject-main')).toBeVisible()
      await expect(page.locator('.mobile-breadcrumbs')).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy()
    }

    await page.goto(`${baseURL}/subjects/hospital-surgery`)
    await page.getByRole('button', { name: 'Открыть меню предмета' }).click()
    await expect(page.locator('.subject-sidebar')).toHaveClass(/is-open/)
    await expect(page.getByRole('link', { name: 'Билеты', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Билеты', exact: true }).click()
    await expect(page).toHaveURL(/\/subjects\/hospital-surgery\/tickets$/)
    await expect(page.locator('.ticket-list-card')).toHaveCount(57)
    await page.locator('.ticket-list-card').first().getByRole('button', { name: 'Показать эталон' }).click()
    await expect(page.locator('.ticket-list-card').first().getByRole('heading', { name: 'Что ответить' })).toBeVisible()
  })
})
