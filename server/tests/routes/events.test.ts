/**
 * @file 活动路由测试
 * @description 测试 /api/events 路由的 CRUD 及 ICS 导出功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetEvents = jest.fn()
const mockGetEventById = jest.fn()
const mockCreateEvent = jest.fn()
const mockUpdateEvent = jest.fn()
const mockDeleteEvent = jest.fn()
const mockJoinEvent = jest.fn()
const mockLeaveEvent = jest.fn()
const mockGenerateICS = jest.fn()

jest.unstable_mockModule('../../src/services/eventService.js', () => ({
  getEvents: mockGetEvents,
  getEventById: mockGetEventById,
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  joinEvent: mockJoinEvent,
  leaveEvent: mockLeaveEvent,
  generateICS: mockGenerateICS
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

const { default: eventsRouter } = await import('../../src/routes/events.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/events', eventsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || '服务器内部错误' })
  })
  return app
}

describe('GET /api/events', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回活动列表', async () => {
    mockGetEvents.mockResolvedValueOnce({
      events: [{ id: 'e1', title: '舰队集结', status: 'upcoming' }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    })

    const res = await request(app).get('/api/events')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('应支持日期范围筛选', async () => {
    mockGetEvents.mockResolvedValueOnce({ events: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })

    await request(app).get('/api/events?startDate=2025-01-01&endDate=2025-12-31')

    expect(mockGetEvents).toHaveBeenCalledWith(expect.objectContaining({
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    }))
  })
})

describe('GET /api/events/export', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应导出 ICS 日历文件', async () => {
    mockGetEvents.mockResolvedValueOnce({
      events: [{ id: 'e1', title: '舰队集结', startDate: '2025-06-01', endDate: '2025-06-02' }],
      pagination: { page: 1, limit: 500, total: 1, totalPages: 1 }
    })
    mockGenerateICS.mockReturnValueOnce('BEGIN:VCALENDAR\r\nEND:VCALENDAR')

    const res = await request(app).get('/api/events/export')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/calendar')
  })
})

describe('GET /api/events/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回活动详情', async () => {
    mockGetEventById.mockResolvedValueOnce({ id: 'e1', title: '舰队集结' })

    const res = await request(app).get('/api/events/e1')

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('舰队集结')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetEventById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/events/nonexistent')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/events', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('认证用户应能创建活动', async () => {
    mockCreateEvent.mockResolvedValueOnce({ id: 'e2', title: '新活动' })

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: '新活动', start_time: '2025-06-01T00:00:00Z' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('新活动')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: '新活动', start_time: '2025-06-01T00:00:00Z' })

    expect(res.status).toBe(401)
  })

  it('缺少必填字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: '新活动' })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/events/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('认证用户应能更新活动', async () => {
    mockUpdateEvent.mockResolvedValueOnce({ id: 'e1', title: '更新活动' })

    const res = await request(app)
      .patch('/api/events/e1')
      .set('Authorization', 'Bearer valid-token')
      .send({ title: '更新活动' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('更新活动')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .patch('/api/events/e1')
      .send({ title: '更新活动' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/events/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除活动', async () => {
    mockDeleteEvent.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/events/e1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('活动删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/events/e1')

    expect(res.status).toBe(401)
  })
})

describe('POST /api/events/:id/join', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('认证用户应能加入活动', async () => {
    mockJoinEvent.mockResolvedValueOnce({ id: 'e1', participants: ['user-1'] })

    const res = await request(app)
      .post('/api/events/e1/join')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).post('/api/events/e1/join')

    expect(res.status).toBe(401)
  })
})

describe('POST /api/events/:id/leave', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('认证用户应能离开活动', async () => {
    mockLeaveEvent.mockResolvedValueOnce({ id: 'e1', participants: [] })

    const res = await request(app)
      .post('/api/events/e1/leave')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})