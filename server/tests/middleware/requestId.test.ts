/**
 * @file 请求ID中间件测试
 * @description 测试 requestId 中间件的请求追踪功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockLoggerInfo = jest.fn()

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: mockLoggerInfo,
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

const { requestId } = await import('../../src/middleware/requestId.js')

describe('requestId', () => {
  let req: any, res: any, next: any

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/test'
    }
    res = { setHeader: jest.fn() }
    next = jest.fn()
  })

  describe('请求ID生成', () => {
    it('无 x-request-id 头时应自动生成 UUID', () => {
      requestId(req, res, next)
      expect(req.id).toBeDefined()
      expect(typeof req.id).toBe('string')
      expect(req.id.length).toBeGreaterThan(0)
      expect(next).toHaveBeenCalledWith()
    })

    it('有 x-request-id 头时应使用请求头中的值', () => {
      const customId = 'custom-request-id-12345'
      req.headers['x-request-id'] = customId
      requestId(req, res, next)
      expect(req.id).toBe(customId)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('响应头设置', () => {
    it('应在响应头中设置 X-Request-ID', () => {
      requestId(req, res, next)
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id)
    })

    it('自定义请求ID应反映在响应头中', () => {
      const customId = 'trace-id-999'
      req.headers['x-request-id'] = customId
      requestId(req, res, next)
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', customId)
    })
  })

  describe('日志记录', () => {
    it('应记录请求开始日志', () => {
      requestId(req, res, next)
      expect(mockLoggerInfo).toHaveBeenCalledTimes(1)
      const logCall = mockLoggerInfo.mock.calls[0]
      expect(logCall[0]).toBe('请求开始')
      expect(logCall[1]).toMatchObject({
        requestId: req.id,
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1'
      })
    })

    it('不同请求应生成不同的请求ID', () => {
      const req2 = {
        headers: {},
        ip: '192.168.1.1',
        method: 'POST',
        url: '/api/other'
      }
      const res2 = { setHeader: jest.fn() }
      const next2 = jest.fn()

      requestId(req, res, next)
      requestId(req2, res2, next2)

      expect(req.id).not.toBe(req2.id)
    })
  })
})