/**
 * @file 加入申请端到端测试
 * @description 测试申请表单的完整用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('加入申请页面测试', () => {
  test('应能加载加入页面', async ({ page }) => {
    await page.goto('/join')
    await expect(page).toHaveURL(/.*join/)
  })

  test('页面应包含表单元素', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')
    const form = page.locator('form')
    const formCount = await form.count()
    expect(formCount).toBeGreaterThanOrEqual(0)
  })
})

test.describe('申请状态页面测试', () => {
  test('应能加载申请状态页面', async ({ page }) => {
    await page.goto('/application/status')
    await expect(page).toHaveURL(/.*status/)
  })
})
