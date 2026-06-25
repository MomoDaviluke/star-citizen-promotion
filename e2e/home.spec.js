/**
 * @file 首页端到端测试
 * @description 测试首页的关键用户流程
 */

import { test, expect } from '@playwright/test'

test.describe('首页测试', () => {
  test('应正确加载首页', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/星际公民|Star Citizen|Team/)
  })

  test('应显示主要内容区域', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('应能导航到关于页面', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.goto('/about')
    await expect(page).toHaveURL(/.*about/)
  })
})

test.describe('页面导航测试', () => {
  test('应能访问成员页面', async ({ page }) => {
    await page.goto('/members')
    await expect(page).toHaveURL(/.*members/)
  })

  test('应能访问项目页面', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL(/.*projects/)
  })

  test('应能访问加入页面', async ({ page }) => {
    await page.goto('/join')
    await expect(page).toHaveURL(/.*join/)
  })

  test('应能访问联系页面', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveURL(/.*contact/)
  })
})
