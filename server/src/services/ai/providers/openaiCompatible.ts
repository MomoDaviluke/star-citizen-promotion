/**
 * @file OpenAI 兼容协议 Provider
 * @description 适配豆包、DeepSeek、通义千问、Ollama 等 OpenAI 兼容 API
 * @module server/services/ai/providers/openaiCompatible
 */

import type { LLMProvider, ChatMessage, ChatOpts, ChatResponse } from './types.js'
import { ProviderError } from './types.js'

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string
  private readonly baseURL: string
  private readonly apiKey: string

  constructor(name: string, baseURL: string, apiKey: string) {
    this.name = name
    this.baseURL = baseURL.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  async chat(messages: ChatMessage[], opts: ChatOpts = {}): Promise<ChatResponse> {
    const body = {
      model: opts.model || '',
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      stream: false,
    }
    const res = await this.request('/chat/completions', body, opts.signal)
    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      provider: this.name,
      model: body.model,
    }
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOpts = {}): AsyncGenerator<string, void, unknown> {
    const body = {
      model: opts.model || '',
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }
    const res = await this.request('/chat/completions', body, opts.signal)
    if (!res.body) throw new ProviderError('Stream body is null', this.name)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const payload = trimmed.slice(6)
        if (payload === '[DONE]') return
        try {
          const json = JSON.parse(payload)
          const token = json.choices?.[0]?.delta?.content
          if (token) yield token
        } catch {
          // 跳过格式错误的行
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const body = {
      model: '',
      input: texts,
    }
    const res = await this.request('/embeddings', body)
    const data = await res.json() as { data: Array<{ embedding: number[] }> }
    return data.data.map((item: { embedding: number[] }) => item.embedding)
  }

  private async request(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } }
      const message = err.error?.message || `HTTP ${res.status}`
      // 4xx(除 429)不可重试,5xx 和 429 可重试
      const retryable = res.status >= 500 || res.status === 429
      throw new ProviderError(message, this.name, res.status, retryable)
    }
    return res
  }
}
