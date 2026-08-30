/**
 * @file 监控服务测试
 * @description 覆盖指标/告警读取、告警认领，以及问题回报的 sendBeacon 协议与降级逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalNavigator = global.navigator
const originalFetch = global.fetch

const httpClientMock = {
  get: vi.fn(),
  post: vi.fn()
}

vi.mock('@/services/http.js', () => ({
  default: httpClientMock
}))

describe('monitorService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.navigator = originalNavigator
    global.fetch = originalFetch
  })

  it('getMetrics 请求监控指标端点', async () => {
    httpClientMock.get.mockResolvedValue({ data: { latest: { cpuPercent: 12 } } })
    const { getMetrics } = await import('@/services/monitorService.js')

    const data = await getMetrics()

    expect(httpClientMock.get).toHaveBeenCalledWith('/monitor/metrics', { params: {} })
    expect(data.latest.cpuPercent).toBe(12)
  })

  it('getMetrics 支持 points 降采样参数', async () => {
    httpClientMock.get.mockResolvedValue({ data: { history: [] } })
    const { getMetrics } = await import('@/services/monitorService.js')

    await getMetrics({ points: 60 })

    expect(httpClientMock.get).toHaveBeenCalledWith('/monitor/metrics', { params: { points: 60 } })
  })

  it('getAlerts 按状态拼接查询串', async () => {
    httpClientMock.get.mockResolvedValue({ data: [] })
    const { getAlerts } = await import('@/services/monitorService.js')

    await getAlerts({ status: 'active', severity: 'critical', limit: 20 })

    expect(httpClientMock.get).toHaveBeenCalledWith('/monitor/alerts', {
      params: { status: 'active', severity: 'critical', limit: 20 }
    })
  })

  it('getAlerts 无参数时不附加查询串', async () => {
    httpClientMock.get.mockResolvedValue({ data: [] })
    const { getAlerts } = await import('@/services/monitorService.js')

    await getAlerts()

    expect(httpClientMock.get).toHaveBeenCalledWith('/monitor/alerts', { params: {} })
  })

  it('ackAlert 提交认领请求', async () => {
    httpClientMock.post.mockResolvedValue({ data: { status: 'acked' } })
    const { ackAlert } = await import('@/services/monitorService.js')

    const result = await ackAlert('alert-1')

    expect(httpClientMock.post).toHaveBeenCalledWith('/monitor/alerts/alert-1/ack')
    expect(result.status).toBe('acked')
  })

  it('getReports 按 requestId 查询回报', async () => {
    httpClientMock.get.mockResolvedValue({ data: [] })
    const { getReports } = await import('@/services/monitorService.js')

    await getReports({ requestId: 'req-9' })

    expect(httpClientMock.get).toHaveBeenCalledWith('/monitor/reports', {
      params: { requestId: 'req-9' }
    })
  })

  describe('reportIssue', () => {
    it('使用 Blob 包装 sendBeacon，避免 text/plain 导致后端无法解析', async () => {
      const sendBeacon = vi.fn(() => true)
      global.navigator = { sendBeacon, userAgent: 'Chrome/120', language: 'zh-CN' }
      global.fetch = vi.fn()

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ category: 'frontend_error', message: '页面白屏' })

      expect(sendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = sendBeacon.mock.calls[0]
      expect(url).toBe('/monitor/reports')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/json')

      const parsed = JSON.parse(await blob.text())
      expect(parsed.category).toBe('frontend_error')
      expect(parsed.message).toBe('页面白屏')
    })

    it('回报自动附带浏览器环境信息', async () => {
      const sendBeacon = vi.fn(() => true)
      global.navigator = { sendBeacon, userAgent: 'Chrome/120', language: 'zh-CN' }
      global.fetch = vi.fn()

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ message: 'x' })

      const blob = sendBeacon.mock.calls[0][1]
      const parsed = JSON.parse(await blob.text())
      expect(parsed.browser.userAgent).toBe('Chrome/120')
      expect(parsed.browser.language).toBe('zh-CN')
      expect(parsed.browser.url).toBeDefined()
    })

    it('传入的 requestId 一并上报，用于与后端告警串联', async () => {
      const sendBeacon = vi.fn(() => true)
      global.navigator = { sendBeacon, userAgent: 'Chrome' }
      global.fetch = vi.fn()

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ message: 'x', requestId: 'req-abc' })

      const parsed = JSON.parse(await sendBeacon.mock.calls[0][1].text())
      expect(parsed.requestId).toBe('req-abc')
    })

    it('sendBeacon 返回 false 时降级为 fetch', async () => {
      const sendBeacon = vi.fn(() => false)
      global.navigator = { sendBeacon, userAgent: 'Chrome' }
      global.fetch = vi.fn(() => Promise.resolve({ ok: true }))

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ message: 'x' })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = global.fetch.mock.calls[0]
      expect(url).toBe('/monitor/reports')
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.credentials).toBe('include')
    })

    it('无 sendBeacon 时降级为 fetch', async () => {
      global.navigator = { userAgent: 'Chrome' }
      global.fetch = vi.fn(() => Promise.resolve({ ok: true }))

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ message: 'x' })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('网络异常时静默失败不抛出', async () => {
      global.navigator = { userAgent: 'Chrome' }
      global.fetch = vi.fn(() => Promise.reject(new Error('network down')))

      const { reportIssue } = await import('@/services/monitorService.js')
      await expect(reportIssue({ message: 'x' })).resolves.toBeUndefined()
    })

    it('非 2xx 响应时静默失败不抛出', async () => {
      global.navigator = { userAgent: 'Chrome' }
      global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 429 }))

      const { reportIssue } = await import('@/services/monitorService.js')
      await expect(reportIssue({ message: 'x' })).resolves.toBeUndefined()
    })

    it('缺少 message 与 payload 时不发起请求', async () => {
      const sendBeacon = vi.fn(() => true)
      global.navigator = { sendBeacon, userAgent: 'Chrome' }
      global.fetch = vi.fn()

      const { reportIssue } = await import('@/services/monitorService.js')
      await reportIssue({ category: 'manual' })

      expect(sendBeacon).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
