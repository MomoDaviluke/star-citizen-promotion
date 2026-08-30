/**
 * @file 首页端到端测试
 * @description 验证首页核心业务内容的真实渲染（TD-18 修复：以内容断言替代恒真断言）
 *              断言选择器基于实际 DOM 结构（preview 构建 + fallback 数据）
 */

import { test, expect } from '@playwright/test'

test.describe('首页内容渲染', () => {
  test('Hero 区域应渲染站点主标题、徽章与行动按钮', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // 主标题（实测 DOM：h1 = STELLAR NEXUS）
    const heading = page.locator('.hero-section h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/STELLAR/i)

    // Hero 徽章
    await expect(page.locator('.hero-section').first()).toContainText(/RECRUITING NOW/i)

    // 核心行动按钮：开始申请 + 探索舰队
    await expect(page.locator('.hero-section button:has-text("START APPLICATION")').first()).toBeVisible()
    await expect(page.locator('.hero-section button:has-text("EXPLORE FLEET")').first()).toBeVisible()
  })

  test('核心数据区域应渲染四项站点统计', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // key-numbers section（实测存在，含 4 项统计）
    const keyNumbers = page.locator('.key-numbers')
    await expect(keyNumbers).toBeVisible()

    // 四项核心统计标签真实渲染（fallback 数据）
    await expect(keyNumbers).toContainText('ACTIVE PILOTS')
    await expect(keyNumbers).toContainText('MISSIONS')
    await expect(keyNumbers).toContainText('MEMBERS')
    await expect(keyNumbers).toContainText('PROJECTS')
  })

  test('舰队预览应渲染舰船卡片与展厅链接', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const fleetPreview = page.locator('.fleet-preview')
    await expect(fleetPreview).toBeVisible()

    // 滚动到舰队区域触发 scroll-reveal 揭示动画
    await fleetPreview.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)

    // 舰船数据异步加载（API 失败回退静态数据），显式等待首张卡片渲染
    // ShipCard 根元素为 div.ship-card[role=button]，非 button 标签
    const firstCard = fleetPreview.locator('.ship-card').first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })

    // 舰船卡片（实测 3 张：Arrow/400i/Avenger）
    const shipCards = fleetPreview.locator('.ship-card')
    expect(await shipCards.count()).toBeGreaterThanOrEqual(3)

    // 卡片内含制造商与分类徽章（真实内容校验）
    await expect(fleetPreview).toContainText('Anvil Aerospace')
    await expect(fleetPreview).toContainText('COMBAT')

    // 进入舰队展厅的链接指向 /fleet
    const fleetLink = fleetPreview.locator('a[href="/fleet"]')
    expect(await fleetLink.count()).toBeGreaterThanOrEqual(1)
  })

  test('站点导航应包含主要页面入口', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // site-header 内导航链接（实测 6 项）
    const navLinks = page.locator('.site-header nav a')
    expect(await navLinks.count()).toBeGreaterThanOrEqual(5)

    // 关键导航目标存在
    const hrefs = await navLinks.evaluateAll(els => els.map(el => el.getAttribute('href')))
    for (const target of ['/about', '/members', '/join']) {
      expect(hrefs).toContain(target)
    }
  })

  test('站点页脚应渲染品牌与导航', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const footer = page.locator('.site-footer')
    await expect(footer).toBeVisible()

    // 页脚品牌与导航区块（实测 DOM）
    await expect(footer).toContainText(/STELLAR/i)
    await expect(footer).toContainText('NAVIGATION')
    const footerLinks = footer.locator('nav a')
    expect(await footerLinks.count()).toBeGreaterThanOrEqual(4)
  })
})

test.describe('首页布局完整性', () => {
  test('桌面视口不应出现横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.hero-section h1')).toBeVisible()

    const overflowed = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflowed).toBe(false)
  })

  test('移动端视口不应出现横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.hero-section h1')).toBeVisible()

    const overflowed = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflowed).toBe(false)
  })

  test('Hero 主图应成功加载', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.hero-section h1')).toBeVisible()

    // Hero 背景船图应加载完成（无 broken image），等待图片网络加载
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('.hero-section img')]
      return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0)
    }, null, { timeout: 15000 })
  })
})
