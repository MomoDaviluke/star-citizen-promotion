/**
 * @file 舰队路由测试
 * @description 测试 /api/fleet 路由的 CRUD 及统计功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetShips = jest.fn()
const mockGetShipById = jest.fn()
const mockCreateShip = jest.fn()
const mockUpdateShip = jest.fn()
const mockDeleteShip = jest.fn()
const mockGetFleetStats = jest.fn()

jest.unstable_mockModule('../../src/services/fleetService.js', () => ({
  getShips: mockGetShips,
  getShipById: mockGetShipById,
  createShip: mockCreateShip,
  updateShip: mockUpdateShip,
  deleteShip: mockDeleteShip,
  getFleetStats: mockGetFleetStats
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

const { default: fleetRouter } = await import('../../src/routes/fleet.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/fleet', fleetRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || '服务器内部错误' })
  })
  return app
}

describe('GET /api/fleet/stats', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回舰队统计数据', async () => {
    mockGetFleetStats.mockResolvedValueOnce({
      totalShips: 42,
      totalValue: 15000000,
      categories: { fighter: 20, freighter: 10 }
    })

    const res = await request(app).get('/api/fleet/stats')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.totalShips).toBe(42)
  })

  it('统计服务错误应返回 500', async () => {
    mockGetFleetStats.mockRejectedValueOnce(new Error('数据库错误'))

    const res = await request(app).get('/api/fleet/stats')

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

describe('GET /api/fleet', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回飞船列表', async () => {
    mockGetShips.mockResolvedValueOnce({
      ships: [{ id: 's1', name: 'Aurora MR', category: 'starter' }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    })

    const res = await request(app).get('/api/fleet')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('应支持 category 筛选', async () => {
    mockGetShips.mockResolvedValueOnce({ ships: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })

    await request(app).get('/api/fleet?category=fighter')

    expect(mockGetShips).toHaveBeenCalledWith(expect.objectContaining({ category: 'fighter' }))
  })

  it('应支持排序参数', async () => {
    mockGetShips.mockResolvedValueOnce({ ships: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })

    await request(app).get('/api/fleet?sortBy=name&order=asc')

    expect(mockGetShips).toHaveBeenCalledWith(expect.objectContaining({
      sortBy: 'name',
      order: 'asc'
    }))
  })
})

describe('GET /api/fleet/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回飞船详情', async () => {
    mockGetShipById.mockResolvedValueOnce({ id: 's1', name: 'Aurora MR', category: 'starter' })

    const res = await request(app).get('/api/fleet/s1')

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Aurora MR')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetShipById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/fleet/nonexistent')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/fleet', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能添加飞船', async () => {
    mockCreateShip.mockResolvedValueOnce({ id: 's2', name: 'Constellation', ship: 'Constellation Andromeda', category: 'multi-crew' })

    const res = await request(app)
      .post('/api/fleet')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Constellation', ship: 'Constellation Andromeda', category: 'transport' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Constellation')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/fleet')
      .send({ name: 'Constellation', ship: 'Constellation Andromeda' })

    expect(res.status).toBe(401)
  })

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/fleet')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Constellation' })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/fleet/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新飞船', async () => {
    mockUpdateShip.mockResolvedValueOnce({ id: 's1', name: 'Aurora LX', ship: 'Aurora LX', category: 'starter' })

    const res = await request(app)
      .patch('/api/fleet/s1')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Aurora LX' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Aurora LX')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .patch('/api/fleet/s1')
      .send({ name: 'Aurora LX' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/fleet/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除飞船', async () => {
    mockDeleteShip.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/fleet/s1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('飞船删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/fleet/s1')

    expect(res.status).toBe(401)
  })
})