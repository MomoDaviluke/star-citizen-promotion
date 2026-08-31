import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { createMcpRouter } from '../../src/routes/mcp.js'
import { McpServer } from '../../src/mcp/mcpServer.js'
import { createToolRegistry, type McpToolDeps } from '../../src/mcp/tools.js'

const deps: McpToolDeps = {
  getShips: async () => ({
    ships: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
  }),
  getFleetStats: async () => ({
    totalShips: 3,
    totalValue: 99,
    byCategory: { fighter: 3 },
    byStatus: { active: 3 },
  }),
  getEvents: async () => ({
    events: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
  }),
}

describe('MCP HTTP 路由', () => {
  let app: express.Application

  beforeEach(() => {
    const server = new McpServer(createToolRegistry(deps), { name: 'stellar-nexus-mcp', version: '1.0.0' })
    app = express()
    app.use(express.json())
    app.use('/api/v1/mcp', createMcpRouter({ mcpServer: server }))
  })

  it('GET / 返回端点发现信息', async () => {
    const res = await request(app).get('/api/v1/mcp')
    expect(res.status).toBe(200)
    expect(res.body.server).toBe('stellar-nexus-mcp')
    expect(res.body.transport).toBe('http-json-rpc')
  })

  it('POST initialize 握手成功', async () => {
    const res = await request(app)
      .post('/api/v1/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })

    expect(res.status).toBe(200)
    expect(res.body.jsonrpc).toBe('2.0')
    expect(res.body.result.serverInfo.name).toBe('stellar-nexus-mcp')
  })

  it('POST tools/list 返回工具清单', async () => {
    const res = await request(app)
      .post('/api/v1/mcp')
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })

    expect(res.status).toBe(200)
    expect(res.body.result.tools).toHaveLength(3)
  })

  it('POST tools/call 执行工具', async () => {
    const res = await request(app)
      .post('/api/v1/mcp')
      .send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_fleet_stats', arguments: {} } })

    expect(res.status).toBe(200)
    expect(res.body.result.isError).toBeFalsy()
    expect(JSON.parse(res.body.result.content[0].text).totalShips).toBe(3)
  })

  it('POST 未知方法 → -32601', async () => {
    const res = await request(app)
      .post('/api/v1/mcp')
      .send({ jsonrpc: '2.0', id: 4, method: 'resources/read' })

    expect(res.status).toBe(200)
    expect(res.body.error.code).toBe(-32601)
  })

  it('POST JSON 原始值字面量(字符串) → body-parser 直接 400(strict 模式拒绝原始值)', async () => {
    const res = await request(app)
      .post('/api/v1/mcp')
      .set('Content-Type', 'application/json')
      .send('"just a string"')
    expect(res.status).toBe(400)
  })

  it('POST 数组 body → HTTP 400', async () => {
    const res = await request(app).post('/api/v1/mcp').send([])
    expect(res.status).toBe(400)
  })
})
