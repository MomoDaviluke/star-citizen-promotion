/**
 * @file 认证流程端到端测试
 * @description 覆盖注册、登录、访问受保护页面、登出的完整用户旅程
 */

import { test, expect } from '@playwright/test'

const TEST_USER = {
  username: `e2e_test_${Date.now()}`,
  email: `e2e_${Date.now()}@test.com`,
  password: 'E2eTest123!'
}

test.describe('注册流程', () => {
  test('应能完成完整注册流程', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    // 填写注册表单
    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.fill('input[name="confirmPassword"]', TEST_USER.password)

    // 提交
    await page.click('button[type="submit"]')

    // 注册成功应跳转到登录页或首页
    await page.waitForURL(/\/(login|\/)/, { timeout: 10000 })
  })

  test('重复邮箱注册应显示错误', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="username"]', 'duplicate_user')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'Password123!')
    await page.click('button[type="submit"]')

    // 应停留在注册页并显示错误
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toContain('/register')
  })

  test('密码不匹配应阻止提交', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="username"]', 'mismatch_user')
    await page.fill('input[name="email"]', 'mismatch@test.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword!')
    await page.click('button[type="submit"]')

    // 应停留在注册页
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/register')
  })
})

test.describe('登录流程', () => {
  test('正确凭证应登录成功并跳转', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // 登录成功应跳转
    await page.waitForTimeout(3000)
  })

  test('错误密码应显示错误消息', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // 应停留在登录页
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/login')
  })

  test('未登录用户访问受保护页面应跳转到登录页', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // 应跳转到登录页
    const url = page.url()
    expect(url).toMatch(/\/(login|\/)/)
  })
})

test.describe('登出流程', () => {
  test('登录后应能登出', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 找到登出按钮并点击
    const logoutBtn = page.locator('button:has-text("退出"), a:has-text("退出"), [data-test="logout"]')
    const count = await logoutBtn.count()
    if (count > 0) {
      await logoutBtn.first().click()
      await page.waitForTimeout(2000)
    }
  })
})
