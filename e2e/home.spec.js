/**
 * @file 首页端到端测试
 * @description 测试首页的关键用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test.use({ baseURL: 'http://localhost:4173' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应正确显示页面标题', async ({ page }) => {
    await expect(page).toHaveTitle(/星际公民|Star Citizen/)
  })

  test('应显示导航菜单', async ({ page }) => {
    const nav = page.locator('nav, .nav, header').first()
    await expect(nav).toBeVisible({ timeout: 10000 })
  })

  test('应显示页脚', async ({ page }) => {
    const footer = page.locator('footer, .footer')
    await expect(footer).toBeVisible({ timeout: 10000 })
  })

  test('导航链接应可点击', async ({ page }) => {
    const aboutLink = page.locator('a[href="/about"]')
    if (await aboutLink.count() > 0) {
      await aboutLink.click()
      await expect(page).toHaveURL(/.*about/, { timeout: 10000 })
    }
  })
})

test.describe('导航功能', () => {
  test.use({ baseURL: 'http://localhost:4173' })

  test('应能通过导航访问各页面', async ({ page }) => {
    const routes = ['/about', '/members', '/projects', '/join', '/contact']

    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`.*${route}`), { timeout: 10000 })
    }
  })

  test('404 页面应正确显示', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')
    await expect(page.locator('body')).toContainText(/404|未找到|Not Found/i, { timeout: 10000 })
  })
})
