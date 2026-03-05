/**
 * @file API 测试
 * @description 后端 API 接口测试
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'

const API_BASE_URL = 'http://localhost:3001/api'

/**
 * 测试工具函数
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  return {
    status: response.status,
    data: await response.json()
  }
}

describe('健康检查', () => {
  it('GET /health 应返回服务状态', async () => {
    const response = await fetch('http://localhost:3001/health')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('uptime')
  })
})

describe('统计接口', () => {
  it('GET /api/stats 应返回统计数据', async () => {
    const { status, data } = await request('/stats')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('stats')
    expect(Array.isArray(data.data.stats)).toBe(true)
  })
})

describe('飞行员接口', () => {
  it('GET /api/pilots 应返回飞行员列表', async () => {
    const { status, data } = await request('/pilots')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('pagination')
  })

  it('GET /api/pilots/:id 应返回单个飞行员详情', async () => {
    const { status, data } = await request('/pilots/p1')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id', 'p1')
    expect(data.data).toHaveProperty('name')
    expect(data.data).toHaveProperty('callsign')
  })

  it('GET /api/pilots/:id 不存在的飞行员应返回 404', async () => {
    const { status, data } = await request('/pilots/nonexistent')

    expect(status).toBe(404)
    expect(data.success).toBe(false)
  })
})

describe('成员接口', () => {
  it('GET /api/members 应返回成员列表', async () => {
    const { status, data } = await request('/members')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('GET /api/members/:id 应返回单个成员详情', async () => {
    const { status, data } = await request('/members/m1')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id', 'm1')
  })
})

describe('项目接口', () => {
  it('GET /api/projects 应返回项目列表', async () => {
    const { status, data } = await request('/projects')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('GET /api/projects/:id 应返回单个项目详情', async () => {
    const { status, data } = await request('/projects/pr1')

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id', 'pr1')
  })
})

describe('申请接口', () => {
  it('POST /api/applications 应成功提交申请', async () => {
    const { status, data } = await request('/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户',
        email: 'test@example.com',
        discord: 'testuser#1234',
        experience: '有 100 小时游戏经验',
        availability: 'flexible',
        reason: '想加入团队'
      })
    })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
    expect(data.data).toHaveProperty('status', 'pending')
  })

  it('POST /api/applications 缺少必填字段应返回 400', async () => {
    const { status, data } = await request('/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户'
      })
    })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('POST /api/applications 无效邮箱应返回 400', async () => {
    const { status, data } = await request('/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户',
        email: 'invalid-email'
      })
    })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('认证接口', () => {
  it('POST /api/auth/register 应成功注册用户', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`
    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser${Date.now()}`,
        email: uniqueEmail,
        password: 'TestPass123'
      })
    })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('token')
    expect(data.data).toHaveProperty('user')
  })

  it('POST /api/auth/register 重复邮箱应返回 409', async () => {
    const { status: registerStatus } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser${Date.now()}`,
        email: 'duplicate@example.com',
        password: 'TestPass123'
      })
    })

    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser${Date.now() + 1}`,
        email: 'duplicate@example.com',
        password: 'TestPass123'
      })
    })

    expect(status).toBe(409)
    expect(data.success).toBe(false)
  })

  it('POST /api/auth/login 无效凭证应返回 401', async () => {
    const { status, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123'
      })
    })

    expect(status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('GET /api/auth/me 未认证应返回 401', async () => {
    const { status, data } = await request('/auth/me')

    expect(status).toBe(401)
    expect(data.success).toBe(false)
  })
})
