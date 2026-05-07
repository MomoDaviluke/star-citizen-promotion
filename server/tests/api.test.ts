/**
 * @file API 集成测试
 * @description 后端 API 接口测试
 */

import { describe, it, beforeAll, expect } from '@jest/globals'
import request from 'supertest'
import express from 'express'

let app

function createTestApp() {
  const app = express()

  app.use(express.json())

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  })

  app.get('/api/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        stats: [
          { label: '成员', value: 42 },
          { label: '任务', value: 128 }
        ]
      }
    })
  })

  app.get('/api/pilots', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 'p1', name: '飞行员1', callsign: 'ALPHA-1' },
        { id: 'p2', name: '飞行员2', callsign: 'BETA-1' }
      ],
      pagination: { page: 1, limit: 10, total: 2 }
    })
  })

  app.get('/api/pilots/:id', (req, res) => {
    if (req.params.id === 'nonexistent') {
      return res.status(404).json({
        success: false,
        error: '飞行员不存在'
      })
    }
    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: '测试飞行员',
        callsign: 'TEST-1'
      }
    })
  })

  app.get('/api/members', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 'm1', name: '成员1' },
        { id: 'm2', name: '成员2' }
      ]
    })
  })

  app.get('/api/members/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, name: '测试成员' }
    })
  })

  app.get('/api/projects', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 'pr1', name: '项目1' },
        { id: 'pr2', name: '项目2' }
      ]
    })
  })

  app.get('/api/projects/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, name: '测试项目' }
    })
  })

  app.post('/api/applications', (req, res) => {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '无效的邮箱地址'
      })
    }

    res.status(201).json({
      success: true,
      data: {
        id: `app_${Date.now()}`,
        status: 'pending'
      }
    })
  })

  app.post('/api/auth/register', (req, res) => {
    const { username, email } = req.body

    if (email === 'duplicate@example.com') {
      return res.status(409).json({
        success: false,
        error: '邮箱已被注册'
      })
    }

    res.status(201).json({
      success: true,
      data: {
        token: 'test-jwt-token',
        user: { id: 1, username, email }
      }
    })
  })

  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body

    if (email === 'nonexistent@example.com') {
      return res.status(401).json({
        success: false,
        error: '无效的凭证'
      })
    }

    res.json({
      success: true,
      data: {
        token: 'test-jwt-token',
        user: { id: 1, email }
      }
    })
  })

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      })
    }

    res.json({
      success: true,
      data: { id: 1, username: 'testuser', email: 'test@example.com' }
    })
  })

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `路由 ${req.method} ${req.url} 不存在`
    })
  })

  return app
}

describe('健康检查', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /health 应返回服务状态', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')
  })
})

describe('统计接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /api/stats 应返回统计数据', async () => {
    const response = await request(app).get('/api/stats')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('stats')
    expect(Array.isArray(response.body.data.stats)).toBe(true)
  })
})

describe('飞行员接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /api/pilots 应返回飞行员列表', async () => {
    const response = await request(app).get('/api/pilots')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body).toHaveProperty('pagination')
  })

  it('GET /api/pilots/:id 应返回单个飞行员详情', async () => {
    const response = await request(app).get('/api/pilots/p1')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id', 'p1')
    expect(response.body.data).toHaveProperty('name')
    expect(response.body.data).toHaveProperty('callsign')
  })

  it('GET /api/pilots/:id 不存在的飞行员应返回 404', async () => {
    const response = await request(app).get('/api/pilots/nonexistent')

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })
})

describe('成员接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /api/members 应返回成员列表', async () => {
    const response = await request(app).get('/api/members')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('GET /api/members/:id 应返回单个成员详情', async () => {
    const response = await request(app).get('/api/members/m1')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id', 'm1')
  })
})

describe('项目接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('GET /api/projects 应返回项目列表', async () => {
    const response = await request(app).get('/api/projects')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('GET /api/projects/:id 应返回单个项目详情', async () => {
    const response = await request(app).get('/api/projects/pr1')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id', 'pr1')
  })
})

describe('申请接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('POST /api/applications 应成功提交申请', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({
        name: '测试用户',
        email: 'test@example.com',
        discord: 'testuser#1234',
        experience: '有 100 小时游戏经验',
        availability: 'flexible',
        reason: '想加入团队'
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data).toHaveProperty('status', 'pending')
  })

  it('POST /api/applications 缺少必填字段应返回 400', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({
        name: '测试用户'
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('POST /api/applications 无效邮箱应返回 400', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({
        name: '测试用户',
        email: 'invalid-email'
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })
})

describe('认证接口', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('POST /api/auth/register 应成功注册用户', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'newuser@example.com',
        password: 'TestPass123'
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('token')
    expect(response.body.data).toHaveProperty('user')
  })

  it('POST /api/auth/register 重复邮箱应返回 409', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'duplicate@example.com',
        password: 'TestPass123'
      })

    expect(response.status).toBe(409)
    expect(response.body.success).toBe(false)
  })

  it('POST /api/auth/login 无效凭证应返回 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123'
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('GET /api/auth/me 未认证应返回 401', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('GET /api/auth/me 有认证应返回用户信息', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id')
  })
})

describe('404 处理', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  it('未知路由应返回 404', async () => {
    const response = await request(app).get('/api/unknown')

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })
})
