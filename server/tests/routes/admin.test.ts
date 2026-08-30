/**
 * @file 管理路由测试
 * @description 测试 /api/admin 路由的数据库重置和缓存清除
 *              路由要求 confirmPassword 二次验证 + bcrypt 密码比对
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockInitDatabase = jest.fn()
const mockVerifyAdminPassword = jest.fn()

// bcrypt.compare 由 adminService 内部调用，测试直接 mock service 层
jest.unstable_mockModule('../../src/database/init.js', () => ({
  initDatabase: mockInitDatabase
}))

// verifyAdminPassword 由 adminService 提供，mock service 层以隔离 DB 依赖
jest.unstable_mockModule('../../src/services/adminService.js', () => ({
  verifyAdminPassword: mockVerifyAdminPassword
}))

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return next({ statusCode: 401, message: '缺少认证令牌' })
    req.user = { id: 'user-1', role: 'admin' }
    next()
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
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
  }
}))

const { default: adminRouter } = await import('../../src/routes/admin.js')

const VALID_ADMIN_TOKEN = 'Bearer valid-admin-token'
const CONFIRM_PASSWORD = 'admin-confirm-password'

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

/**
 * 设置密码验证通过的 mock 链
 * adminService.verifyAdminPassword 返回 true
 */
function setupPasswordVerification() {
  mockVerifyAdminPassword.mockResolvedValue(true)
}

describe('POST /api/admin/reset-db', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员提供正确的确认密码应能重置数据库', async () => {
    mockInitDatabase.mockResolvedValueOnce(undefined)
    setupPasswordVerification()

    const res = await request(app)
      .post('/api/admin/reset-db')
      .set('Authorization', VALID_ADMIN_TOKEN)
      .send({ confirmPassword: CONFIRM_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('数据库重置成功')
    expect(mockInitDatabase).toHaveBeenCalled()
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).post('/api/admin/reset-db')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('确认密码错误应返回 403', async () => {
    mockVerifyAdminPassword.mockResolvedValue(false)

    const res = await request(app)
      .post('/api/admin/reset-db')
      .set('Authorization', VALID_ADMIN_TOKEN)
      .send({ confirmPassword: 'wrong-password' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('确认密码错误，操作被拒绝')
  })

  it('缺少确认密码应返回 400', async () => {
    const res = await request(app)
      .post('/api/admin/reset-db')
      .set('Authorization', VALID_ADMIN_TOKEN)
      // 不传 body

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/admin/clear-cache', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员提供正确的确认密码应能清除缓存', async () => {
    setupPasswordVerification()

    const res = await request(app)
      .post('/api/admin/clear-cache')
      .set('Authorization', VALID_ADMIN_TOKEN)
      .send({ confirmPassword: CONFIRM_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('缓存已清除')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).post('/api/admin/clear-cache')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('确认密码错误应返回 403', async () => {
    mockVerifyAdminPassword.mockResolvedValue(false)

    const res = await request(app)
      .post('/api/admin/clear-cache')
      .set('Authorization', VALID_ADMIN_TOKEN)
      .send({ confirmPassword: 'wrong-password' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('缺少确认密码应返回 400', async () => {
    const res = await request(app)
      .post('/api/admin/clear-cache')
      .set('Authorization', VALID_ADMIN_TOKEN)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
