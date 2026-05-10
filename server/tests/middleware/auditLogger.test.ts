/**
 * @file 审计日志中间件测试
 * @description 测试 auditLogger 中间件的审计功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockQuery = jest.fn()
const mockLoggerInfo = jest.fn()
const mockLoggerError = jest.fn()

jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    nodeEnv: 'test',
    jwt: { secret: 'test-secret' },
    port: 3000,
    db: { host: 'localhost', port: 3306, user: 'test', password: 'test', database: 'test' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, max: 100 }
  }
}))

jest.unstable_mockModule('../../src/database/pool.js', () => ({
  query: mockQuery
}))

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}))

const { auditLogger, cleanupAuditLogs } = await import('../../src/middleware/auditLogger.js')

describe('auditLogger', () => {
  let req: any, res: any, next: any

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      method: 'POST',
      url: '/api/members',
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
      user: { id: 'user-1' },
      body: { name: '测试成员', role: 'pilot' },
      params: {}
    }
    res = {
      statusCode: 201,
      json: jest.fn().mockReturnValue({ success: true })
    }
    next = jest.fn()
  })

  describe('非审计方法跳过', () => {
    it('GET 请求应跳过审计', () => {
      req.method = 'GET'
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('HEAD 请求应跳过审计', () => {
      req.method = 'HEAD'
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('非实体路径跳过', () => {
    it('非映射路径应跳过审计', () => {
      req.url = '/api/unknown'
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('审计方法处理', () => {
    it('POST 请求应触发审计', () => {
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('PUT 请求应触发审计', () => {
      req.method = 'PUT'
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('DELETE 请求应触发审计', () => {
      req.method = 'DELETE'
      auditLogger(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('审计日志写入', () => {
    it('成功响应应写入审计日志', async () => {
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true, data: { id: 'm1' } })
      expect(mockQuery).toHaveBeenCalledTimes(1)
      const [sql, params] = mockQuery.mock.calls[0]
      expect(sql).toContain('INSERT INTO activity_logs')
      expect(params[1]).toBe('user-1')
      expect(params[2]).toBe('create')
      expect(params[3]).toBe('member')
    })

    it('失败响应也应写入审计日志', async () => {
      res.statusCode = 400
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: false, error: '验证失败' })
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('审计日志写入失败不应影响响应', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'))
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('敏感信息脱敏', () => {
    it('密码字段应被脱敏', async () => {
      req.body = { username: 'test', password: 'secret123' }
      req.url = '/api/auth'
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      const detailsJson = JSON.parse(mockQuery.mock.calls[0][1][5])
      expect(detailsJson.body.password).toBe('[REDACTED]')
      expect(detailsJson.body.username).toBe('test')
    })

    it('token 字段应被脱敏', async () => {
      req.body = { name: 'test', token: 'bearer-xxx' }
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      const detailsJson = JSON.parse(mockQuery.mock.calls[0][1][5])
      expect(detailsJson.body.token).toBe('[REDACTED]')
    })
  })

  describe('实体类型识别', () => {
    it('members 路径应识别为 member', async () => {
      req.url = '/api/members'
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockQuery.mock.calls[0][1][3]).toBe('member')
    })

    it('pilots 路径应识别为 pilot', async () => {
      req.url = '/api/pilots'
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockQuery.mock.calls[0][1][3]).toBe('pilot')
    })
  })

  describe('操作类型识别', () => {
    it('POST 应识别为 create', async () => {
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockQuery.mock.calls[0][1][2]).toBe('create')
    })

    it('DELETE 应识别为 delete', async () => {
      req.method = 'DELETE'
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockQuery.mock.calls[0][1][2]).toBe('delete')
    })

    it('密码修改路径应识别为 password_change', async () => {
      req.method = 'PUT'
      req.url = '/api/auth/password'
      auditLogger(req, res, next)
      const wrappedJson = res.json
      await wrappedJson({ success: true })
      expect(mockQuery.mock.calls[0][1][2]).toBe('password_change')
    })
  })
})

describe('cleanupAuditLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应执行清理查询', async () => {
    mockQuery.mockResolvedValueOnce({ affectedRows: 5 })
    const result = await cleanupAuditLogs()
    expect(result).toBe(5)
    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery.mock.calls[0][0]).toContain('DELETE FROM activity_logs')
  })

  it('清理失败应返回 0', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))
    const result = await cleanupAuditLogs()
    expect(result).toBe(0)
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('无记录清理时应返回 0', async () => {
    mockQuery.mockResolvedValueOnce({ affectedRows: 0 })
    const result = await cleanupAuditLogs()
    expect(result).toBe(0)
  })
})