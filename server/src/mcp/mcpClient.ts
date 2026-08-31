/**
 * @file MCP Client 实现
 * @description 面向 Agent 的 MCP 客户端：initialize 握手 → tools/list 发现 → tools/call 调用。
 *              传输层抽象为 McpTransport 接口：
 *              - InProcessTransport：进程内直连 McpServer（当前默认，零网络开销）
 *              - 未来可扩展 HttpTransport 连接独立 MCP 进程，Agent 代码不变
 * @module server/mcp/mcpClient
 */

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpCallToolResult,
  McpInitializeResult,
  McpToolDefinition,
} from './types.js'
import type { McpServer } from './mcpServer.js'

/** MCP 传输层抽象（JSON-RPC 请求/响应） */
export interface McpTransport {
  request(req: JsonRpcRequest): Promise<JsonRpcResponse>
}

/** 进程内传输：直连同进程的 McpServer 实例 */
export class InProcessTransport implements McpTransport {
  constructor(private server: McpServer) {}

  async request(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    return this.server.handleRequest(req)
  }
}

/** MCP 客户端调用异常（协议级错误，如 -32601/-32602） */
export class McpClientError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'McpClientError'
  }
}

export class McpClient {
  private initialized = false
  private initializeResult: McpInitializeResult | null = null
  private toolsCache: McpToolDefinition[] | null = null

  constructor(private transport: McpTransport) {}

  /**
   * initialize 握手（幂等，重复调用返回缓存结果）
   * @throws McpClientError 协议错误或传输失败
   */
  async initialize(): Promise<McpInitializeResult> {
    if (this.initialized && this.initializeResult) return this.initializeResult

    const response = await this.transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'stellar-nexus-agent', version: '1.0.0' },
      },
    })
    this.assertNoError(response)

    this.initializeResult = response.result as McpInitializeResult
    this.initialized = true
    return this.initializeResult
  }

  /**
   * 发现工具清单（带缓存，force=true 强制刷新）
   * 首次调用会自动完成 initialize 握手
   */
  async listTools(force = false): Promise<McpToolDefinition[]> {
    if (!force && this.toolsCache) return this.toolsCache

    await this.initialize()
    const response = await this.transport.request({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    })
    this.assertNoError(response)

    const result = response.result as { tools?: McpToolDefinition[] }
    this.toolsCache = Array.isArray(result?.tools) ? result.tools : []
    return this.toolsCache
  }

  /**
   * 调用工具
   * 注意：工具级业务错误（result.isError）不抛异常，原样返回由调用方（Agent）决定回填策略；
   *       协议级错误（未知工具/参数非法/传输失败）抛 McpClientError。
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<McpCallToolResult> {
    await this.initialize()
    const response = await this.transport.request({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name, arguments: args },
    })
    this.assertNoError(response)

    const result = response.result as McpCallToolResult
    if (!result || !Array.isArray(result.content)) {
      throw new McpClientError('tools/call 返回格式非法', -32603)
    }
    return result
  }

  /** 协议级错误统一转异常 */
  private assertNoError(response: JsonRpcResponse): void {
    if (response && response.error) {
      throw new McpClientError(response.error.message, response.error.code, response.error.data)
    }
  }
}
