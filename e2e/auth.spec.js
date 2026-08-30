/**
 * @file 认证流程端到端测试
 * @description 覆盖注册、登录、访问受保护页面、登出的完整用户旅程。
 *              API 通过 page.route mock（无后端运行时的标准 E2E 方案），
 *              修复 TD-18：以真实跳转/错误消息断言替代 waitForTimeout 空跑。
 */

import { test, expect } from '@playwright/test'

const TEST_USER = {
  username: `e2e_test_${Date.now()}`,
  email: `e2e_${Date.now()}@test.com`,
  password: 'E2eTest123!'
}

/** mock 未登录态：/auth/me 返回 401（auth 端点不触发 token 刷新） */
async function mockAnonymous(page) {
  await page.route('**/api/v1/auth/me', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthorized' })
    })
  )
}

/** mock 注册成功：201 */
async function mockRegisterSuccess(page) {
  await page.route('**/api/v1/auth/register', route =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { user: { id: 'u-e2e', username: TEST_USER.username, role: 'member' } }
      })
    })
  )
}

/** mock 注册失败：邮箱已存在 */
async function mockRegisterConflict(page) {
  await page.route('**/api/v1/auth/register', route =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: '邮箱已被注册' })
    })
  )
}

/** mock 登录成功：200 + user（httpOnly cookie 由浏览器自动管理） */
async function mockLoginSuccess(page) {
  await page.route('**/api/v1/auth/login', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { user: { id: 'u-e2e', username: TEST_USER.username, role: 'member' } }
      })
    })
  )
}

/** mock 登录失败：401 */
async function mockLoginFailure(page) {
  await page.route('**/api/v1/auth/login', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: '邮箱或密码错误' })
    })
  )
}

test.describe('注册流程', () => {
  test('注册成功应跳转到首页', async ({ page }) => {
    await mockAnonymous(page)
    await mockRegisterSuccess(page)

    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.fill('input[name="confirmPassword"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Register.vue 成功后 router.push('/')
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 })
  })

  test('重复邮箱注册应显示错误消息并停留在注册页', async ({ page }) => {
    await mockAnonymous(page)
    await mockRegisterConflict(page)

    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="username"]', 'duplicate_user')
    await page.fill('input[name="email"]', 'duplicate@test.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'Password123!')
    await page.click('button[type="submit"]')

    // 后端错误消息展示（原断言仅检查 URL，错误提示未被验证）
    await expect(page.locator('text=邮箱已被注册')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/register')
  })

  test('密码不匹配应被前端校验阻止', async ({ page }) => {
    await mockAnonymous(page)
    await page.goto('/register')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="username"]', 'mismatch_user')
    await page.fill('input[name="email"]', 'mismatch@test.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword!')
    await page.click('button[type="submit"]')

    // Register.vue 前端校验：errors.confirmPassword 显示
    await expect(page.locator('text=两次输入的密码不一致')).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain('/register')
  })
})

test.describe('登录流程', () => {
  test('正确凭证应登录成功并跳转首页', async ({ page }) => {
    await mockAnonymous(page)
    await mockLoginSuccess(page)

    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Login.vue 成功后 router.push(redirect || '/')
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 })
  })

  test('错误密码应显示错误消息并停留在登录页', async ({ page }) => {
    await mockAnonymous(page)
    await mockLoginFailure(page)

    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // 后端错误消息展示（原测试 waitForTimeout(2000) 后仅检查 URL，无消息断言）
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('未登录用户访问受保护页面应跳转到登录页并携带 redirect 参数', async ({ page }) => {
    await mockAnonymous(page)

    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')

    // 路由守卫：requiresAuth → /login?redirect=/profile
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('redirect')
  })
})

test.describe('登出流程', () => {
  test('登录后应能从个人中心登出并返回未登录态', async ({ page }) => {
    await mockAnonymous(page)
    await mockLoginSuccess(page)

    // mock 登出成功
    await page.route('**/api/v1/auth/logout', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    )

    // 真实用户流：访问 /profile → 守卫踢到 /login?redirect=/profile → 登录 → redirect 回 /profile
    await page.goto('/profile')
    await page.waitForURL(/\/login\?redirect/, { timeout: 10000 })

    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // 登录成功后 redirect 参数应带回个人中心（SPA 客户端导航，无整页刷新竞态）
    await page.waitForURL(/\/profile/, { timeout: 10000 })

    // 登出入口位于个人中心（Profile.vue danger zone）
    const logoutBtn = page.locator('button:has-text("退出登录")')
    await expect(logoutBtn).toBeVisible({ timeout: 10000 })
    await logoutBtn.click()

    // Profile.vue 登出后重定向到首页（window.location.href = '/'）
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 })

    // 登出后再次访问受保护页面应被守卫拦截到登录页
    await page.goto('/profile')
    await page.waitForURL(/\/login\?redirect/, { timeout: 10000 })
  })
})
