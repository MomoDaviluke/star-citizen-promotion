/**
 * @file Anthropic Claude Provider
 * @description 适配 Anthropic Messages API
 * @module server/services/ai/providers/anthropic
 */

import type { LLMProvider, ChatMessage, ChatOpts, ChatResponse } from './types.js'
import { ProviderError } from './types.js'

export class AnthropicProvider implements LLMProvider {
  readonly name: string
  private readonly baseURL: string
  private readonly apiKey: string
  private readonly anthropicVersion = '2023-06-01'

  constructor(name: string, baseURL: string, apiKey: string) {
    this.name = name
    this.baseURL = baseURL.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  async chat(messages: ChatMessage[], opts: ChatOpts = {}): Promise<ChatResponse> {
    const { system, userMessages } = this.transformMessages(messages)
    const body = {
      model: opts.model || 'claude-sonnet-4-5-20250929',
      system,
      messages: userMessages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      stream: false,
    }
    const res = await this.request('/v1/messages', body, opts.signal)
    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const text = data.content
      ?.filter((c: { type: string }) => c.type === 'text')
      .map((c: { text?: string }) => c.text || '')
      .join('') || ''
    return {
      content: text,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      provider: this.name,
      model: body.model,
    }
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOpts = {}): AsyncGenerator<string, void, unknown> {
    const { system, userMessages } = this.transformMessages(messages)
    const body = {
      model: opts.model || 'claude-sonnet-4-5-20250929',
      system,
      messages: userMessages,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }
    const res = await this.request('/v1/messages', body, opts.signal)
    if (!res.body) throw new ProviderError('Stream body is null', this.name)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      for (const evt of events) {
        // SSE 事件块可能包含多行(event: / data:),查找 data: 行
        const dataLine = evt.split('\n').find(l => l.trim().startsWith('data: '))
        if (!dataLine) continue
        try {
          const json = JSON.parse(dataLine.trim().slice(6)) as {
            type?: string
            delta?: { type?: string; text?: string }
          }
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield json.delta.text
          }
          if (json.type === 'message_stop') return
        } catch {
          // 跳过格式错误的行
        }
      }
    }
  }

  async embed(_texts: string[]): Promise<number[][]> {
    // Anthropic 无 embedding API,需要用其他 provider
    throw new ProviderError(
      'Anthropic 不支持 embedding,请配置 OpenAI 兼容 provider 用于 embedding',
      this.name,
      undefined,
      false
    )
  }

  /**
   * 将 OpenAI 格式 messages 转换为 Anthropic 格式
   * Anthropic 要求 system 单独传,其余 messages 必须是 user/assistant 交替
   */
  private transformMessages(messages: ChatMessage[]): {
    system: string
    userMessages: { role: string; content: string }[]
  } {
    const systemParts = messages.filter(m => m.role === 'system').map(m => m.content)
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))
    return { system: systemParts.join('\n\n'), userMessages }
  }

  private async request(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.anthropicVersion,
      },
      body: JSON.stringify(body),
      signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } }
      const message = err.error?.message || `HTTP ${res.status}`
      const retryable = res.status >= 500 || res.status === 429
      throw new ProviderError(message, this.name, res.status, retryable)
    }
    return res
  }
}
