/**
 * @file 转化埋点路由测试
 * @description 测试 /api/analytics 路由的事件接收、白名单校验与日志写入
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockLoggerInfo = jest.fn()
const mockLoggerWarn = jest.fn()

// mock logger，断言事件写入结构化日志
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: mockLoggerInfo,
    warn: mockLoggerWarn,
    error: jest.fn()
  }
}))

const { default: analyticsRouter } = await import('../../src/routes/analytics.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/analytics', analyticsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    })
  })
  return app
}

describe('POST /api/analytics', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应接收合法的单个事件并返回 204', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'page_view', properties: { path: '/', ts: Date.now() } })

    expect(res.status).toBe(204)
    expect(mockLoggerInfo).toHaveBeenCalled()
  })

  it('应接收批量事件数组', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send([
        { event: 'page_view', properties: { path: '/' } },
        { event: 'application_submit_success', properties: { experience: '3年' } }
      ])

    expect(res.status).toBe(204)
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ count: 2 })
    )
  })

  it('白名单外的事件应返回 400', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'hack_event', properties: {} })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockLoggerInfo).not.toHaveBeenCalled()
  })

  it('缺少 event 字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ properties: { path: '/' } })

    expect(res.status).toBe(400)
  })

  it('请求体既非对象也非数组应返回 400', async () => {
    const res = await request(app).post('/api/analytics').send('not-json')

    expect(res.status).toBe(400)
  })

  it('空数组应返回 400（无有效事件）', async () => {
    const res = await request(app).post('/api/analytics').send([])

    expect(res.status).toBe(400)
  })

  it('batch 中任一事件非法应整体拒绝 400', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send([
        { event: 'page_view' },
        { event: 'unknown_event' }
      ])

    expect(res.status).toBe(400)
    expect(mockLoggerInfo).not.toHaveBeenCalled()
  })
})
