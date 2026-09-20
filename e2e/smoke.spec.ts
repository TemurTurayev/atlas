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
  await expect(page.getByText('Разбор')).toBeVisible()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByText(/Не сходится/)).toHaveCount(0)
})
