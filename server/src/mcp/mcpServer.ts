/**
 * @file MCP Server 实现
 * @description 处理 JSON-RPC 2.0 请求的核心分发器，支持 MCP 规范的方法子集：
 *              initialize / notifications/initialized / ping / tools/list / tools/call
 *              传输层无关：既可经 InProcessTransport 给内部 Agent 用，
 *              也可通过 HTTP 端点（POST /api/v1/mcp）暴露给外部 MCP 客户端。
 * @module server/mcp/mcpServer
 */

import {
  JsonRpcErrorCode,
  MCP_PROTOCOL_VERSION,
  type JsonRpcErrorObject,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpInitializeResult,
  type McpToolDefinition,
} from './types.js'
import type { McpToolRegistry } from './tools.js'

export interface McpServerInfo {
  name: string
  version: string
}

/** 已实现的方法白名单（notifications/initialized 是通知，仅确认不产错） */
const NOTIFICATION_METHODS = new Set(['notifications/initialized', 'notifications/cancelled'])

export class McpServer {
  constructor(
    private tools: McpToolRegistry,
    private info: McpServerInfo
  ) {}

  /** 列出全部工具定义（list 与 call 共用） */
  listTools(): McpToolDefinition[] {
    return [...this.tools.values()].map((t) => t.definition)
  }

  /**
   * 分发一个 JSON-RPC 请求
   * 约定：方法级错误走 JSON-RPC error（-32601/-32602）；
   *       工具执行级错误走 result.isError（MCP 规范，LLM 可读）。
   */
  async handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    // 请求骨架校验（jsonrpc 版本 + method）
    if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      return this.errorResponse(req?.id ?? null, {
        code: JsonRpcErrorCode.INVALID_REQUEST,
        message: '无效的 JSON-RPC 请求:缺少 jsonrpc:"2.0" 或 method',
      })
    }

    try {
      // initialize 握手
      if (req.method === 'initialize') {
        const result: McpInitializeResult = {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: this.info,
        }
        return { jsonrpc: '2.0', id: req.id, result }
      }

      // 通知类消息:幂等确认
      if (NOTIFICATION_METHODS.has(req.method)) {
        return { jsonrpc: '2.0', id: req.id, result: {} }
      }

      // 存活探测
      if (req.method === 'ping') {
        return { jsonrpc: '2.0', id: req.id, result: {} }
      }

      // 工具发现
      if (req.method === 'tools/list') {
        return { jsonrpc: '2.0', id: req.id, result: { tools: this.listTools() } }
      }

      // 工具调用
      if (req.method === 'tools/call') {
        return await this.handleToolCall(req)
      }

      // 未知方法
      return this.errorResponse(req.id, {
        code: JsonRpcErrorCode.METHOD_NOT_FOUND,
        message: `未知方法: ${req.method}`,
      })
    } catch (err) {
      return this.errorResponse(req.id, {
        code: JsonRpcErrorCode.INTERNAL_ERROR,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /** tools/call 参数校验与执行 */
  private async handleToolCall(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = req.params as { name?: unknown; arguments?: unknown } | undefined

    if (!params || typeof params !== 'object' || typeof params.name !== 'string') {
      return this.errorResponse(req.id, {
        code: JsonRpcErrorCode.INVALID_PARAMS,
        message: 'tools/call 需要 params.name (string)',
      })
    }

    const registered = this.tools.get(params.name)
    if (!registered) {
      return this.errorResponse(req.id, {
        code: JsonRpcErrorCode.INVALID_PARAMS,
        message: `未知工具: ${params.name}`,
        data: { available: this.listTools().map((t) => t.name) },
      })
    }

    // arguments 缺省为空对象;非对象视为协议错误
    let args: Record<string, unknown> = {}
    if (params.arguments !== undefined) {
      if (typeof params.arguments !== 'object' || params.arguments === null || Array.isArray(params.arguments)) {
        return this.errorResponse(req.id, {
          code: JsonRpcErrorCode.INVALID_PARAMS,
          message: 'arguments 必须是对象',
        })
      }
      args = params.arguments as Record<string, unknown>
    }

    // handler 自身兜底异常(理论上 handler 内已 catch,此处防御协议层崩溃)
    const result = await registered.handler(args)
    return { jsonrpc: '2.0', id: req.id, result }
  }

  private errorResponse(id: JsonRpcRequest['id'], error: JsonRpcErrorObject): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error }
  }
}
