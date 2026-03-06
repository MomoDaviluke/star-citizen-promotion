/**
 * @file 加入申请端到端测试
 * @description 测试申请表单的完整用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('加入申请页面', () => {
  test.use({ baseURL: 'http://localhost:4173' })

  test('应正确显示申请表单', async ({ page }) => {
    await page.goto('/join')
    const form = page.locator('form')
    await expect(form).toBeVisible({ timeout: 10000 })
  })

  test('应验证必填字段', async ({ page }) => {
    await page.goto('/join')

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    await page.waitForTimeout(500)

    const errorMessage = page.locator('.error, [class*="error"], .invalid, [class*="invalid"]')
    const hasError = await errorMessage.count() > 0

    expect(hasError).toBeTruthy()
  })

  test('应验证邮箱格式', async ({ page }) => {
    await page.goto('/join')

    await page.fill('input[name="name"], input#name', '测试用户')
    await page.fill('input[name="email"], input#email, input[type="email"]', 'invalid-email')

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    await page.waitForTimeout(500)

    const emailInput = page.locator('input[type="email"]')
    const isValid = await emailInput.evaluate(el => el.checkValidity())

    expect(isValid).toBeFalsy()
  })
})

test.describe('申请状态查询', () => {
  test.use({ baseURL: 'http://localhost:4173' })

  test('应能访问申请状态页面', async ({ page }) => {
    await page.goto('/application/status')

    const queryForm = page.locator('form, .query-form')
    await expect(queryForm).toBeVisible({ timeout: 10000 })
  })
})
