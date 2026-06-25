/**
 * @file 站点设置路由测试
 * @description 测试 /api/settings 路由的读写操作
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetAllSettings = jest.fn()
const mockUpdateSettings = jest.fn()

jest.unstable_mockModule('../../src/services/settingsService.js', () => ({
  getAllSettings: mockGetAllSettings,
  updateSettings: mockUpdateSettings
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

const { default: settingsRouter } = await import('../../src/routes/settings.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/settings', settingsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('GET /api/settings', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回站点设置（无需认证）', async () => {
    mockGetAllSettings.mockResolvedValueOnce({
      siteName: 'Star Citizen Promotion',
      description: 'Test description'
    })

    const res = await request(app).get('/api/settings')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.siteName).toBe('Star Citizen Promotion')
  })

  it('服务层异常应返回 500', async () => {
    mockGetAllSettings.mockRejectedValueOnce(new Error('数据库连接失败'))

    const res = await request(app).get('/api/settings')

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

describe('PUT /api/settings', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新站点设置', async () => {
    mockUpdateSettings.mockResolvedValueOnce({
      siteName: 'Updated Name',
      description: 'Updated description'
    })

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', 'Bearer valid-token')
      .send({ siteName: 'Updated Name' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('站点设置更新成功')
    expect(res.body.data.siteName).toBe('Updated Name')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ siteName: 'Test' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})