/**
 * @file 项目路由测试
 * @description 测试 /api/projects 路由的 CRUD 操作
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetProjects = jest.fn()
const mockGetProjectById = jest.fn()
const mockCreateProject = jest.fn()
const mockUpdateProject = jest.fn()
const mockDeleteProject = jest.fn()

jest.unstable_mockModule('../../src/services/projectService.js', () => ({
  getProjects: mockGetProjects,
  getProjectById: mockGetProjectById,
  createProject: mockCreateProject,
  updateProject: mockUpdateProject,
  deleteProject: mockDeleteProject
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

const { default: projectsRouter } = await import('../../src/routes/projects.js')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/projects', projectsRouter)
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || '服务器内部错误' })
  })
  return app
}

describe('GET /api/projects', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('应返回项目列表', async () => {
    mockGetProjects.mockResolvedValueOnce({
      projects: [{ id: 'p1', name: '星际探索', status: 'active' }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
    })

    const res = await request(app).get('/api/projects')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.pagination.total).toBe(1)
  })

  it('应支持 status 筛选', async () => {
    mockGetProjects.mockResolvedValueOnce({ projects: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })

    await request(app).get('/api/projects?status=completed')

    expect(mockGetProjects).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })
})

describe('GET /api/projects/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('有效 ID 应返回项目详情', async () => {
    mockGetProjectById.mockResolvedValueOnce({ id: 'p1', name: '星际探索' })

    const res = await request(app).get('/api/projects/p1')

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('星际探索')
  })

  it('不存在的 ID 应返回 404', async () => {
    mockGetProjectById.mockResolvedValueOnce(null)

    const res = await request(app).get('/api/projects/nonexistent')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/projects', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能创建项目', async () => {
    mockCreateProject.mockResolvedValueOnce({ id: 'p2', name: '新项目' })

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '新项目', description: '描述', status: 'planning' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('新项目')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '新项目' })

    expect(res.status).toBe(401)
  })

  it('缺少名称应返回 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer valid-token')
      .send({ description: '描述' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/projects/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能更新项目', async () => {
    mockUpdateProject.mockResolvedValueOnce({ id: 'p1', name: '更新项目' })

    const res = await request(app)
      .put('/api/projects/p1')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: '更新项目' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('更新项目')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app)
      .put('/api/projects/p1')
      .send({ name: '更新' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/projects/:id', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
  })

  it('管理员应能删除项目', async () => {
    mockDeleteProject.mockResolvedValueOnce(undefined)

    const res = await request(app)
      .delete('/api/projects/p1')
      .set('Authorization', 'Bearer valid-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('项目删除成功')
  })

  it('无令牌应返回 401', async () => {
    const res = await request(app).delete('/api/projects/p1')

    expect(res.status).toBe(401)
  })
})