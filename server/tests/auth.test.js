/**
 * @file 认证中间件测试
 * @description 测试 authenticate, optionalAuth, requireRole
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockVerify = jest.fn()
const mockQueryOne = jest.fn()

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  }
}))

jest.unstable_mockModule('../src/database/pool.js', () => ({
  queryOne: mockQueryOne
}))

jest.unstable_mockModule('../src/config/index.js', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key'
    }
  }
}))

const { authenticate, optionalAuth, requireRole, requireAdmin } = await import('../src/middleware/auth.js')
const { ApiError } = await import('../src/middleware/errorHandler.js')

describe('authenticate', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    req = { headers: {} }
    res = {}
    next = jest.fn()
  })

  it('缺少 Authorization 头应返回 401', async () => {
    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('缺少认证令牌')
  })

  it('Authorization 头格式错误应返回 401', async () => {
    req.headers.authorization = 'InvalidFormat token'

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
  })

  it('无效令牌应返回 401', async () => {
    req.headers.authorization = 'Bearer invalid-token'
    mockVerify.mockImplementation(() => {
      const error = new Error('invalid token')
      error.name = 'JsonWebTokenError'
      throw error
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('无效的认证令牌')
  })

  it('过期令牌应返回 401', async () => {
    req.headers.authorization = 'Bearer expired-token'
    mockVerify.mockImplementation(() => {
      const error = new Error('jwt expired')
      error.name = 'TokenExpiredError'
      throw error
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('认证令牌已过期')
  })

  it('用户不存在应返回 401', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 999 })
    mockQueryOne.mockResolvedValue(null)

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('用户不存在')
  })

  it('有效令牌应设置 req.user', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 1 })
    mockQueryOne.mockResolvedValue(mockUser)

    await authenticate(req, res, next)

    expect(req.user).toEqual(mockUser)
    expect(next).toHaveBeenCalledWith()
  })
})

describe('optionalAuth', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    req = { headers: {} }
    res = {}
    next = jest.fn()
  })

  it('无 Authorization 头应设置 req.user 为 null', async () => {
    await optionalAuth(req, res, next)

    expect(req.user).toBeNull()
    expect(next).toHaveBeenCalledWith()
  })

  it('有效令牌应设置 req.user', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 1 })
    mockQueryOne.mockResolvedValue(mockUser)

    await optionalAuth(req, res, next)

    expect(req.user).toEqual(mockUser)
    expect(next).toHaveBeenCalledWith()
  })

  it('无效令牌应设置 req.user 为 null', async () => {
    req.headers.authorization = 'Bearer invalid-token'
    mockVerify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    await optionalAuth(req, res, next)

    expect(req.user).toBeNull()
    expect(next).toHaveBeenCalledWith()
  })

  it('用户不存在应设置 req.user 为 null', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 999 })
    mockQueryOne.mockResolvedValue(null)

    await optionalAuth(req, res, next)

    expect(req.user).toBeNull()
    expect(next).toHaveBeenCalledWith()
  })
})

describe('requireRole', () => {
  let req, res, next

  beforeEach(() => {
    req = {}
    res = {}
    next = jest.fn()
  })

  it('未登录用户应返回 401', () => {
    req.user = null
    const middleware = requireRole('admin')

    middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('需要登录')
  })

  it('角色不匹配应返回 403', () => {
    req.user = { id: 1, role: 'user' }
    const middleware = requireRole('admin')

    middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('权限不足')
  })

  it('角色匹配应通过', () => {
    req.user = { id: 1, role: 'admin' }
    const middleware = requireRole('admin')

    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('应支持多个角色', () => {
    req.user = { id: 1, role: 'editor' }
    const middleware = requireRole('admin', 'editor')

    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })
})

describe('requireAdmin', () => {
  let req, res, next

  beforeEach(() => {
    req = {}
    res = {}
    next = jest.fn()
  })

  it('管理员应通过', () => {
    req.user = { id: 1, role: 'admin' }

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('非管理员应返回 403', () => {
    req.user = { id: 1, role: 'user' }

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
  })
})
