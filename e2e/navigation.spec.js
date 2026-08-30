/**
 * @file 页面导航与响应式端到端测试
 * @description 覆盖所有公开页面的加载和移动端视口适配
 */

import { test, expect } from '@playwright/test'

const PUBLIC_PAGES = [
  { path: '/', name: '首页' },
  { path: '/about', name: '关于' },
  { path: '/members', name: '成员' },
  { path: '/projects', name: '项目' },
  { path: '/fleet', name: '舰队' },
  { path: '/events', name: '活动' },
  { path: '/calendar', name: '日历' },
  { path: '/contact', name: '联系' },
]

test.describe('公开页面加载', () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name}页面 (${path}) 应正常加载`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.ok()).toBeTruthy()

      await page.waitForLoadState('domcontentloaded')

      // 页面应有内容
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.length).toBeGreaterThan(10)
    })

    test(`${name}页面 (${path}) 应无控制台错误`, async ({ page }) => {
      const errors = []
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })

      await page.goto(path)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)

      // 忽略已知的第三方脚本错误
      const realErrors = errors.filter(e => !e.includes('Third-party') && !e.includes('chrome-extension'))
      expect(realErrors).toHaveLength(0)
    })
  }
})

test.describe('导航功能', () => {
  test('应能通过导航链接在页面间切换', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // 找到导航链接
    const navLinks = page.locator('.site-header nav a, .site-header header a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)

    // 点击第一个非首页导航链接
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href')
      if (href && href !== '/' && href.startsWith('/') && !href.startsWith('//')) {
        await navLinks.nth(i).click()
        // 真实等待导航完成（替代脆弱的 waitForTimeout）
        await page.waitForURL(url => url.pathname === href, { timeout: 10000 })
        // 目标页应渲染真实内容
        await page.waitForLoadState('domcontentloaded')
        expect(page.url()).toContain(href)
        break
      }
    }
  })
})

test.describe('响应式布局', () => {
  // TD-18 修复：body 可见为恒真断言，改为无横向溢出 + 主内容渲染的真实断言
  test('移动端视口 (375px) 应正常显示首页且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // 主内容真实渲染
    await expect(page.locator('.hero-section h1')).toBeVisible()

    const overflowed = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflowed).toBe(false)
  })

  test('平板视口 (768px) 应正常显示首页且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.hero-section h1')).toBeVisible()

    const overflowed = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflowed).toBe(false)
  })

  test('桌面视口 (1440px) 应正常显示首页且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.hero-section h1')).toBeVisible()

    const overflowed = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflowed).toBe(false)
  })
})

test.describe('404 处理', () => {
  test('不存在的页面应显示 404', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345')
    await page.waitForLoadState('domcontentloaded')

    // 检查是否有 404 相关内容
    const bodyText = await page.locator('body').innerText().catch(() => '')
    const hasNotFound = bodyText.includes('404') ||
      bodyText.includes('未找到') ||
      bodyText.includes('不存在') ||
      bodyText.includes('not found')
    expect(hasNotFound).toBe(true)
  })
})

