/**
 * @file RUM 上报服务测试
 * @description 覆盖 sendRumBeacon 的 sendBeacon/fetch keepalive 降级逻辑与异常处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalNavigator = global.navigator
const originalFetch = global.fetch

describe('rumService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.navigator = originalNavigator
    global.fetch = originalFetch
  })

  it('存在 sendBeacon 时应优先使用 sendBeacon', async () => {
    const sendBeacon = vi.fn(() => true)
    global.navigator = { sendBeacon }
    global.fetch = vi.fn()

    const { sendRumBeacon } = await import('@/services/rumService.js')
    const payload = { metric: 'LCP', value: 1200 }

    await sendRumBeacon(payload)

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(sendBeacon).toHaveBeenCalledWith('/api/rum', expect.any(String))
    const body = sendBeacon.mock.calls[0][1]
    expect(JSON.parse(body)).toEqual(payload)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sendBeacon 返回 false 时应降级到 fetch keepalive', async () => {
    const sendBeacon = vi.fn(() => false)
    global.navigator = { sendBeacon }
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }))

    const { sendRumBeacon } = await import('@/services/rumService.js')
    const payload = { metric: 'CLS', value: 0.05 }

    await sendRumBeacon(payload)

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/rum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'include'
    })
  })

  it('无 sendBeacon 时应降级到 fetch keepalive', async () => {
    global.navigator = {}
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }))

    const { sendRumBeacon } = await import('@/services/rumService.js')
    await sendRumBeacon({ metric: 'FCP', value: 800 })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/rum', expect.objectContaining({
      method: 'POST',
      keepalive: true
    }))
  })

  it('fetch 失败时不应抛出异常', async () => {
    global.navigator = {}
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')))

    const { sendRumBeacon } = await import('@/services/rumService.js')

    await expect(sendRumBeacon({ metric: 'INP', value: 120 })).resolves.toBeUndefined()
  })

  it('非 2xx 响应时不应抛出异常', async () => {
    global.navigator = {}
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }))

    const { sendRumBeacon } = await import('@/services/rumService.js')

    await expect(sendRumBeacon({ metric: 'TTFB', value: 50 })).resolves.toBeUndefined()
  })
})
