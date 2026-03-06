/**
 * @file 加入申请端到端测试
 * @description 测试申请表单的完整用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('加入申请页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/join')
  })

  test('应正确显示申请表单', async ({ page }) => {
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('应显示必填字段标记', async ({ page }) => {
    const requiredFields = page.locator('input[required], [aria-required="true"]')
    const count = await requiredFields.count()
    expect(count).toBeGreaterThan(0)
  })

  test('应能填写并提交表单', async ({ page }) => {
    const testEmail = `test${Date.now()}@example.com`

    await page.fill('input[name="name"], input#name, input[placeholder*="姓名"]', '测试申请人')
    await page.fill('input[name="email"], input#email, input[type="email"]', testEmail)

    const experienceField = page.locator('textarea[name="experience"], textarea#experience, textarea').first()
    if (await experienceField.count() > 0) {
      await experienceField.fill('我有丰富的游戏经验')
    }

    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first()
    await submitButton.click()

    await page.waitForTimeout(1000)

    const successIndicator = page.locator('.success, .toast, [class*="success"], [class*="message"]')
    const hasSuccess = await successIndicator.count() > 0

    expect(hasSuccess || page.url().includes('success')).toBeTruthy()
  })

  test('应验证必填字段', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first()
    await submitButton.click()

    const errorMessage = page.locator('.error, [class*="error"], .invalid, [class*="invalid"]')
    const hasError = await errorMessage.count() > 0

    expect(hasError).toBeTruthy()
  })

  test('应验证邮箱格式', async ({ page }) => {
    await page.fill('input[name="name"], input#name', '测试用户')
    await page.fill('input[name="email"], input#email, input[type="email"]', 'invalid-email')

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    const emailInput = page.locator('input[type="email"]')
    const isValid = await emailInput.evaluate(el => el.checkValidity())

    expect(isValid).toBeFalsy()
  })

  test('应显示申请要求说明', async ({ page }) => {
    const requirements = page.locator('.requirements, [class*="requirement"], ul li')
    const count = await requirements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('应显示申请流程步骤', async ({ page }) => {
    const process = page.locator('.process, .steps, [class*="step"]')
    const count = await process.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('申请状态查询', () => {
  test('应能访问申请状态页面', async ({ page }) => {
    await page.goto('/application/status')

    const queryForm = page.locator('form, .query-form')
    await expect(queryForm).toBeVisible()
  })

  test('应能查询申请状态', async ({ page }) => {
    await page.goto('/application/status')

    const emailInput = page.locator('input[type="email"]').first()
    await emailInput.fill('test@example.com')

    const queryButton = page.locator('button[type="submit"]').first()
    await queryButton.click()

    await page.waitForTimeout(1000)

    const result = page.locator('.result, .status, [class*="result"], [class*="status"]')
    const hasResult = await result.count() > 0

    expect(hasResult || page.locator('.not-found, [class*="not-found"]').count() > 0).toBeTruthy()
  })
})

test.describe('表单可访问性', () => {
  test('表单应支持键盘导航', async ({ page }) => {
    await page.goto('/join')

    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('表单应有正确的标签关联', async ({ page }) => {
    await page.goto('/join')

    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const name = await input.getAttribute('name')

      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        expect(hasLabel || name).toBeTruthy()
      }
    }
  })
})

test.describe('边界条件测试', () => {
  test('应处理超长输入', async ({ page }) => {
    await page.goto('/join')

    const longText = 'A'.repeat(1000)

    const nameInput = page.locator('input[name="name"], input#name').first()
    await nameInput.fill(longText)

    const value = await nameInput.inputValue()
    expect(value.length).toBeLessThanOrEqual(100)
  })

  test('应处理特殊字符输入', async ({ page }) => {
    await page.goto('/join')

    const specialChars = '<script>alert("test")</script>'

    const nameInput = page.locator('input[name="name"], input#name').first()
    await nameInput.fill(specialChars)

    const value = await nameInput.inputValue()
    expect(value).not.toContain('<script>')
  })

  test('应处理空白输入', async ({ page }) => {
    await page.goto('/join')

    const nameInput = page.locator('input[name="name"], input#name').first()
    await nameInput.fill('   ')

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    const errorMessage = page.locator('.error, [class*="error"]')
    const hasError = await errorMessage.count() > 0

    expect(hasError).toBeTruthy()
  })
})
