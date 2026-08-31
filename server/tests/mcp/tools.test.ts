import { describe, it, expect } from '@jest/globals'
import { createToolRegistry, clampLimit, type McpToolDeps } from '../../src/mcp/tools.js'
import { textResult } from '../../src/mcp/types.js'

function makeDeps(overrides: Partial<McpToolDeps> = {}): McpToolDeps {
  return {
    getShips: async () => ({
      ships: [
        {
          id: 's1',
          name: 'STL-001',
          callsign: null,
          ship: 'Mercury Star Runner',
          category: 'industrial',
          status: 'active',
          value: 3500000,
          image: null,
          description: null,
        },
      ],
      pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
    }),
    getFleetStats: async () => ({
      totalShips: 12,
      totalValue: 42000000,
      byCategory: { fighter: 6, industrial: 3, explorer: 3 },
      byStatus: { active: 10, maintenance: 2 },
    }),
    getEvents: async () => ({
      events: [
        {
          id: 'e1',
          title: '周末编队巡逻',
          description: null,
          start_time: '2026-09-05T19:00:00.000Z',
          end_time: null,
          location: 'Stanton',
          status: 'open',
          creator_id: null,
        },
      ],
      pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
    }),
    ...overrides,
  }
}

describe('MCP 工具注册表', () => {
  it('注册 3 个只读工具,定义齐全', () => {
    const registry = createToolRegistry(makeDeps())
    expect([...registry.keys()].sort()).toEqual(['get_fleet_stats', 'query_events', 'query_fleet'])

    for (const tool of registry.values()) {
      expect(tool.definition.name).toBeTruthy()
      expect(tool.definition.description).toBeTruthy()
      expect(tool.definition.inputSchema.type).toBe('object')
      expect(typeof tool.handler).toBe('function')
    }
  })

  it('query_fleet 返回舰船摘要(JSON 含名称与类别)', async () => {
    const registry = createToolRegistry(makeDeps())
    const result = await registry.get('query_fleet')!.handler({})

    expect(result.isError).toBeFalsy()
    const text = result.content[0].text
    const parsed = JSON.parse(text)
    expect(parsed.total).toBe(1)
    expect(parsed.ships[0].ship).toBe('Mercury Star Runner')
    expect(parsed.ships[0].category).toBe('industrial')
  })

  it('query_fleet 传递 category 筛选并钳制 limit', async () => {
    let captured: { category?: string; limit: number } | null = null
    const deps = makeDeps({
      getShips: async (opts) => {
        captured = opts
        return { ships: [], pagination: { total: 0, limit: opts.limit, offset: 0, hasMore: false } }
      },
    })
    const registry = createToolRegistry(deps)
    await registry.get('query_fleet')!.handler({ category: ' fighter ', limit: 999 })

    expect(captured!.category).toBe('fighter')
    expect(captured!.limit).toBe(20) // 999 → 钳到上限 20
  })

  it('get_fleet_stats 返回统计概览', async () => {
    const registry = createToolRegistry(makeDeps())
    const result = await registry.get('get_fleet_stats')!.handler({})

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.totalShips).toBe(12)
    expect(parsed.byCategory.fighter).toBe(6)
  })

  it('query_events 默认查询未来 14 天', async () => {
    let captured: { startDate?: string; endDate?: string } | null = null
    const deps = makeDeps({
      getEvents: async (opts) => {
        captured = opts
        return { events: [], pagination: { total: 0, limit: opts.limit, offset: 0, hasMore: false } }
      },
    })
    const registry = createToolRegistry(deps)
    await registry.get('query_events')!.handler({})

    expect(captured!.startDate).toBeTruthy()
    expect(captured!.endDate).toBeTruthy()
    const spanDays =
      (new Date(captured!.endDate!).getTime() - new Date(captured!.startDate!).getTime()) / (24 * 3600 * 1000)
    expect(spanDays).toBeCloseTo(14, 5)
  })

  it('Service 抛错时 handler 收敛为 isError 结果而非抛出', async () => {
    const deps = makeDeps({
      getShips: async () => {
        throw new Error('数据库连接失败')
      },
      getFleetStats: async () => {
        throw new Error('boom')
      },
    })
    const registry = createToolRegistry(deps)

    const fleetResult = await registry.get('query_fleet')!.handler({})
    expect(fleetResult.isError).toBe(true)
    expect(fleetResult.content[0].text).toContain('数据库连接失败')

    const statsResult = await registry.get('get_fleet_stats')!.handler({})
    expect(statsResult.isError).toBe(true)
    expect(statsResult.content[0].text).toContain('boom')
  })
})

describe('clampLimit', () => {
  it('非法值回落默认值', () => {
    expect(clampLimit(undefined, 5, 20)).toBe(5)
    expect(clampLimit('abc', 5, 20)).toBe(5)
    expect(clampLimit(-3, 5, 20)).toBe(5)
    expect(clampLimit(0, 5, 20)).toBe(5)
    expect(clampLimit(Number.NaN, 5, 20)).toBe(5)
  })

  it('超上限钳制、正小数取整、正常值透传', () => {
    expect(clampLimit(999, 5, 20)).toBe(20)
    expect(clampLimit(3.7, 5, 20)).toBe(3)
    expect(clampLimit(10, 5, 20)).toBe(10)
    expect(clampLimit('7', 5, 20)).toBe(7) // 数字字符串可解析
  })
})

describe('textResult / 工具错误', () => {
  it('textResult 构造单文本内容', () => {
    const r = textResult('hello')
    expect(r.content).toEqual([{ type: 'text', text: 'hello' }])
    expect(r.isError).toBeFalsy()
  })
})
