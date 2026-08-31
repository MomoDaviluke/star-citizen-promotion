import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { createAiRouter } from '../../src/routes/ai.js'
import type { AgentStreamEvent } from '../../src/services/ai/mcpAgentService.js'

describe('AI Agent 路由', () => {
  let app: express.Application
  let mockAgentService: { chatStream: (message: string, history: unknown[]) => AsyncGenerator<AgentStreamEvent, void, unknown> }

  function buildApp(withAgent: boolean): express.Application {
    const app = express()
    app.use(express.json())
    app.use(
      '/api/v1/ai',
      createAiRouter({
        ragService: { query: jest.fn() } as never,
        ...(withAgent ? { agentService: mockAgentService as never } : {}),
      })
    )
    return app
  }

  beforeEach(() => {
    async function* stream(): AsyncGenerator<AgentStreamEvent, void, unknown> {
      yield { type: 'tool_call', toolCall: { name: 'query_fleet', arguments: {}, ok: true, resultPreview: '{}' } }
      yield { type: 'token', content: '推荐' }
      yield { type: 'token', content: 'Gladius' }
    }
    mockAgentService = { chatStream: jest.fn().mockImplementation(stream) }
  })

  it('未注入 agentService → 503', async () => {
    const res = await request(buildApp(false)).post('/api/v1/ai/agent/chat').send({ message: 'hi' })
    expect(res.status).toBe(503)
  })

  it('缺少 message → 400', async () => {
    const res = await request(buildApp(true)).post('/api/v1/ai/agent/chat').send({})
    expect(res.status).toBe(400)
  })

  it('message 超过 500 字 → 400', async () => {
    const res = await request(buildApp(true))
      .post('/api/v1/ai/agent/chat')
      .send({ message: 'x'.repeat(501) })
    expect(res.status).toBe(400)
  })

  it('SSE 事件序列:tool_call → token → metadata → done', async () => {
    const res = await request(buildApp(true))
      .post('/api/v1/ai/agent/chat')
      .send({ message: '推荐一艘战斗机', history: [{ role: 'user', content: '你好' }] })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    expect(res.text).toContain('event: tool_call')
    expect(res.text).toContain('query_fleet')
    expect(res.text).toContain('event: token')
    expect(res.text).toContain('推荐')
    expect(res.text).toContain('Gladius')
    expect(res.text).toContain('event: metadata')
    expect(res.text).toContain('event: done')
    // 传给 Agent 的 history 已过滤为合法结构
    const call = (mockAgentService.chatStream as unknown as ReturnType<typeof jest.fn>).mock.calls[0]
    expect(call[0]).toBe('推荐一艘战斗机')
    expect(call[1]).toEqual([{ role: 'user', content: '你好' }])
  })

  it('history 非法条目被过滤且最多保留 12 条', async () => {
    const badHistory = [
      { role: 'system', content: 'hack' }, // 非法 role → 过滤
      { role: 'user' },                    // 缺 content → 过滤
      ...Array.from({ length: 20 }, (_, i) => ({ role: 'user', content: `msg-${i}` })),
    ]
    await request(buildApp(true)).post('/api/v1/ai/agent/chat').send({ message: 'hi', history: badHistory })

    const call = (mockAgentService.chatStream as unknown as ReturnType<typeof jest.fn>).mock.calls[0]
    expect(call[1].length).toBe(12)
    expect(call[1][0].content).toBe('msg-8') // 保留最后 12 条
  })

  it('Agent 流中断 → error 事件', async () => {
    async function* broken(): AsyncGenerator<AgentStreamEvent, void, unknown> {
      yield { type: 'token', content: '部分' }
      throw new Error('llm boom')
    }
    mockAgentService.chatStream = jest.fn().mockImplementation(broken)

    const res = await request(buildApp(true)).post('/api/v1/ai/agent/chat').send({ message: 'hi' })
    expect(res.status).toBe(200)
    expect(res.text).toContain('event: error')
  })
})
