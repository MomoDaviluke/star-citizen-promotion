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

jest.unstable_mockModule('../src/database/pool.ts', () => ({
  queryOne: mockQueryOne
}))

jest.unstable_mockModule('../src/config/index.ts', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key'
    }
  }
}))

const { authenticate, optionalAuth, requireRole, requireAdmin } = await import('../src/middleware/auth.ts')
const { ApiError } = await import('../src/middleware/errorHandler.ts')

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

  it('有效令牌应设置 req.user', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 1 })
    mockQueryOne.mockResolvedValue({ id: '1', role: 'member' })

    await authenticate(req, res, next)

    expect(req.user).toEqual({ id: '1', role: 'member' })
    expect(next).toHaveBeenCalledWith()
  })

  it('有效令牌但用户不存在应返回 401', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 99 })
    mockQueryOne.mockResolvedValue(null)

    await authenticate(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('用户不存在或已被禁用')
  })

  it('有效令牌但数据库查询异常应返回 500', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 1 })
    mockQueryOne.mockRejectedValue(new Error('Connection refused'))

    await authenticate(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('认证验证失败')
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

  it('无 Authorization 头应继续处理', async () => {
    await optionalAuth(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })

  it('有效令牌应设置 req.user', async () => {
    req.headers.authorization = 'Bearer valid-token'
    mockVerify.mockReturnValue({ userId: 1 })

    await optionalAuth(req, res, next)

    expect(req.user).toEqual({ id: 1 })
    expect(next).toHaveBeenCalledWith()
  })

  it('无效令牌应继续处理但不设置 user', async () => {
    req.headers.authorization = 'Bearer invalid-token'
    mockVerify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    await optionalAuth(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })
})

describe('requireRole', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    req = {}
    res = {}
    next = jest.fn()
  })

  it('未登录用户应返回 401', async () => {
    req.user = null
    const middleware = requireRole('admin')

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('请先登录')
  })

  it('角色不匹配应返回 403', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockResolvedValue({ role: 'user' })
    const middleware = requireRole('admin')

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('权限不足，无权访问此资源')
  })

  it('角色匹配应通过', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockResolvedValue({ role: 'admin' })
    const middleware = requireRole('admin')

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user.role).toBe('admin')
  })

  it('应支持多个角色', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockResolvedValue({ role: 'editor' })
    const middleware = requireRole('admin', 'editor')

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('DB 查询异常应返回 500', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockRejectedValue(new Error('Connection refused'))
    const middleware = requireRole('admin')

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('权限验证失败')
  })
})

describe('requireAdmin', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    req = {}
    res = {}
    next = jest.fn()
  })

  it('管理员应通过', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockResolvedValue({ role: 'admin' })

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('非管理员应返回 403', async () => {
    req.user = { id: 1 }
    mockQueryOne.mockResolvedValue({ role: 'user' })

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
  })
})
