/**
 * @file LLM Provider 类型定义
 * @description 统一的 LLM 调用接口,所有 Provider 实现此接口
 * @module server/services/ai/providers/types
 */

export type UserRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: UserRole
  content: string
}

export type RoutingHint = 'cost' | 'quality' | 'cn'

export interface ChatOpts {
  model?: string
  temperature?: number
  maxTokens?: number
  routingHint?: RoutingHint
  signal?: AbortSignal
}

export interface ChatResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  provider: string
  model: string
}

/**
 * LLM Provider 统一接口
 * 所有 provider(OpenAI 兼容、Anthropic、Ollama)实现此接口
 */
export interface LLMProvider {
  readonly name: string

  /**
   * 同步聊天(等待完整响应)
   */
  chat(messages: ChatMessage[], opts?: ChatOpts): Promise<ChatResponse>

  /**
   * 流式聊天(逐 token 返回)
   * @yields 每个 token 的 content 字符串
   */
  chatStream(messages: ChatMessage[], opts?: ChatOpts): AsyncGenerator<string, void, unknown>

  /**
   * 生成文本的向量嵌入
   * @returns 向量数组,外层对应输入文本顺序
   */
  embed(texts: string[]): Promise<number[][]>
}

/**
 * Provider 错误类型
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = true
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}
