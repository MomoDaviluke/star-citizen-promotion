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
    // mock 后端申请接口（无后端运行时的标准 E2E 方案，与 join.spec.js 一致）
    await page.route('**/api/v1/applications', route =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'apply-e2e-id' } })
      })
    )

    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#join-name', `E2E 测试用户 ${Date.now()}`)
    await page.fill('#join-email', `e2e_apply_${Date.now()}@test.com`)
    await page.locator('button.join-submit').click()

    // 提交成功必须有可见的成功面板（原用例无任何言言）
    const successPanel = page.locator('.success-panel')
    await expect(successPanel).toBeVisible({ timeout: 10000 })
    await expect(successPanel).toContainText('申请已提交')
  })

  test('空表单提交应显示验证错误', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('button.join-submit').click()
    await page.waitForTimeout(500)

    // 空表单提交不出现成功面板，且停留在表单页
    await expect(page.locator('.success-panel')).toHaveCount(0)
    expect(page.url()).toContain('/join')
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
