/**
 * @file 统计路由测试
 * @description 测试 /api/stats 路由的统计数据查询
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetStats = jest.fn()

jest.unstable_mockModule('../../src/services/statsService.js', () => ({
  getStats: mockGetStats
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

const { default: statsRouter } = await import('../../src/routes/stats.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/stats', statsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('GET /api/stats', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回统计数据（无需认证）', async () => {
    mockGetStats.mockResolvedValueOnce({
      stats: [
        { id: 1, title: '活跃成员', value: 42, icon: 'users', sort_order: 1 },
        { id: 2, title: '完成任务', value: 128, icon: 'check', sort_order: 2 }
      ],
      summary: { activeMembers: 42, activeProjects: 5, activePilots: 15, totalMissions: 128 }
    })

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.stats).toHaveLength(2)
    expect(res.body.data.summary.activeMembers).toBe(42)
    expect(res.body.data.summary.activeProjects).toBe(5)
    expect(res.body.data.summary.activePilots).toBe(15)
    expect(res.body.data.summary.totalMissions).toBe(128)
  })

  it('服务层异常应返回 500', async () => {
    mockGetStats.mockRejectedValueOnce(new Error('数据库连接失败'))

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})