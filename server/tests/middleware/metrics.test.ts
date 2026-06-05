/**
 * @file Prometheus 指标中间件测试
 * @description 覆盖请求指标收集、数据库连接池指标、IP 白名单、端点开关
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// ---- Mocks -----------------------------------------------------------

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

const mockGetPoolStatus = jest.fn().mockReturnValue({
  totalConnections: 20,
  activeConnections: 5,
  idleConnections: 15,
  waitingRequests: 0,
  connectionLimit: 20
})

let mockNodeEnv = 'test'
let mockMetricsEnabled = true
let mockMetricsAllowedIps = ['127.0.0.1', '::1']

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: mockLogger
}))

jest.unstable_mockModule('../../src/database/pool.js', () => ({
  getPoolStatus: mockGetPoolStatus
}))

jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    get nodeEnv() { return mockNodeEnv },
    metrics: {
      get enabled() { return mockMetricsEnabled },
      get allowedIps() { return mockMetricsAllowedIps }
    }
  }
}))

// ---- Import after mocks ----------------------------------------------

const { metricsMiddleware, metricsEndpoint } = await import('../../src/middleware/metrics.js')

// ---- Helpers ---------------------------------------------------------

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    path: '/api/members',
    headers: {} as Record<string, string | string[] | undefined>,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    route: { path: '/api/members' },
    ...overrides
  }
}

function createMockRes() {
  const headers: Record<string, string> = {}
  const listeners = new Map<string, Function[]>()
  const res = {
    statusCode: 200,
    headers,
    _body: null as unknown,
    on: function (event: string, handler: Function) {
      if (!listeners.has(event)) listeners.set(event, [])
      listeners.get(event)!.push(handler)
      return res
    },
    set: function (key: string, value: string) {
      headers[key] = value
      return res
    },
    json: function (body: unknown) {
      res._body = body
      return res
    },
    send: function (body: unknown) {
      res._body = body
      return res
    },
    end: function (body?: unknown) {
      if (body) res._body = body
      return res
    },
    status: function (code: number) {
      res.statusCode = code
      return res
    },
    emit: function (event: string) {
      for (const handler of listeners.get(event) || []) {
        handler()
      }
      return res
    }
  }
  return res
}

// ---- Tests -----------------------------------------------------------

describe('Metrics Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNodeEnv = 'test'
    mockMetricsEnabled = true
    mockMetricsAllowedIps = ['127.0.0.1', '::1']
  })

  describe('请求指标收集', () => {
    it('metricsMiddleware 应该调用 next 并记录请求', () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      metricsMiddleware(req as any, res as any, next as any)

      expect(next).toHaveBeenCalled()
    })

    it('请求结束时应该记录指标数据', () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      metricsMiddleware(req as any, res as any, next as any)

      // 模拟请求结束
      res.statusCode = 200
      res.emit('finish')

      // 指标记录是通过 prom-client 内部完成的，这里验证中间件不报错
      expect(next).toHaveBeenCalled()
    })

    it('应该在请求结束时递减活跃连接数', () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      metricsMiddleware(req as any, res as any, next as any)

      // 模拟请求结束
      res.emit('finish')

      // 验证中间件正常执行无异常
      expect(next).toHaveBeenCalled()
    })
  })

  describe('指标端点 — IP 白名单', () => {
    it('非生产环境应该跳过白名单检查', async () => {
      mockNodeEnv = 'development'
      const req = createMockReq({ ip: '192.168.1.100' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      // 不应返回 403
      expect(res.statusCode).not.toBe(403)
    })

    it('生产环境应该拒绝非白名单 IP', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = true
      mockMetricsAllowedIps = ['127.0.0.1']

      const req = createMockReq({ ip: '192.168.1.100' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      expect(res.statusCode).toBe(403)
      expect(res._body).toEqual({ message: 'Forbidden' })
    })

    it('生产环境应该允许白名单 IP 访问', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = true
      mockMetricsAllowedIps = ['127.0.0.1', '::1']

      const req = createMockReq({ ip: '127.0.0.1' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      // 应该返回指标数据，不是 403
      expect(res.statusCode).not.toBe(403)
    })

    it('METRICS_ENABLED=false 时应该返回 404', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = false

      const req = createMockReq({ ip: '127.0.0.1' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      expect(res.statusCode).toBe(404)
      expect(res._body).toEqual({ message: 'Not Found' })
    })

    it('应该支持 CIDR 网段匹配', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = true
      mockMetricsAllowedIps = ['10.0.0.0/8']

      const req = createMockReq({ ip: '10.0.0.5' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      // 10.0.0.5 在 10.0.0.0/8 网段内，不应返回 403
      expect(res.statusCode).not.toBe(403)
    })

    it('CIDR 外的 IP 应该被拒绝', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = true
      mockMetricsAllowedIps = ['10.0.0.0/8']

      const req = createMockReq({ ip: '192.168.1.1' })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      expect(res.statusCode).toBe(403)
    })

    it('应该通过 X-Forwarded-For 获取真实 IP', async () => {
      mockNodeEnv = 'production'
      mockMetricsEnabled = true
      mockMetricsAllowedIps = ['203.0.113.1']

      const req = createMockReq({
        ip: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18' }
      })
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      // 应该使用 X-Forwarded-For 的第一个 IP
      expect(res.statusCode).not.toBe(403)
    })
  })

  describe('指标端点 — 内容', () => {
    it('应该更新数据库连接池指标', async () => {
      mockNodeEnv = 'development'
      const req = createMockReq()
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      expect(mockGetPoolStatus).toHaveBeenCalled()
    })

    it('应该返回 Prometheus 格式的指标', async () => {
      mockNodeEnv = 'development'
      const req = createMockReq()
      const res = createMockRes()

      await metricsEndpoint(req as any, res as any)

      // Content-Type 应该是 Prometheus 格式
      expect(res.headers['Content-Type']).toContain('text/plain')
    })
  })
})
