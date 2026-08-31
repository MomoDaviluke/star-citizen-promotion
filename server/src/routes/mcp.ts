/**
 * @file MCP HTTP 路由
 * @description 将 MCP Server 以 Streamable HTTP 风格暴露：
 *              POST /api/v1/mcp 接收 JSON-RPC 2.0 请求（initialize / tools/list / tools/call）。
 *              外部 MCP 客户端（Claude Desktop、Cursor 等）可直接对接；
 *              内部 Agent 走 InProcessTransport 不经此端点。
 * @module server/routes/mcp
 */

import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { McpServer } from '../mcp/mcpServer.js'
import { JsonRpcErrorCode, type JsonRpcRequest, type JsonRpcResponse } from '../mcp/types.js'

export interface McpRouterDeps {
  mcpServer: McpServer
}

/**
 * MCP 限流器
 * @description inline 定义以满足 CodeQL 静态分析(SEC-12)；30 次/分钟/IP
 */
const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'MCP 请求过于频繁,请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

export function createMcpRouter(deps: McpRouterDeps): Router {
  const router = Router()

  /**
   * GET /api/v1/mcp
   * 服务端点发现（非 MCP 规范要求，便于调试与探活）
   */
  router.get('/', (_req: Request, res: Response) => {
    res.json({
      server: 'stellar-nexus-mcp',
      transport: 'http-json-rpc',
      usage: 'POST JSON-RPC 2.0 请求到此端点: initialize / tools/list / tools/call',
    })
  })

  /**
   * POST /api/v1/mcp
   * JSON-RPC 2.0 单请求入口
   */
  router.post('/', mcpLimiter, async (req: Request, res: Response) => {
    const body = req.body as JsonRpcRequest | undefined

    // 防御:body 缺失或非对象 → 返回协议错误(HTTP 200,JSON-RPC 错误在 body 中)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      const errorRes: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: JsonRpcErrorCode.INVALID_REQUEST,
          message: '请求体必须是 JSON-RPC 2.0 对象',
        },
      }
      res.status(400).json(errorRes)
      return
    }

    try {
      const result = await deps.mcpServer.handleRequest(body)
      res.json(result)
    } catch (err) {
      // handleRequest 内部已兜底,此处防御序列化等意外
      console.error('[MCP /mcp] Error:', err)
      const errorRes: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: {
          code: JsonRpcErrorCode.INTERNAL_ERROR,
          message: 'MCP 服务内部错误',
        },
      }
      res.status(500).json(errorRes)
    }
  })

  return router
}
