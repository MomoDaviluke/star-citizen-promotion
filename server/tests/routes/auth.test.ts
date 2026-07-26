/**
 * @file 认证路由测试
 * @description 测试 /api/auth 路由的注册、登录、令牌管理等功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockRegisterUser = jest.fn()
const mockLoginUser = jest.fn()
const mockGetUserById = jest.fn()
const mockUpdateUserProfile = jest.fn()
const mockChangePassword = jest.fn()
const mockRefreshUserToken = jest.fn()

jest.unstable_mockModule('../../src/services/authService.js', () => ({
  registerUser: mockRegisterUser,
  loginUser: mockLoginUser,
  getUserById: mockGetUserById,
  updateUserProfile: mockUpdateUserProfile,
  changePassword: mockChangePassword,
  refreshUserToken: mockRefreshUserToken
}))

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return next({ statusCode: 401, message: '缺少认证令牌' })
    }
    if (token === 'invalid') {
      return next({ statusCode: 401, message: '无效的认证令牌' })
    }
    req.user = { id: 'user-1', role: 'admin' }
    next()
  },
  requireAdmin: (req: any, _res: any, next: any) => next(),
  AuthenticatedRequest: {} as any
}))

jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    nodeEnv: 'test',
    jwt: { secret: 'test-secret' },
    port: 3000,
    db: { host: 'localhost', port: 3306, user: 'test', password: 'test', database: 'test' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, max: 100 }
  },
  COOKIE_OPTIONS: { httpOnly: true, secure: false, sameSite: 'lax' }
}))

const { default: authRouter } = await import('../../src/routes/auth.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('POST /api/auth/register', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效数据应注册成功并返回 201', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      token: 'jwt-token-123',
      user: { id: 'u1', username: 'testuser', email: 'test@example.com' }
    })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'Test1234' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBe('jwt-token-123')
    expect(mockRegisterUser).toHaveBeenCalledTimes(1)
  })

  it('用户名过短应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'test@example.com', password: 'Test1234' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('密码过短应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('无效邮箱应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'invalid', password: 'Test1234' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/auth/login', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效凭证应登录成功', async () => {
    mockLoginUser.mockResolvedValueOnce({
      token: 'jwt-token-456',
      user: { id: 'u1', email: 'test@example.com' }
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test1234' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBe('jwt-token-456')
  })

  it('无效凭证应返回错误', async () => {
    mockLoginUser.mockRejectedValueOnce({ statusCode: 401, message: '邮箱或密码错误' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'WrongPass1' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('缺少邮箱应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Test1234' })

    expect(res.status).toBe(400)
  })

  it('无效邮箱格式应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Test1234' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效令牌应返回用户信息', async () => {
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin'
    })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.username).toBe('testuser')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('用户不存在应返回 404', async () => {
    mockGetUserById.mockResolvedValueOnce(null)

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe('PUT /api/auth/profile', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效数据应更新成功', async () => {
    mockUpdateUserProfile.mockResolvedValueOnce({
      id: 'user-1',
      username: 'newname',
      email: 'test@example.com'
    })

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', 'Bearer valid-token')
      .send({ username: 'newname' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.username).toBe('newname')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send({ username: 'newname' })

    expect(res.status).toBe(401)
  })

  it('用户名过短应返回 400', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', 'Bearer valid-token')
      .send({ username: 'ab' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/auth/password', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('正确密码应修改成功', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', 'Bearer valid-token')
      .send({ currentPassword: 'OldPass1', newPassword: 'NewPass123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('密码修改成功')
  })

  it('错误当前密码应返回错误', async () => {
    mockChangePassword.mockRejectedValueOnce({ statusCode: 401, message: '当前密码错误' })

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', 'Bearer valid-token')
      .send({ currentPassword: 'WrongPass1', newPassword: 'NewPass123' })

    expect(res.status).toBe(401)
  })

  it('新密码过短应返回 400', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', 'Bearer valid-token')
      .send({ currentPassword: 'OldPass1', newPassword: 'short' })

    expect(res.status).toBe(400)
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .send({ currentPassword: 'OldPass1', newPassword: 'NewPass123' })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效令牌应刷新成功', async () => {
    mockRefreshUserToken.mockResolvedValueOnce({
      token: 'new-jwt-token',
      user: { id: 'user-1', email: 'test@example.com' }
    })

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer valid-token')
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBe('new-jwt-token')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({})

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/auth/logout', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应成功登出', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('登出成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).post('/api/auth/logout')

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/password-reset', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('请求密码重置应返回 501（功能未启用）', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset')
      .send({ email: 'test@example.com' })

    expect(res.status).toBe(501)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('NOT_IMPLEMENTED')
    expect(res.body.message).toContain('未启用')
  })

  it('无需认证即可请求（未登录用户也能调用）', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset')
      .send({ email: 'forgot@example.com' })

    expect(res.status).toBe(501)
  })
})

describe('POST /api/auth/password-reset/:token', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('使用重置令牌应返回 501（功能未启用）', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/some-token')
      .send({ newPassword: 'NewPass123' })

    expect(res.status).toBe(501)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('NOT_IMPLEMENTED')
  })
})