import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { createAiRouter } from '../../src/routes/ai.js'

describe('AI 路由', () => {
  let app: express.Application
  let mockRagService: any

  beforeEach(() => {
    mockRagService = {
      query: jest.fn().mockResolvedValue({ content: '回答', sources: [] }),
    }
    app = express()
    app.use(express.json())
    app.use('/api/v1/ai', createAiRouter({ ragService: mockRagService }))
  })

  it('GET /health 应返回 AI 服务状态', async () => {
    const res = await request(app).get('/api/v1/ai/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body).toHaveProperty('providers')
  })

  it('POST /retrieve 应返回检索结果', async () => {
    const res = await request(app)
      .post('/api/v1/ai/retrieve')
      .send({ question: '如何加入?' })
    expect(res.status).toBe(200)
    expect(res.body.content).toBe('回答')
    expect(mockRagService.query).toHaveBeenCalledWith(expect.objectContaining({ question: '如何加入?' }))
  })

  it('POST /retrieve 缺少 question 应返回 400', async () => {
    const res = await request(app).post('/api/v1/ai/retrieve').send({})
    expect(res.status).toBe(400)
  })
})

describe('AI 招募官路由', () => {
  let app: express.Application
  let mockRecruiterService: any
  let mockRagService: any

  beforeEach(() => {
    mockRagService = {
      query: jest.fn().mockResolvedValue({ content: '回答', sources: [] }),
    }
    mockRecruiterService = {
      initSession: jest.fn().mockResolvedValue({ sessionId: 'recruiter:test', welcome: '欢迎' }),
      chatStream: async function* () { yield 'hi' },
      getSuggestions: jest.fn().mockResolvedValue({ suggestions: ['如何加入?'] }),
      sessionStore: { getSession: jest.fn().mockResolvedValue({ profile: { playStyle: [] }, turnCount: 0 }) },
    }
    app = express()
    app.use(express.json())
    app.use('/api/v1/ai', createAiRouter({ ragService: mockRagService, recruiterService: mockRecruiterService }))
  })

  it('POST /recruiter/session 应创建会话', async () => {
    const res = await request(app).post('/api/v1/ai/recruiter/session')
    expect(res.status).toBe(200)
    expect(res.body.sessionId).toBe('recruiter:test')
  })

  it('POST /recruiter/chat 缺少 sessionId 应返回 400', async () => {
    const res = await request(app).post('/api/v1/ai/recruiter/chat').send({ message: 'hi' })
    expect(res.status).toBe(400)
  })

  it('POST /recruiter/chat 缺少 message 应返回 400', async () => {
    const res = await request(app).post('/api/v1/ai/recruiter/chat').send({ sessionId: 'x' })
    expect(res.status).toBe(400)
  })

  it('POST /recruiter/chat 消息过长应返回 400', async () => {
    const res = await request(app).post('/api/v1/ai/recruiter/chat').send({
      sessionId: 'x',
      message: 'a'.repeat(501),
    })
    expect(res.status).toBe(400)
  })

  it('GET /recruiter/suggest 应返回推荐问题', async () => {
    const res = await request(app).get('/api/v1/ai/recruiter/suggest?sessionId=test')
    expect(res.status).toBe(200)
    expect(res.body.suggestions).toBeInstanceOf(Array)
  })

  it('GET /recruiter/suggest 缺少 sessionId 应返回 400', async () => {
    const res = await request(app).get('/api/v1/ai/recruiter/suggest')
    expect(res.status).toBe(400)
  })
})
