/**
 * @file 活动日志路由测试
 * @description 测试 /api/activity-logs 路由（Bug 3 回归）
 *              管理员专用，支持 action/userId 筛选与分页
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetActivityLogs = jest.fn()

jest.unstable_mockModule('../../src/services/activityLogService.js', () => ({
  getActivityLogs: mockGetActivityLogs,
  logActivity: jest.fn()
}))

jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return next({ statusCode: 401, message: '缺少认证令牌' })
    req.user = { id: 'user-1', role: 'admin', email: 'admin@test.com' }
    next()
  },
  requireAdmin: (req: any, _res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return next({ statusCode: 403, message: '需要管理员权限' })
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

const { default: activityLogsRouter } = await import('../../src/routes/activityLogs.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/activity-logs', activityLogsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('GET /api/activity-logs', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能获取活动日志列表', async () => {
    mockGetActivityLogs.mockResolvedValueOnce({
      logs: [
        { id: 'log-1', action: 'login', user_id: 'u1', username: 'admin', created_at: '2026-07-22T10:00:00Z' }
      ],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false }
    })

    const res = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].action).toBe('login')
    expect(res.body.pagination.total).toBe(1)
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).get('/api/activity-logs')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('应支持 action 筛选参数', async () => {
    mockGetActivityLogs.mockResolvedValueOnce({
      logs: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    })

    const res = await request(app)
      .get('/api/activity-logs?action=login')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(mockGetActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login' })
    )
  })

  it('应支持 userId 筛选参数', async () => {
    mockGetActivityLogs.mockResolvedValueOnce({
      logs: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    })

    await request(app)
      .get('/api/activity-logs?userId=u-123')
      .set('Authorization', 'Bearer valid-token')

    expect(mockGetActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-123' })
    )
  })

  it('应支持分页参数 page/limit', async () => {
    mockGetActivityLogs.mockResolvedValueOnce({
      logs: [],
      pagination: { total: 0, limit: 20, offset: 20, hasMore: false }
    })

    await request(app)
      .get('/api/activity-logs?page=2&limit=20')
      .set('Authorization', 'Bearer valid-token')

    expect(mockGetActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 20 })
    )
  })

  it('空结果应返回空数组', async () => {
    mockGetActivityLogs.mockResolvedValueOnce({
      logs: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    })

    const res = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.pagination.total).toBe(0)
  })
})
