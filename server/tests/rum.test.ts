/**
 * @file RUM 接收端点测试
 * @description 覆盖 /api/rum 指标上报接口的接收与验证逻辑
 */

import { describe, it, beforeAll, expect, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: mockLogger
}))

let app: express.Application

describe('RUM 接收接口', () => {
  beforeAll(async () => {
    app = express()
    app.use(express.json())

    const { default: rumRoutes } = await import('../src/routes/rum.js')
    app.use('/api/rum', rumRoutes)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /api/rum 单条指标应返回 204', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send({
        metric: 'LCP',
        value: 1200,
        rating: 'good',
        url: 'https://example.com/',
        userAgent: 'test-agent'
      })

    expect(response.status).toBe(204)
    expect(mockLogger.info).toHaveBeenCalled()
  })

  it('POST /api/rum 批量指标应返回 204', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send([
        { metric: 'LCP', value: 1200, rating: 'good' },
        { metric: 'CLS', value: 0.05, rating: 'good' }
      ])

    expect(response.status).toBe(204)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'RUM metric received',
      expect.objectContaining({ count: 2 })
    )
  })

  it('缺少 metric 字段应返回 400', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send({ value: 1200, rating: 'good' })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('缺少 value 字段应返回 400', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send({ metric: 'LCP', rating: 'good' })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('非数字 value 应返回 400', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send({ metric: 'LCP', value: 'slow', rating: 'poor' })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('非数组/对象请求体应返回 400', async () => {
    const response = await request(app)
      .post('/api/rum')
      .send('invalid')
      .set('Content-Type', 'text/plain')

    expect(response.status).toBe(400)
  })
})
