import { describe, it, expect } from '@jest/globals'
import { McpServer } from '../../src/mcp/mcpServer.js'
import { createToolRegistry, type McpToolDeps } from '../../src/mcp/tools.js'
import { MCP_PROTOCOL_VERSION, textResult, type JsonRpcRequest } from '../../src/mcp/types.js'

function makeDeps(overrides: Partial<McpToolDeps> = {}): McpToolDeps {
  return {
    getShips: async () => ({
      ships: [],
      pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
    }),
    getFleetStats: async () => ({
      totalShips: 0,
      totalValue: 0,
      byCategory: {},
      byStatus: {},
    }),
    getEvents: async () => ({
      events: [],
      pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
    }),
    ...overrides,
  }
}

function makeServer(overrides: Partial<McpToolDeps> = {}): McpServer {
  return new McpServer(createToolRegistry(makeDeps(overrides)), {
    name: 'stellar-nexus-mcp',
    version: '1.0.0',
  })
}

const req = (method: string, params?: unknown, id: JsonRpcRequest['id'] = 1): JsonRpcRequest => ({
  jsonrpc: '2.0',
  id,
  method,
  params,
})

describe('MCP Server · initialize', () => {
  it('返回协议版本、能力与服务信息', async () => {
    const res = await makeServer().handleRequest(req('initialize'))
    expect(res.error).toBeUndefined()
    const result = res.result as { protocolVersion: string; serverInfo: { name: string } }
    expect(result.protocolVersion).toBe(MCP_PROTOCOL_VERSION)
    expect(result.serverInfo.name).toBe('stellar-nexus-mcp')
    expect(result.capabilities.tools.listChanged).toBe(false)
  })
})

describe('MCP Server · 通知与 ping', () => {
  it('notifications/initialized 幂等确认', async () => {
    const res = await makeServer().handleRequest(req('notifications/initialized'))
    expect(res.result).toEqual({})
  })

  it('ping 返回空结果', async () => {
    const res = await makeServer().handleRequest(req('ping'))
    expect(res.result).toEqual({})
  })
})

describe('MCP Server · tools/list', () => {
  it('返回全部工具定义', async () => {
    const res = await makeServer().handleRequest(req('tools/list'))
    const result = res.result as { tools: Array<{ name: string }> }
    expect(result.tools.map((t) => t.name).sort()).toEqual(['get_fleet_stats', 'query_events', 'query_fleet'])
  })
})

describe('MCP Server · tools/call', () => {
  it('执行工具并返回文本结果', async () => {
    const server = makeServer({
      getFleetStats: async () => ({
        totalShips: 7,
        totalValue: 100,
        byCategory: { fighter: 7 },
        byStatus: { active: 7 },
      }),
    })
    const res = await server.handleRequest(req('tools/call', { name: 'get_fleet_stats', arguments: {} }))

    expect(res.error).toBeUndefined()
    const result = res.result as { content: Array<{ text: string }>; isError?: boolean }
    expect(result.isError).toBeFalsy()
    expect(JSON.parse(result.content[0].text).totalShips).toBe(7)
  })

  it('arguments 缺省时按空对象执行', async () => {
    let called = false
    const server = makeServer({
      getFleetStats: async () => {
        called = true
        return { totalShips: 0, totalValue: 0, byCategory: {}, byStatus: {} }
      },
    })
    await server.handleRequest(req('tools/call', { name: 'get_fleet_stats' }))
    expect(called).toBe(true)
  })

  it('缺失 name → -32602', async () => {
    const res = await makeServer().handleRequest(req('tools/call', {}))
    expect(res.error?.code).toBe(-32602)
  })

  it('arguments 非对象 → -32602', async () => {
    const res = await makeServer().handleRequest(req('tools/call', { name: 'query_fleet', arguments: 'oops' }))
    expect(res.error?.code).toBe(-32602)
  })

  it('未知工具 → -32602 且带 available 列表', async () => {
    const res = await makeServer().handleRequest(req('tools/call', { name: 'not_exist', arguments: {} }))
    expect(res.error?.code).toBe(-32602)
    expect(res.error?.message).toContain('not_exist')
    const available = (res.error?.data as { available: string[] }).available
    expect(available).toContain('query_fleet')
  })

  it('工具执行抛错时 handler 已兜底,不会以 JSON-RPC error 形式泄漏', async () => {
    const server = makeServer({
      getShips: async () => {
        throw new Error('db down')
      },
    })
    const res = await server.handleRequest(req('tools/call', { name: 'query_fleet', arguments: {} }))
    expect(res.error).toBeUndefined()
    const result = res.result as { isError?: boolean; content: Array<{ text: string }> }
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('db down')
  })
})

describe('MCP Server · 协议健壮性', () => {
  it('未知方法 → -32601', async () => {
    const res = await makeServer().handleRequest(req('resources/list'))
    expect(res.error?.code).toBe(-32601)
  })

  it('缺失 jsonrpc 版本 → -32600', async () => {
    const res = await makeServer().handleRequest({ jsonrpc: '1.0', id: 1, method: 'ping' })
    expect(res.error?.code).toBe(-32600)
  })

  it('method 非字符串 → -32600', async () => {
    const res = await makeServer().handleRequest({ jsonrpc: '2.0', id: 1, method: 42 as unknown as string })
    expect(res.error?.code).toBe(-32600)
  })

  it('请求对象为 null → -32600 且 id 为 null', async () => {
    const res = await makeServer().handleRequest(null as unknown as JsonRpcRequest)
    expect(res.error?.code).toBe(-32600)
    expect(res.id).toBeNull()
  })

  it('响应 id 与请求 id 对应(含字符串 id)', async () => {
    const server = makeServer()
    const res = await server.handleRequest(req('ping', undefined, 'abc-123'))
    expect(res.id).toBe('abc-123')
  })

  it('textResult 辅助函数内容结构正确', () => {
    const r = textResult('ok')
    expect(r.content[0]).toEqual({ type: 'text', text: 'ok' })
  })
})
