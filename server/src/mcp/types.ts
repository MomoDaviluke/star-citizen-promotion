/**
 * @file MCP 协议类型定义
 * @description Model Context Protocol 核心子集（基于 MCP 2024-11-05 规范）：
 *              JSON-RPC 2.0 消息结构 + initialize/tools 能力握手。
 *              仅实现本项目需要的工具调用子集，资源/采样等能力不涉及。
 * @module server/mcp/types
 */

/** MCP 协议版本（本实现支持的最新版本，initialize 时与客户端协商） */
export const MCP_PROTOCOL_VERSION = '2024-11-05'

/** JSON-RPC 2.0 标准错误码（MCP 复用） */
export const JsonRpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const

export type JsonRpcId = number | string | null

/** JSON-RPC 2.0 请求 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: JsonRpcId
  method: string
  params?: unknown
}

/** JSON-RPC 2.0 错误对象 */
export interface JsonRpcErrorObject {
  code: number
  message: string
  data?: unknown
}

/** JSON-RPC 2.0 响应（result 与 error 互斥） */
export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: JsonRpcId
  result?: unknown
  error?: JsonRpcErrorObject
}

/** 工具定义（inputSchema 为标准 JSON Schema） */
export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

/** MCP 工具返回内容（当前仅支持文本块） */
export interface McpTextContent {
  type: 'text'
  text: string
}

/** tools/call 执行结果 */
export interface McpCallToolResult {
  content: McpTextContent[]
  /** 工具级错误（协议成功但业务失败），LLM 应据此向用户解释 */
  isError?: boolean
}

/** initialize 握手结果 */
export interface McpInitializeResult {
  protocolVersion: string
  capabilities: {
    tools: { listChanged: boolean }
  }
  serverInfo: {
    name: string
    version: string
  }
}

/** 构造工具级错误结果（统一文案格式，便于 LLM 识别与测试断言） */
export function toolErrorResult(message: string): McpCallToolResult {
  return {
    content: [{ type: 'text', text: `工具执行失败: ${message}` }],
    isError: true,
  }
}

/** 构造文本结果 */
export function textResult(text: string): McpCallToolResult {
  return { content: [{ type: 'text', text }] }
}
