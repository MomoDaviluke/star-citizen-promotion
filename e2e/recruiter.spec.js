/**
 * @file AI 招募官端到端测试
 * @description 覆盖「打开终端 → 会话初始化 → 对话 → 画像更新 → 快捷建议提交 → 申请表预填」完整链路
 *              后端 AI 端点以 page.route mock（与 apply.spec.js 同一无后端 E2E 方案）
 * @note 断言选择器基于真实 DOM 结构（preview 构建）
 */

import { test, expect } from '@playwright/test'

/** AI 招募官 mock 数据 */
const SESSION_BODY = JSON.stringify({ sessionId: 'e2e-session-1', welcome: '欢迎来到星际公民，我是 AI 指挥官' })
const SUGGEST_BODY = JSON.stringify({ suggestions: ['介绍一下舰队', '提交申请'] })
const CHAT_SSE_BODY = [
  'event: content',
  'data: {"content": "已记录你的偏好，稍后为你匹配舰队"}',
  '',
  'event: profile',
  'data: {"profile": {"playStyle":["pvp"],"timeCommit":"每晚 2 小时","shipPref":["Anvil Arrow"],"skillLevel":"veteran"},"turnCount":1}',
  '',
  'event: done',
  'data: {}',
  '',
].join('\n')

test.describe('AI 招募官完整链路', () => {
  test.beforeEach(async ({ page }) => {
    // 从源头禁用 Service Worker 注册：注册失败 → 不产生离线就绪 toast（右下角 fixed，
    // 会拦截招募官触发器的点击），且无需依赖 sw.js 的 URL 匹配
    await page.addInitScript(() => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = () => Promise.reject(new Error('SW disabled for E2E'))
      }
    })

    await page.route('**/api/v1/ai/recruiter/session', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: SESSION_BODY })
    )
    await page.route('**/api/v1/ai/recruiter/suggest*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: SUGGEST_BODY })
    )
    await page.route('**/api/v1/ai/recruiter/chat', (route) =>
      route.fulfill({ status: 200, contentType: 'text/event-stream', body: CHAT_SSE_BODY })
    )
    // 埋点兜底：无后端时静默 204，避免影响主流程
    await page.route('**/api/v1/analytics', (route) =>
      route.fulfill({ status: 204, body: '' })
    )
  })

  test('打开终端应初始化会话并渲染欢迎语', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('.recruiter-trigger').click()
    await expect(page.locator('.recruiter-terminal')).toBeVisible()

    // 会话初始化后展示 AI 欢迎语（首次 assistant 消息）
    await expect(page.locator('.chat-message--assistant').first()).toContainText('欢迎来到星际公民')

    // 快捷建议已加载
    await expect(page.locator('.suggestion-bubble', { hasText: '提交申请' })).toBeVisible()

    // 关闭终端后可再次打开
    await page.locator('button[aria-label="关闭终端"]').click()
    await expect(page.locator('.recruiter-terminal')).toBeHidden()
    await page.locator('.recruiter-trigger').click()
    await expect(page.locator('.recruiter-terminal')).toBeVisible()
  })

  test('完整对话后通过「提交申请」建议预填申请表', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // 打开终端
    await page.locator('.recruiter-trigger').click()
    await expect(page.locator('.recruiter-terminal')).toBeVisible()

    // 发送对话消息
    await page.locator('.chat-input').fill('我偏好 PVP 战斗')
    await page.locator('.send-btn').click()

    // 用户消息上屏
    await expect(page.locator('.chat-message--user').first()).toContainText('我偏好 PVP 战斗')

    // AI 流式回复上屏
    await expect(page.locator('.chat-message--assistant').last()).toContainText('已记录你的偏好')

    // 画像面板随 profile 事件更新（玩法偏好标签映射为中文）
    await expect(page.locator('.profile-panel')).toContainText('PVP 战斗')
    await expect(page.locator('.profile-panel')).toContainText('每晚 2 小时')

    // 点击「提交申请」快捷建议 → 跳转申请页并携带画像
    await page.locator('.suggestion-bubble', { hasText: '提交申请' }).click()
    await expect(page).toHaveURL(/\/join\?ai_profile=/)

    // 申请表出现 AI 画像预填 banner
    await expect(page.locator('.ai-prefill-banner')).toBeVisible()
    // experience 文本域已写入画像摘要
    const experience = page.locator('#join-experience')
    await expect(experience).toHaveValue(/\[AI 招募官画像\]/)
    await expect(experience).toHaveValue(/玩法偏好:PVP 战斗/)
    await expect(experience).toHaveValue(/技能等级:老手/)
    await expect(experience).toHaveValue(/拥有舰船:Anvil Arrow/)
  })

  test('普通快捷建议按对话消息发送，不跳转', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('.recruiter-trigger').click()
    await expect(page.locator('.recruiter-terminal')).toBeVisible()

    // 点击普通建议
    await page.locator('.suggestion-bubble', { hasText: '介绍一下舰队' }).click()

    // 作为用户消息进入对话流，且仍停留在首页（未跳转申请页）
    await expect(page.locator('.chat-message--user').first()).toContainText('介绍一下舰队')
    expect(page.url()).not.toContain('/join')
  })
})