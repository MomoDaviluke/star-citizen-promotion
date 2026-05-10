/**
 * @file 成员路由测试
 * @description 测试 /api/members 路由的 CRUD 操作
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetMembers = jest.fn()
const mockGetMemberById = jest.fn()
const mockCreateMember = jest.fn()
const mockUpdateMember = jest.fn()
const mockDeleteMember = jest.fn()

jest.unstable_mockModule('../../src/services/memberService.js', () => ({
  getMembers: mockGetMembers,
  getMemberById: mockGetMemberById,
  createMember: mockCreateMember,
  updateMember: mockUpdateMember,
  deleteMember: mockDeleteMember
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

const { default: membersRouter } = await import('../../src/routes/members.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/members', membersRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('GET /api/members', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回成员列表和分页信息', async () => {
    mockGetMembers.mockResolvedValueOnce({
      members: [{ id: 'm1', name: 'Echo', role: 'pilot' }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    })

    const res = await request(app).get('/api/members')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('应支持 status 筛选参数', async () => {
    mockGetMembers.mockResolvedValueOnce({
      members: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
    })

    const res = await request(app).get('/api/members?status=active')

    expect(res.status).toBe(200)
    expect(mockGetMembers).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    )
  })

  it('服务层错误应返回 500', async () => {
    mockGetMembers.mockRejectedValueOnce(new Error('数据库错误'))

    const res = await request(app).get('/api/members')

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

describe('GET /api/members/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回成员详情', async () => {
    mockGetMemberById.mockResolvedValueOnce({
      id: 'm1', name: 'Echo', role: 'pilot', intro: '资深飞行员'
    })

    const res = await request(app).get('/api/members/m1')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Echo')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetMemberById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/members/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/members', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能创建成员', async () => {
    mockCreateMember.mockResolvedValueOnce({
      id: 'm2', name: '新成员', role: 'pilot'
    })

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '新成员', role: 'pilot' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('新成员')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/members')
      .send({ name: '新成员', role: 'pilot' })

    expect(res.status).toBe(401)
  })

  it('缺少名称应返回 400', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'pilot' })

    expect(res.status).toBe(400)
  })

  it('缺少角色应返回 400', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '新成员' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/members/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新成员', async () => {
    mockUpdateMember.mockResolvedValueOnce({
      id: 'm1', name: '更新名称', role: 'commander'
    })

    const res = await request(app)
      .put('/api/members/m1')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '更新名称', role: 'commander' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('更新名称')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/members/m1')
      .send({ name: '更新名称' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/members/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除成员', async () => {
    mockDeleteMember.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/members/m1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('成员删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/members/m1')

    expect(res.status).toBe(401)
  })
})