/**
 * @file 管理后台端到端测试
 * @description 覆盖 admin 登录 → 成员管理 CRUD 往返（端到端验收 M0 成果）。
 *              API 通过 page.route mock（无后端运行时的标准 E2E 方案），
 *              成员数据用内存数组维护，使新增/编辑/删除会产生真实可见的状态变化。
 *              断言基于真实 DOM（FE-10），避免 TD-18 恒真断言。
 */

import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  id: 'u-admin',
  username: 'admin_e2e',
  email: 'admin_e2e@test.com',
  role: 'admin'
}

const MEMBER_USER = {
  id: 'u-member',
  username: 'member_e2e',
  email: 'member_e2e@test.com',
  role: 'member'
}

/** 内存成员库：每个测试独立初始化，保证 CRUD 状态变化可断言 */
const initialMembers = [
  { id: 'm1', name: '初始成员甲', role: '舰长', intro: '', avatar: '', status: 'active', created_at: '2026-01-01T00:00:00Z' },
  { id: 'm2', name: '初始成员乙', role: '领航员', intro: '', avatar: '', status: 'inactive', created_at: '2026-02-01T00:00:00Z' }
]

/**
 * mock 登录态接口，返回可变的当前用户
 * @description 后端 GET /api/v1/auth/me 返回 { success, data: user }（data 直接是用户对象），
 *              authStore.initializeAuth 取 response.data 赋给 user，故不能多套一层 user。
 * @param {import('@playwright/test').Page} page 页面实例
 * @returns {{ setUser: Function }} 设置当前登录用户（null 表示未登录）
 */
async function mockAuthState(page) {
  let currentUser = null

  await page.route('**/api/v1/auth/me', route => {
    if (!currentUser) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized' })
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: currentUser })
    })
  })

  return { setUser: (user) => { currentUser = user } }
}

/**
 * mock 成员 CRUD，使用内存数组维护状态
 * @param {import('@playwright/test').Page} page 页面实例
 * @param {Array} members 成员数组（会被就地修改）
 */
async function mockMembersApi(page, members) {
  let nextId = 100

  /**
   * 单一正则 handler 覆盖 /api/v1/members 与 /api/v1/members/:id
   * @description 不使用两条 glob 分别匹配列表与详情两种路径：两者存在匹配歧义，
   *              实测第二次 GET 会绕过 handler 直连后端返回 502。改用正则一次覆盖。
   */
  await page.route(/\/api\/v1\/members(\/[^/?]*)?(\?|$)/, route => {
    const method = route.request().method()
    const url = route.request().url()
    const id = url.split('/members/')[1]?.split('?')[0] || ''

    const json = (status, body) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (method === 'GET') {
      return json(200, {
        success: true,
        data: members,
        pagination: { total: members.length, limit: 50, offset: 0, hasMore: false }
      })
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON() || {}
      const created = {
        id: `m${nextId++}`,
        name: payload.name,
        role: payload.role,
        intro: payload.intro || '',
        avatar: payload.avatar || '',
        status: payload.status || 'active',
        created_at: new Date().toISOString()
      }
      members.push(created)
      return json(201, { success: true, message: '成员创建成功', data: created })
    }

    if (method === 'PUT') {
      const payload = route.request().postDataJSON() || {}
      const target = members.find(m => m.id === id)
      if (!target) return json(404, { success: false, message: '成员不存在' })
      Object.assign(target, payload)
      return json(200, { success: true, message: '成员信息更新成功', data: target })
    }

    if (method === 'DELETE') {
      const index = members.findIndex(m => m.id === id)
      if (index !== -1) members.splice(index, 1)
      return json(200, { success: true, message: '成员删除成功' })
    }

    return route.continue()
  })
}

/**
 * 以 admin 身份进入成员管理页
 * @description 默认直接 mock 登录态（/auth/me 返回 admin）后进入；
 *              viaLogin=true 时走完整登录表单流程，用于验证登录→管理后台链路。
 */
async function enterMembersAdmin(page, { viaLogin = false } = {}) {
  const auth = await mockAuthState(page)
  const user = ADMIN_USER

  if (viaLogin) {
    // 起始未登录；登录成功后置为 admin，保证后续整页刷新仍能恢复登录态
    await page.route('**/api/v1/auth/login', route => {
      auth.setUser(user)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { user } })
      })
    })

    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', 'AdminTest123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 })
  } else {
    auth.setUser(user)
  }

  return auth
}

test.describe('管理后台访问守卫', () => {
  test('非管理员访问管理后台应被重定向到首页', async ({ page }) => {
    const auth = await mockAuthState(page)
    auth.setUser(MEMBER_USER)

    await page.goto('/admin/members')
    await page.waitForLoadState('domcontentloaded')

    // 守卫：requiresAdmin 且非 admin → 重定向到 '/'
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 })
    expect(page.url()).not.toContain('/admin')
  })

  test('管理员登录后应能进入成员管理页', async ({ page }) => {
    const members = [...initialMembers]
    await mockMembersApi(page, members)
    await enterMembersAdmin(page, { viaLogin: true })

    await page.goto('/admin/members')
    await page.waitForLoadState('domcontentloaded')

    // 真实渲染：管理布局 + 成员表格
    await expect(page.locator('.admin-layout')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10000 })

    expect(page.url()).toContain('/admin/members')
  })
})

test.describe('成员管理 CRUD', () => {
  test('应能通过弹窗新增成员并出现在列表中', async ({ page }) => {
    const members = initialMembers.map(m => ({ ...m }))
    await mockMembersApi(page, members)
    await enterMembersAdmin(page)

    await page.goto('/admin/members')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10000 })

    const beforeCount = await page.locator('.data-table tbody tr').count()

    // 打开新增弹窗（M0 修复后的按钮，原为指向不存在路由的死链）
    await page.click('.toolbar .btn-primary')
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.modal-header h3')).toContainText('添加成员')

    // 填写并提交
    await page.fill('.modal-overlay input[name="name"]', '新增测试成员')
    await page.fill('.modal-overlay input[name="role"]', '工程师')
    await page.click('.modal-overlay button[type="submit"]')

    // 弹窗关闭且列表出现新成员
    await expect(page.locator('.modal-overlay')).toBeHidden({ timeout: 10000 })
    await expect(page.locator('.member-name', { hasText: '新增测试成员' })).toBeVisible({ timeout: 10000 })
    expect(await page.locator('.data-table tbody tr').count()).toBe(beforeCount + 1)
    expect(members.some(m => m.name === '新增测试成员')).toBe(true)
  })

  test('应能编辑成员并看到列表中的名称更新', async ({ page }) => {
    const members = initialMembers.map(m => ({ ...m }))
    await mockMembersApi(page, members)
    await enterMembersAdmin(page)

    await page.goto('/admin/members')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10000 })

    // 点击第一行的「编辑」
    await page.locator('.data-table tbody tr').first().locator('button:has-text("编辑")').click()

    // 弹窗应打开并回填（M0 修复前点击无反应）
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.modal-header h3')).toContainText('编辑成员')
    const nameInput = page.locator('.modal-overlay input[name="name"]')
    expect((await nameInput.inputValue()).trim()).toBe('初始成员甲')

    // 修改名称并保存
    await nameInput.fill('已编辑成员')
    await page.click('.modal-overlay button[type="submit"]')

    await expect(page.locator('.modal-overlay')).toBeHidden({ timeout: 10000 })
    await expect(page.locator('.member-name', { hasText: '已编辑成员' })).toBeVisible({ timeout: 10000 })
    expect(members.find(m => m.id === 'm1')?.name).toBe('已编辑成员')
  })

  test('应能删除成员并从列表中移除', async ({ page }) => {
    const members = initialMembers.map(m => ({ ...m }))
    await mockMembersApi(page, members)
    await enterMembersAdmin(page)

    // deleteMember 使用原生 confirm，需接受对话框
    page.on('dialog', dialog => dialog.accept())

    await page.goto('/admin/members')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10000 })

    const beforeCount = await page.locator('.data-table tbody tr').count()

    await page.locator('.data-table tbody tr').first().locator('button:has-text("删除")').click()

    // 列表中不再包含被删除的成员
    await expect(page.locator('.member-name', { hasText: '初始成员甲' })).toHaveCount(0, { timeout: 10000 })
    expect(await page.locator('.data-table tbody tr').count()).toBe(beforeCount - 1)
    expect(members.some(m => m.id === 'm1')).toBe(false)
  })
})
