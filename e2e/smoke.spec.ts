import { expect, test } from '@playwright/test'

test('first run: start, answer, see the worked solution', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Атлас' })).toBeVisible()
  await page.getByRole('button', { name: /Начать забег|Продолжить забег/ }).click()

  await expect(page.getByRole('button', { name: 'Проверить' })).toBeVisible()
  const mathField = page.locator('math-field')
  await mathField.click()
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('MATH-FIELD')
  await page.keyboard.type('123456789', { delay: 20 })
  await expect
    .poll(() => mathField.evaluate((el) => (el as unknown as { value: string }).value), { timeout: 10_000 })
    .toBe('123456789')
  await page.getByRole('button', { name: 'Проверить' }).click()

  await expect(page.getByText(/Не сходится/)).toBeVisible()
  await expect(page.getByText(/Правильный ответ/)).toBeVisible()
  // A miss opens the full worked solution on its own.
  await expect(page.locator('ol li').first()).toBeVisible()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByText(/Не сходится/)).toHaveCount(0)
})

test('leaving a problem and coming back keeps the field usable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Начать забег|Продолжить забег/ }).click()
  await expect(page.getByRole('button', { name: 'Проверить' })).toBeVisible()
  await page.locator('math-field').click()
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('MATH-FIELD')

  // Leave without moving the focus first, the way the exam clock does when it hands the paper in
  // while the learner is typing. (Headless Chromium is forgiving here; a real browser is not, which
  // is why MathInput releases MathLive's focus pointer on teardown.)
  await page.evaluate(() => {
    const pause = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Пауза')
    pause?.click()
  })
  await expect(page.getByRole('heading', { name: 'Атлас' })).toBeVisible()

  await page.getByRole('button', { name: 'Продолжить забег' }).click()
  await expect(page.getByRole('button', { name: 'Проверить' })).toBeVisible()
  await expect(page.locator('math-field')).toHaveCount(1)
})
