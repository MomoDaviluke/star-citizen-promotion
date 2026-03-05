/**
 * @file 错误处理中间件测试
 * @description 测试 errorHandler 和 ApiError
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ApiError, errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js'

describe('ApiError', () => {
  describe('构造函数', () => {
    it('应创建带有状态码和消息的错误', () => {
      const error = new ApiError(400, 'Bad Request')

      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Bad Request')
      expect(error.name).toBe('ApiError')
    })

    it('应支持错误详情', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }]
      const error = new ApiError(400, 'Validation failed', errors)

      expect(error.errors).toEqual(errors)
    })
  })

  describe('静态工厂方法', () => {
    it('badRequest 应创建 400 错误', () => {
      const error = ApiError.badRequest('Invalid data')

      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid data')
    })

    it('unauthorized 应创建 401 错误', () => {
      const error = ApiError.unauthorized()

      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('未授权访问')
    })

    it('unauthorized 应支持自定义消息', () => {
      const error = ApiError.unauthorized('Token expired')

      expect(error.message).toBe('Token expired')
    })

    it('forbidden 应创建 403 错误', () => {
      const error = ApiError.forbidden()

      expect(error.statusCode).toBe(403)
      expect(error.message).toBe('禁止访问')
    })

    it('notFound 应创建 404 错误', () => {
      const error = ApiError.notFound('User not found')

      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('User not found')
    })

    it('conflict 应创建 409 错误', () => {
      const error = ApiError.conflict('Email already exists')

      expect(error.statusCode).toBe(409)
      expect(error.message).toBe('Email already exists')
    })

    it('internal 应创建 500 错误', () => {
      const error = ApiError.internal()

      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('服务器内部错误')
    })
  })
})

describe('errorHandler', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      url: '/api/test',
      method: 'POST',
      body: { data: 'test' },
      query: {},
      params: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  it('应处理 ApiError', () => {
    const error = ApiError.badRequest('Invalid input', [{ field: 'name', message: 'Required' }])

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid input',
      errors: [{ field: 'name', message: 'Required' }],
      timestamp: expect.any(String)
    })
  })

  it('应处理 ValidationError', () => {
    const error = new Error('Validation failed')
    error.name = 'ValidationError'
    error.errors = { email: { message: 'Invalid email' } }

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '数据验证失败',
      errors: { email: { message: 'Invalid email' } },
      timestamp: expect.any(String)
    })
  })

  it('应处理 JsonWebTokenError', () => {
    const error = new Error('jwt malformed')
    error.name = 'JsonWebTokenError'

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '无效的认证令牌',
      timestamp: expect.any(String)
    })
  })

  it('应处理 TokenExpiredError', () => {
    const error = new Error('jwt expired')
    error.name = 'TokenExpiredError'

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '认证令牌已过期',
      timestamp: expect.any(String)
    })
  })

  it('应处理 SQLITE_CONSTRAINT 错误', () => {
    const error = new Error('UNIQUE constraint failed')
    error.code = 'SQLITE_CONSTRAINT'

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '数据约束冲突',
      timestamp: expect.any(String)
    })
  })

  it('应处理未知错误为 500', () => {
    const error = new Error('Unknown error')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown error',
      timestamp: expect.any(String)
    })
  })

  it('应使用错误的 statusCode 属性', () => {
    const error = new Error('Custom error')
    error.statusCode = 418

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(418)
  })

  it('应使用错误的 status 属性', () => {
    const error = new Error('Custom error')
    error.status = 503

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(503)
  })
})

describe('notFoundHandler', () => {
  let req, res

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/nonexistent'
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
  })

  it('应返回 404 响应', () => {
    notFoundHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '路由 GET /api/nonexistent 不存在',
      timestamp: expect.any(String)
    })
  })
})
