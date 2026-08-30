/**
 * @file analyticsService 测试
 * @description 验证转化埋点上报：开关控制、sendBeacon 优先、fetch 降级、静默失败。
 *              开关控制通过直接切换 siteConfig.features.enableAnalytics 实现——
 *              服务在每次调用时读取该属性，与测试文件共享同一模块实例，
 *              避免 vi.doMock/resetModules 在共享 worker 上下文中的实例分裂
 *              问题（FE-08 测试隔离缺陷）。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import siteConfig from '@/config/site.config.js'
import { trackEvent, trackEvents } from '@/services/analyticsService.js'

// 保存原始全局对象，测试结束后恢复，防止污染同 worker 中的其他测试文件
const originalNavigator = globalThis.navigator
const originalFetch = globalThis.fetch

describe('analyticsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    siteConfig.features.enableAnalytics = true
  })

  afterEach(() => {
    globalThis.navigator = originalNavigator
    globalThis.fetch = originalFetch
    siteConfig.features.enableAnalytics = true
  })

  it('开关关闭时不应发送任何事件', async () => {
    siteConfig.features.enableAnalytics = false
    const sendBeacon = vi.fn(() => true)
    const fetchMock = vi.fn()
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await trackEvent('page_view', { path: '/' })

    expect(sendBeacon).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('应优先使用 sendBeacon 上报事件', async () => {
    const sendBeacon = vi.fn(() => true)
    const fetchMock = vi.fn()
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await trackEvent('page_view', { path: '/join' })

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    // 实现用 Blob 显式声明 application/json：sendBeacon 直传字符串时
    // Content-Type 为 text/plain，后端 express.json() 不解析会导致 body 为空（400）
    expect(sendBeacon).toHaveBeenCalledWith('/api/v1/analytics', expect.any(Blob))
    const blob = sendBeacon.mock.calls[0][1]
    expect(blob.type).toBe('application/json')
    // 解析 payload 校验事件名与属性
    const payload = JSON.parse(await blob.text())
    expect(payload.event).toBe('page_view')
    expect(payload.properties.path).toBe('/join')
    expect(payload.ts).toEqual(expect.any(Number))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sendBeacon 返回 false 时应降级到 fetch keepalive', async () => {
    const sendBeacon = vi.fn(() => false)
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await trackEvent('application_submit_success', { experience: '3年' })

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
      keepalive: true,
      credentials: 'include'
    })
  })

  it('无 sendBeacon 时应降级到 fetch keepalive', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))
    globalThis.navigator = {}
    globalThis.fetch = fetchMock

    await trackEvent('recruiter_chat_turn', { turn: 2 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/analytics', expect.objectContaining({
      method: 'POST',
      keepalive: true
    }))
  })

  it('上报失败时不应抛出异常（静默失败）', async () => {
    const sendBeacon = vi.fn(() => false)
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 500 }))
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await expect(trackEvent('page_view', { path: '/' })).resolves.toBeUndefined()
  })

  it('批量上报应打包为数组一次发送', async () => {
    const sendBeacon = vi.fn(() => true)
    const fetchMock = vi.fn()
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await trackEvents([
      { event: 'page_view', properties: { path: '/' } },
      { event: 'external_link_click', properties: { channel: 'Discord' } }
    ])

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const blob = sendBeacon.mock.calls[0][1]
    expect(blob.type).toBe('application/json')
    const payload = JSON.parse(await blob.text())
    expect(Array.isArray(payload)).toBe(true)
    expect(payload).toHaveLength(2)
    expect(payload[0].event).toBe('page_view')
    expect(payload[1].event).toBe('external_link_click')
  })

  it('批量上报空数组时不应发送', async () => {
    const sendBeacon = vi.fn(() => true)
    const fetchMock = vi.fn()
    globalThis.navigator = { sendBeacon }
    globalThis.fetch = fetchMock

    await trackEvents([])

    expect(sendBeacon).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
