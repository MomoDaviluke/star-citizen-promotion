/**
 * @file 加入申请端到端测试
 * @description 验证申请表单的结构完整性与提交流程（TD-18 修复：
 *              以真实断言替代 formCount >= 0 恒真断言；
 *              API 通过 page.route mock，测试前端行为不依赖后端运行）
 */

import { test, expect } from '@playwright/test'

test.describe('加入申请页面结构', () => {
  test('应渲染完整申请表单与必填字段', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    // 表单存在（原断言 formCount >= 0 恒真）
    const form = page.locator('form.join-form')
    await expect(form).toBeVisible()

    // 必填字段：姓名 + 邮箱（Join.vue required 属性）
    await expect(page.locator('#join-name')).toBeVisible()
    await expect(page.locator('#join-email')).toHaveAttribute('required', '')

    // 可选字段：Discord / 游戏经验 / 加入原因
    await expect(page.locator('#join-discord')).toBeVisible()
    await expect(page.locator('#join-experience')).toBeVisible()
    await expect(page.locator('#join-reason')).toBeVisible()

    // 提交按钮
    await expect(page.locator('button.join-submit')).toBeVisible()
  })

  test('未填写必填字段时 HTML5 校验应阻止提交', async ({ page }) => {
    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    // 直接点击提交（必填字段为空）
    await page.locator('button.join-submit').click()
    await page.waitForTimeout(500)

    // 仍停留在表单页，未出现成功面板
    await expect(page.locator('.success-panel')).toHaveCount(0)
    expect(page.url()).toContain('/join')
  })
})

test.describe('加入申请提交流程', () => {
  test('提交成功应展示申请已提交面板', async ({ page }) => {
    // mock 后端申请接口（无后端运行时的标准 E2E 方案）
    await page.route('**/api/v1/applications', route =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'test-id' } })
      })
    )

    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#join-name', 'E2E 测试飞行员')
    await page.fill('#join-email', 'e2e-test@example.com')
    await page.locator('button.join-submit').click()

    // 成功面板出现并展示关键信息
    const successPanel = page.locator('.success-panel')
    await expect(successPanel).toBeVisible({ timeout: 10000 })
    await expect(successPanel).toContainText('申请已提交')
  })

  test('后端拒绝时应展示错误消息且不出现成功面板', async ({ page }) => {
    await page.route('**/api/v1/applications', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '邮箱已被使用' })
      })
    )

    await page.goto('/join')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#join-name', 'E2E 测试飞行员')
    await page.fill('#join-email', 'duplicate@example.com')
    await page.locator('button.join-submit').click()

    // 错误消息展示，无成功面板
    await expect(page.locator('.form-message--error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.success-panel')).toHaveCount(0)
  })
})

test.describe('申请状态页面', () => {
  test('应能加载申请状态页面', async ({ page }) => {
    await page.goto('/application/status')
    await page.waitForLoadState('domcontentloaded')

    // 页面应有真实内容（标题/说明），而非空白
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    expect((await h1.textContent())?.trim().length).toBeGreaterThan(2)
  })
})

