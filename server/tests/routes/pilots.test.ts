/**
 * @file 飞行员路由测试
 * @description 测试 /api/pilots 路由的 CRUD 操作
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetPilots = jest.fn()
const mockGetPilotById = jest.fn()
const mockCreatePilot = jest.fn()
const mockUpdatePilot = jest.fn()
const mockDeletePilot = jest.fn()

jest.unstable_mockModule('../../src/services/pilotService.js', () => ({
  getPilots: mockGetPilots,
  getPilotById: mockGetPilotById,
  createPilot: mockCreatePilot,
  updatePilot: mockUpdatePilot,
  deletePilot: mockDeletePilot
}))

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    if (!req.headers.authorization) return next({ statusCode: 401, message: '缺少认证令牌' })
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

const { default: pilotsRouter } = await import('../../src/routes/pilots.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/pilots', pilotsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || '服务器内部错误' })
  })
  return app
}

describe('GET /api/pilots', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回飞行员列表', async () => {
    mockGetPilots.mockResolvedValueOnce({
      pilots: [{ id: 'p1', name: 'Ace', callsign: 'Viper' }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    })

    const res = await request(app).get('/api/pilots')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('应支持 status 筛选', async () => {
    mockGetPilots.mockResolvedValueOnce({ pilots: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })

    await request(app).get('/api/pilots?status=active')

    expect(mockGetPilots).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }))
  })
})

describe('GET /api/pilots/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回飞行员详情', async () => {
    mockGetPilotById.mockResolvedValueOnce({ id: 'p1', name: 'Ace', callsign: 'Viper' })

    const res = await request(app).get('/api/pilots/p1')

    expect(res.status).toBe(200)
    expect(res.body.data.callsign).toBe('Viper')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetPilotById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/pilots/nonexistent')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/pilots', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能创建飞行员', async () => {
    mockCreatePilot.mockResolvedValueOnce({ id: 'p2', name: '新飞行员', callsign: 'Rookie', ship: 'Aurora' })

    const res = await request(app)
      .post('/api/pilots')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '新飞行员', callsign: 'Rookie', ship: 'Aurora' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.callsign).toBe('Rookie')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/pilots')
      .send({ name: '新飞行员', callsign: 'Rookie', ship: 'Aurora' })

    expect(res.status).toBe(401)
  })

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/pilots')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '新飞行员' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/pilots/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新飞行员', async () => {
    mockUpdatePilot.mockResolvedValueOnce({ id: 'p1', name: '更新', callsign: 'Ghost', ship: 'Aurora' })

    const res = await request(app)
      .put('/api/pilots/p1')
      .set('Authorization', 'Bearer valid-token')
      .send({ callsign: 'Ghost' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.callsign).toBe('Ghost')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/pilots/p1')
      .send({ callsign: 'Ghost' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/pilots/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除飞行员', async () => {
    mockDeletePilot.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/pilots/p1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('飞行员删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/pilots/p1')

    expect(res.status).toBe(401)
  })
})