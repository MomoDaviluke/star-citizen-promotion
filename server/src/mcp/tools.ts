/**
 * @file MCP 工具注册表
 * @description 将本地业务能力（舰队/活动/统计）封装为 MCP 工具。
 *              数据获取一律通过 deps 注入的 Service 层函数，不直接触达数据库：
 *              - 生产环境绑定 fleetService/eventService 的真实实现
 *              - 测试环境注入 stub，无需 MySQL
 *              handler 内自行做参数归一化与异常兜底，保证对 Server 层零抛出。
 * @module server/mcp/tools
 */

import type { FleetStats, PaginatedShips } from '../services/fleetService.js'
import type { PaginatedEvents } from '../services/eventService.js'
import { textResult, toolErrorResult, type McpCallToolResult, type McpToolDefinition } from './types.js'

/** 工具依赖（生产环境绑定 Service 层，测试注入 stub） */
export interface McpToolDeps {
  getShips: (opts: { category?: string; limit: number; offset: number }) => Promise<PaginatedShips>
  getFleetStats: () => Promise<FleetStats>
  getEvents: (opts: { startDate?: string; endDate?: string; status?: string; limit: number; offset: number }) => Promise<PaginatedEvents>
}

export interface RegisteredTool {
  definition: McpToolDefinition
  handler: (args: Record<string, unknown>) => Promise<McpCallToolResult>
}

export type McpToolRegistry = Map<string, RegisteredTool>

/** limit 参数安全钳制：1..maxLimit，非法值回落 defaultLimit */
export function clampLimit(value: unknown, defaultLimit: number, maxLimit: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || n <= 0) return defaultLimit
  return Math.min(Math.floor(n), maxLimit)
}

/** 从 unknown 中安全提取 string 字段（undefined/非 string → undefined） */
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/**
 * 查询舰队舰船
 * Agent 在用户询问舰船推荐、舰队配置时调用
 */
function createQueryFleetTool(deps: McpToolDeps): RegisteredTool {
  return {
    definition: {
      name: 'query_fleet',
      description: '查询战队舰队舰船列表。支持按类别（如 fighter/explorer/industrial）筛选，返回舰船名称、类别、状态与价值。',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: '舰船类别筛选，可选' },
          limit: { type: 'number', description: '返回数量上限，默认 5，最大 20' },
        },
      },
    },
    handler: async (args) => {
      try {
        const limit = clampLimit(args.limit, 5, 20)
        const category = optionalString(args.category)
        const result = await deps.getShips({ category, limit, offset: 0 })
        const summary = {
          total: result.pagination.total,
          ships: result.ships.map((s) => ({
            name: s.name,
            ship: s.ship,
            category: s.category,
            status: s.status,
            value: s.value,
          })),
        }
        return textResult(JSON.stringify(summary, null, 2))
      } catch (err) {
        return toolErrorResult(err instanceof Error ? err.message : String(err))
      }
    },
  }
}

/**
 * 查询舰队统计
 * Agent 在用户询问战队规模/实力概览时调用
 */
function createFleetStatsTool(deps: McpToolDeps): RegisteredTool {
  return {
    definition: {
      name: 'get_fleet_stats',
      description: '获取战队舰队统计概览：舰船总数、总价值、按类别与状态分布。无参数。',
      inputSchema: { type: 'object', properties: {} },
    },
    handler: async () => {
      try {
        const stats = await deps.getFleetStats()
        return textResult(JSON.stringify(stats, null, 2))
      } catch (err) {
        return toolErrorResult(err instanceof Error ? err.message : String(err))
      }
    },
  }
}

/**
 * 查询近期活动
 * Agent 在用户询问活动安排时调用，默认返回未来 14 天
 */
function createQueryEventsTool(deps: McpToolDeps): RegisteredTool {
  return {
    definition: {
      name: 'query_events',
      description: '查询战队近期活动列表，默认返回未来 14 天内的活动（标题、开始时间、地点、状态）。',
      inputSchema: {
        type: 'object',
        properties: {
          days: { type: 'number', description: '查询未来多少天内的活动，默认 14，最大 60' },
          limit: { type: 'number', description: '返回数量上限，默认 5，最大 20' },
        },
      },
    },
    handler: async (args) => {
      try {
        const days = clampLimit(args.days, 14, 60)
        const limit = clampLimit(args.limit, 5, 20)
        const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        const result = await deps.getEvents({
          startDate: new Date().toISOString(),
          endDate: end.toISOString(),
          limit,
          offset: 0,
        })
        const summary = {
          total: result.pagination.total,
          events: result.events.map((e) => ({
            title: e.title,
            start_time: e.start_time,
            location: e.location,
            status: e.status,
          })),
        }
        return textResult(JSON.stringify(summary, null, 2))
      } catch (err) {
        return toolErrorResult(err instanceof Error ? err.message : String(err))
      }
    },
  }
}

/** 构建工具注册表（固定 3 个只读工具，全部走 Service 层） */
export function createToolRegistry(deps: McpToolDeps): McpToolRegistry {
  const registry: McpToolRegistry = new Map()
  for (const tool of [
    createQueryFleetTool(deps),
    createFleetStatsTool(deps),
    createQueryEventsTool(deps),
  ]) {
    registry.set(tool.definition.name, tool)
  }
  return registry
}
