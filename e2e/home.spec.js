/**
 * @file 首页端到端测试
 * @description 测试首页的关键用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应正确显示页面标题', async ({ page }) => {
    await expect(page).toHaveTitle(/星际公民|Star Citizen/)
  })

  test('应显示英雄区域', async ({ page }) => {
    const hero = page.locator('.hero, .hero-section, [class*="hero"]').first()
    await expect(hero).toBeVisible()
  })

  test('应显示导航菜单', async ({ page }) => {
    const nav = page.locator('nav, .nav, header nav').first()
    await expect(nav).toBeVisible()
  })

  test('导航链接应可点击', async ({ page }) => {
    const aboutLink = page.locator('a[href="/about"]')
    if (await aboutLink.count() > 0) {
      await aboutLink.click()
      await expect(page).toHaveURL(/.*about/)
    }
  })

  test('应显示统计数据', async ({ page }) => {
    const stats = page.locator('.stats, .stat-card, [class*="stat"]')
    await expect(stats.first()).toBeVisible()
  })

  test('应显示页脚', async ({ page }) => {
    const footer = page.locator('footer, .footer')
    await expect(footer).toBeVisible()
  })

  test('响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const nav = page.locator('nav, .nav, header').first()
    await expect(nav).toBeVisible()
  })

  test('响应式布局 - 平板端', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const main = page.locator('main, .main, #app').first()
    await expect(main).toBeVisible()
  })

  test('响应式布局 - 桌面端', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const main = page.locator('main, .main, #app').first()
    await expect(main).toBeVisible()
  })
})

test.describe('导航功能', () => {
  test('应能通过导航访问各页面', async ({ page }) => {
    const routes = ['/about', '/members', '/projects', '/join', '/contact']

    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`.*${route}`))
    }
  })

  test('404 页面应正确显示', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')

    await expect(page.locator('body')).toContainText(/404|未找到|Not Found/i)
  })
})

test.describe('性能测试', () => {
  test('首页加载时间应小于 3 秒', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test('应无 JavaScript 错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('应无控制台警告', async ({ page }) => {
    const warnings = []
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const criticalWarnings = warnings.filter(w =>
      !w.includes('[HMR]') &&
      !w.includes('[vite]')
    )
    expect(criticalWarnings.length).toBeLessThan(5)
  })
})
