/**
 * @file 入队申请路由测试
 * @description 测试 /api/applications 路由的 CRUD 和审核操作
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetApplications = jest.fn()
const mockGetApplicationById = jest.fn()
const mockSubmitApplication = jest.fn()
const mockUpdateApplicationStatus = jest.fn()
const mockDeleteApplication = jest.fn()

jest.unstable_mockModule('../../src/services/applicationService.js', () => ({
  getApplications: mockGetApplications,
  getApplicationById: mockGetApplicationById,
  submitApplication: mockSubmitApplication,
  updateApplicationStatus: mockUpdateApplicationStatus,
  deleteApplication: mockDeleteApplication
}))

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return next({ statusCode: 401, message: '缺少认证令牌' })
    req.user = { id: 'user-1', role: 'admin', email: 'admin@test.com' }
    next()
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
  optionalAuth: (req: any, _res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      req.user = { id: 'user-1', role: 'member', email: 'member@test.com' }
    }
    next()
  },
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

const { default: applicationsRouter } = await import('../../src/routes/applications.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/applications', applicationsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('GET /api/applications', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能获取申请列表', async () => {
    mockGetApplications.mockResolvedValueOnce({
      applications: [{ id: 'a1', name: 'Test', email: 'test@test.com', status: 'pending' }],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false }
    })

    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).get('/api/applications')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('应支持 status 筛选参数', async () => {
    mockGetApplications.mockResolvedValueOnce({
      applications: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    })

    const res = await request(app)
      .get('/api/applications?status=approved')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(mockGetApplications).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' })
    )
  })
})

describe('GET /api/applications/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回申请详情', async () => {
    mockGetApplicationById.mockResolvedValueOnce({
      id: 'a1', name: 'Test', email: 'member@test.com', status: 'pending'
    })

    const res = await request(app)
      .get('/api/applications/a1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe('a1')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetApplicationById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/applications/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/applications', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效数据应提交成功并返回 201', async () => {
    mockSubmitApplication.mockResolvedValueOnce({
      id: 'a-new', status: 'pending', createdAt: '2025-01-01T00:00:00Z'
    })

    const res = await request(app)
      .post('/api/applications')
      .send({ name: '新成员', email: 'new@test.com' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('申请提交成功，我们将尽快审核')
    expect(res.body.data.id).toBe('a-new')
  })

  it('缺少姓名应返回 400', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ email: 'test@test.com' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('无效邮箱应返回 400', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ name: 'Test', email: 'invalid-email' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('PUT /api/applications/:id/status', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新申请状态', async () => {
    mockUpdateApplicationStatus.mockResolvedValueOnce({
      id: 'a1', status: 'approved', name: 'Test'
    })

    const res = await request(app)
      .put('/api/applications/a1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'approved' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('申请状态更新成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/applications/a1/status')
      .send({ status: 'approved' })

    expect(res.status).toBe(401)
  })

  it('无效状态值应返回 400', async () => {
    const res = await request(app)
      .put('/api/applications/a1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'invalid_status' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('DELETE /api/applications/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除申请', async () => {
    mockDeleteApplication.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/applications/a1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('申请删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/applications/a1')

    expect(res.status).toBe(401)
  })
})