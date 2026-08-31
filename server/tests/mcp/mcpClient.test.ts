import { describe, it, expect } from '@jest/globals'
import { McpClient, InProcessTransport, McpClientError } from '../../src/mcp/mcpClient.js'
import { McpServer } from '../../src/mcp/mcpServer.js'
import { createToolRegistry, type McpToolDeps } from '../../src/mcp/tools.js'
import type { JsonRpcRequest, JsonRpcResponse } from '../../src/mcp/types.js'

const deps: McpToolDeps = {
  getShips: async () => ({
    ships: [
      {
        id: 's1',
        name: 'STL-001',
        callsign: null,
        ship: 'Gladius',
        category: 'fighter',
        status: 'active',
        value: 1000000,
        image: null,
        description: null,
      },
    ],
    pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
  }),
  getFleetStats: async () => ({ totalShips: 1, totalValue: 1000000, byCategory: {}, byStatus: {} }),
  getEvents: async () => ({ events: [], pagination: { total: 0, limit: 5, offset: 0, hasMore: false } }),
}

function makeClient(): McpClient {
  const server = new McpServer(createToolRegistry(deps), { name: 'test-server', version: '0.0.1' })
  return new McpClient(new InProcessTransport(server))
}

describe('MCP Client · InProcess 全链路', () => {
  it('initialize → listTools → callTool 走通', async () => {
    const client = makeClient()

    const info = await client.initialize()
    expect(info.serverInfo.name).toBe('test-server')

    const tools = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['get_fleet_stats', 'query_events', 'query_fleet'])

    const result = await client.callTool('query_fleet', { limit: 5 })
    expect(result.isError).toBeFalsy()
    expect(JSON.parse(result.content[0].text).ships[0].ship).toBe('Gladius')
  })

  it('listTools 结果缓存(force 刷新前只发一次)', async () => {
    const client = makeClient()
    const first = await client.listTools()
    const second = await client.listTools()
    expect(second).toBe(first) // 同一引用 → 命中缓存

    const refreshed = await client.listTools(true)
    expect(refreshed).not.toBe(first)
  })

  it('initialize 幂等,重复调用返回同一结果', async () => {
    const client = makeClient()
    const a = await client.initialize()
    const b = await client.initialize()
    expect(b).toBe(a)
  })

  it('listTools 自动完成 initialize 握手(未显式初始化也可调用)', async () => {
    const client = makeClient()
    const tools = await client.listTools() // 跳过 initialize
    expect(tools.length).toBeGreaterThan(0)
  })

  it('工具级错误(isError)不抛异常,原样返回', async () => {
    const failingDeps: McpToolDeps = {
      ...deps,
      getFleetStats: async () => {
        throw new Error('stats unavailable')
      },
    }
    const server = new McpServer(createToolRegistry(failingDeps), { name: 't', version: '0' })
    const client = new McpClient(new InProcessTransport(server))

    const result = await client.callTool('get_fleet_stats')
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('stats unavailable')
  })

  it('协议错误(未知工具)抛 McpClientError', async () => {
    const client = makeClient()
    await expect(client.callTool('no_such_tool')).rejects.toThrow(McpClientError)
    await expect(client.callTool('no_such_tool')).rejects.toMatchObject({ code: -32602 })
  })

  it('result 格式非法时抛 McpClientError(-32603)', async () => {
    const brokenTransport = {
      request: async (req: JsonRpcRequest): Promise<JsonRpcResponse> => {
        if (req.method === 'tools/call') return { jsonrpc: '2.0', id: req.id, result: { wrong: 'shape' } }
        return { jsonrpc: '2.0', id: req.id, result: {} }
      },
    }
    const client = new McpClient(brokenTransport)
    await expect(client.callTool('anything')).rejects.toMatchObject({ code: -32603 })
  })
})

describe('MCP Client · 自定义 Transport', () => {
  it('传输层抛错时异常向上传播', async () => {
    const failingTransport = {
      request: async (): Promise<JsonRpcResponse> => {
        throw new Error('ECONNREFUSED')
      },
    }
    const client = new McpClient(failingTransport)
    await expect(client.listTools()).rejects.toThrow('ECONNREFUSED')
  })

  it('协议错误响应转为 McpClientError', async () => {
    const errorTransport = {
      request: async (req: JsonRpcRequest): Promise<JsonRpcResponse> => ({
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: '未知方法: tools/list' },
      }),
    }
    const client = new McpClient(errorTransport)
    await expect(client.listTools()).rejects.toMatchObject({
      name: 'McpClientError',
      code: -32601,
    })
  })
})
