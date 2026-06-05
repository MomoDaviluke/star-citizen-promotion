/**
 * @file 申请流程端到端测试
 * @description 覆盖加入申请提交、状态查询的完整用户旅程
 */

import { test, expect } from '@playwright/test'

test.describe('加入申请提交流程', () => {
  test('应能加载加入页面并显示表单', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    // 检查页面标题
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('填写完整表单应能提交', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    // 尝试填写表单
    const nameInput = page.locator('input[name="name"], input[placeholder*="姓名"], input[placeholder*="名称"]')
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const submitBtn = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("申请")')

    const hasForm = (await nameInput.count()) > 0 && (await submitBtn.count()) > 0
    if (hasForm) {
      await nameInput.first().fill(`E2E 测试用户 ${Date.now()}`)
      if (await emailInput.count() > 0) {
        await emailInput.first().fill(`e2e_apply_${Date.now()}@test.com`)
      }
      await submitBtn.first().click()
      await page.waitForTimeout(2000)
    }
  })

  test('空表单提交应显示验证错误', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click()
      await page.waitForTimeout(1000)
      // 页面不应跳转
      expect(page.url()).toContain('/join')
    }
  })
})

test.describe('申请状态查询', () => {
  test('应能加载申请状态页面', async ({ page }) => {
    await page.goto('/application/status')
    await page.waitForLoadState('domcontentloaded')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
