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

  // 验证 stats 数组每项均包含完整字段（id/title/value/icon/sort_order）
  it('stats 数组项应包含完整字段结构', async () => {
    const mockStats = [
      { id: 1, title: '活跃成员', value: 42, icon: 'users', sort_order: 1 },
      { id: 2, title: '完成任务', value: 128, icon: 'check', sort_order: 2 }
    ]
    mockGetStats.mockResolvedValueOnce({
      stats: mockStats,
      summary: { activeMembers: 42, activeProjects: 5, activePilots: 15, totalMissions: 128 }
    })

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.data.stats).toEqual(mockStats)
    // 验证每项包含必要字段
    res.body.data.stats.forEach((item: any) => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('icon')
      expect(item).toHaveProperty('sort_order')
    })
  })

  // 边界用例：stats 为空数组时应正常返回
  it('应处理空 stats 数组', async () => {
    mockGetStats.mockResolvedValueOnce({
      stats: [],
      summary: { activeMembers: 0, activeProjects: 0, activePilots: 0, totalMissions: 0 }
    })

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.stats).toEqual([])
    expect(res.body.data.summary).toEqual({
      activeMembers: 0,
      activeProjects: 0,
      activePilots: 0,
      totalMissions: 0
    })
  })

  // 边界用例：summary 所有字段为零时应正常返回
  it('应处理 summary 所有字段为零的情况', async () => {
    mockGetStats.mockResolvedValueOnce({
      stats: [{ id: 1, title: '活跃成员', value: 0, icon: 'users', sort_order: 1 }],
      summary: { activeMembers: 0, activeProjects: 0, activePilots: 0, totalMissions: 0 }
    })

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.data.summary.activeMembers).toBe(0)
    expect(res.body.data.summary.activeProjects).toBe(0)
    expect(res.body.data.summary.activePilots).toBe(0)
    expect(res.body.data.summary.totalMissions).toBe(0)
  })

  // 验证响应顶层结构包含 success/data，data 下包含 stats/summary
  it('响应应包含 success/data 字段且结构完整', async () => {
    mockGetStats.mockResolvedValueOnce({
      stats: [],
      summary: { activeMembers: 1, activeProjects: 1, activePilots: 1, totalMissions: 1 }
    })

    const res = await request(app).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('stats')
    expect(res.body.data).toHaveProperty('summary')
    expect(Array.isArray(res.body.data.stats)).toBe(true)
    expect(typeof res.body.data.summary).toBe('object')
  })
})