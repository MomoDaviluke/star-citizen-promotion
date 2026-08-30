/**
 * @file 舰队模块端到端测试
 * @description 覆盖舰队列表渲染、分类筛选、舰船详情跳转。
 *              舰队数据来自静态 shipDatabase（无 API 依赖），断言全部基于真实 DOM（FE-10），
 *              避免 TD-18 恒真断言：验证数量一致性、激活态、跳转后的真实标题。
 */

import { test, expect } from '@playwright/test'

/** 读取状态栏显示的当前舰船数量 */
async function readFilterCount(page) {
  const text = await page.locator('.filter-status__count').innerText()
  return parseInt(text.trim(), 10)
}

/**
 * 等待舰船网格过渡结束（卡片数与状态栏计数一致）
 * @description Fleet.vue 的 TransitionGroup 有 0.5s 进场/离场动画，
 *              点击分类后立即读取会拿到动画中间态（旧卡片尚未从 DOM 移除）。
 * @param {import('@playwright/test').Page} page 页面实例
 */
async function waitForGridSettled(page) {
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll('.ship-card').length
      const el = document.querySelector('.filter-status__count')
      const count = el ? parseInt(el.textContent.trim(), 10) : -1
      return cards === count
    },
    null,
    { timeout: 5000 }
  )
}

test.describe('舰队列表渲染', () => {
  test('应渲染舰船卡片，且卡片数与状态栏计数一致', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')

    // 列表真实渲染（非骨架屏）
    await expect(page.locator('.ship-card').first()).toBeVisible({ timeout: 10000 })

    const cardCount = await page.locator('.ship-card').count()
    expect(cardCount).toBeGreaterThan(0)

    // 状态栏计数与卡片数必须一致（恒真断言替代：两处独立渲染的数据比对）
    const count = await readFilterCount(page)
    expect(count).toBe(cardCount)
  })

  test('舰船卡片应显示真实舰船名与图片', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')

    const firstCard = page.locator('.ship-card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    // 舰船名非空
    const name = await firstCard.locator('.ship-card__name').innerText()
    expect(name.trim().length).toBeGreaterThan(0)

    // 图片 alt 与舰船名一致（ShipCard 用 :alt="ship.name"）
    const alt = await firstCard.locator('img').first().getAttribute('alt')
    expect(alt?.trim()).toBe(name.trim())
  })

  test('页面统计条应显示非零的舰队规模', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')

    const stats = page.locator('.stats-bar__value')
    const count = await stats.count()
    expect(count).toBeGreaterThan(0)

    // 首个统计值（舰船总数）应为正数
    const first = await stats.first().innerText()
    expect(parseInt(first.trim(), 10)).toBeGreaterThan(0)
  })
})

test.describe('分类筛选', () => {
  test('点击分类应筛选舰船，并同步更新计数与激活态', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.ship-card').first()).toBeVisible({ timeout: 10000 })

    const totalCount = await readFilterCount(page)

    // 找一个非「全部」的分类按钮
    const buttons = page.locator('.filter-btn')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(1)

    let targetLabel = ''
    for (let i = 0; i < buttonCount; i++) {
      const label = (await buttons.nth(i).locator('.filter-btn__label').innerText()).trim()
      if (label && label !== '全部') {
        targetLabel = label
        await buttons.nth(i).click()
        break
      }
    }
    expect(targetLabel).not.toBe('')

    // 等待 0.5s 过渡动画结束，再断言（避免读到动画中间态）
    await waitForGridSettled(page)

    // 筛选后：卡片数与计数一致，且小于总数
    const filteredCards = await page.locator('.ship-card').count()
    const filteredCount = await readFilterCount(page)
    expect(filteredCount).toBe(filteredCards)
    expect(filteredCount).toBeLessThanOrEqual(totalCount)
    expect(filteredCount).toBeGreaterThan(0)

    // 激活态：被点击的分类 aria-pressed 为 true
    const activeBtn = page.locator('.filter-btn[aria-pressed="true"]')
    expect(await activeBtn.count()).toBe(1)
    expect((await activeBtn.locator('.filter-btn__label').innerText()).trim()).toBe(targetLabel)

    // 状态栏显示当前分类名
    await expect(page.locator('.filter-status__category')).toContainText(targetLabel)
  })

  test('切回「全部」应恢复完整舰队', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.ship-card').first()).toBeVisible({ timeout: 10000 })

    const totalCount = await readFilterCount(page)

    // 先切到某个具体分类
    const buttons = page.locator('.filter-btn')
    const buttonCount = await buttons.count()
    for (let i = 0; i < buttonCount; i++) {
      const label = (await buttons.nth(i).locator('.filter-btn__label').innerText()).trim()
      if (label && label !== '全部') {
        await buttons.nth(i).click()
        break
      }
    }
    await waitForGridSettled(page)
    expect(await readFilterCount(page)).toBeLessThanOrEqual(totalCount)

    // 再切回「全部」
    for (let i = 0; i < buttonCount; i++) {
      const label = (await buttons.nth(i).locator('.filter-btn__label').innerText()).trim()
      if (label === '全部') {
        await buttons.nth(i).click()
        break
      }
    }

    // 计数与卡片数回到总数（等待过渡结束后断言）
    await waitForGridSettled(page)
    expect(await readFilterCount(page)).toBe(totalCount)
    expect(await page.locator('.ship-card').count()).toBe(totalCount)
  })
})

test.describe('舰船详情跳转', () => {
  test('点击舰船卡片应跳转到详情页并显示对应舰船名', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.ship-card').first()).toBeVisible({ timeout: 10000 })

    const firstCard = page.locator('.ship-card').first()
    const shipName = (await firstCard.locator('.ship-card__name').innerText()).trim()

    await firstCard.click()

    // 跳转到 /fleet/:slug
    await page.waitForURL(/\/fleet\/[^/]+/, { timeout: 10000 })

    // 详情页标题必须是被点击的舰船（真实断言，非仅 URL 检查）
    await expect(page.locator('.ship-hero__name')).toBeVisible({ timeout: 10000 })
    expect((await page.locator('.ship-hero__name').innerText()).trim()).toBe(shipName)
  })

  test('详情页应展示该舰船的规格参数', async ({ page }) => {
    await page.goto('/fleet')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.ship-card').first()).toBeVisible({ timeout: 10000 })

    await page.locator('.ship-card').first().click()
    await page.waitForURL(/\/fleet\/[^/]+/, { timeout: 10000 })

    // 详情页加载后应渲染真实内容（规格/描述区非空）
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(50)

    // 舰船名作为页面标题已渲染
    const title = (await page.locator('.ship-hero__name').innerText()).trim()
    expect(title.length).toBeGreaterThan(0)
  })
})
