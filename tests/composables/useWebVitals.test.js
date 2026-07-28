/**
 * @file Web Vitals 监控组合式函数测试
 * @description 覆盖 useWebVitals 的指标采集、缓冲、上报触发逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCallbacks = {}

import { onLCP, onCLS, onINP, onFCP, onTTFB } from 'web-vitals'

vi.mock('web-vitals', () => ({
  onLCP: vi.fn((cb) => { mockCallbacks.onLCP = cb }),
  onCLS: vi.fn((cb) => { mockCallbacks.onCLS = cb }),
  onINP: vi.fn((cb) => { mockCallbacks.onINP = cb }),
  onFCP: vi.fn((cb) => { mockCallbacks.onFCP = cb }),
  onTTFB: vi.fn((cb) => { mockCallbacks.onTTFB = cb })
}))

vi.mock('@/services/rumService.js', () => ({
  sendRumBeacon: vi.fn()
}))

import { useWebVitals } from '@/composables/useWebVitals.js'
import { sendRumBeacon } from '@/services/rumService.js'

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockCallbacks).forEach((key) => delete mockCallbacks[key])
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应注册所有 Web Vitals 回调', () => {
    const { start } = useWebVitals()
    start()

    expect(onLCP).toHaveBeenCalled()
    expect(onCLS).toHaveBeenCalled()
    expect(onINP).toHaveBeenCalled()
    expect(onFCP).toHaveBeenCalled()
    expect(onTTFB).toHaveBeenCalled()
  })

  it('收到 LCP 指标后应缓冲并附带页面元数据', () => {
    const { start } = useWebVitals()
    start()

    const metric = {
      name: 'LCP',
      value: 1200,
      rating: 'good',
      entries: [],
      navigationType: 'navigate'
    }

    mockCallbacks.onLCP(metric)

    vi.advanceTimersByTime(6000)

    expect(sendRumBeacon).toHaveBeenCalledTimes(1)
    const payload = sendRumBeacon.mock.calls[0][0]
    expect(payload.metric).toBe('LCP')
    expect(payload.value).toBe(1200)
    expect(payload.rating).toBe('good')
    expect(payload.url).toBeDefined()
    expect(payload.userAgent).toBeDefined()
  })

  it('多次指标应合并为批量上报', () => {
    const { start } = useWebVitals()
    start()

    mockCallbacks.onFCP({ name: 'FCP', value: 900, rating: 'good', entries: [] })
    mockCallbacks.onLCP({ name: 'LCP', value: 1300, rating: 'good', entries: [] })

    vi.advanceTimersByTime(6000)

    expect(sendRumBeacon).toHaveBeenCalledTimes(1)
    const payload = sendRumBeacon.mock.calls[0][0]
    expect(Array.isArray(payload)).toBe(true)
    expect(payload).toHaveLength(2)
    expect(payload[0].metric).toBe('FCP')
    expect(payload[1].metric).toBe('LCP')
  })

  it('在禁用状态下不应注册回调', () => {
    const { start } = useWebVitals({ enabled: false })
    start()

    expect(onLCP).not.toHaveBeenCalled()
    expect(sendRumBeacon).not.toHaveBeenCalled()
  })

  it('采样率为 0 时不应注册回调', () => {
    const { start } = useWebVitals({ sampleRate: 0 })
    start()

    expect(onLCP).not.toHaveBeenCalled()
  })

  it('应支持手动 flush 缓冲数据', () => {
    const { start, flush } = useWebVitals()
    start()

    mockCallbacks.onTTFB({ name: 'TTFB', value: 100, rating: 'good', entries: [] })

    flush()

    expect(sendRumBeacon).toHaveBeenCalledTimes(1)
  })

  it('flush 空缓冲时不应调用上报', () => {
    const { start, flush } = useWebVitals()
    start()

    flush()

    expect(sendRumBeacon).not.toHaveBeenCalled()
  })
})
