/**
 * @file LLM Service
 * @description 统一 LLM 调用入口:缓存 + 降级链 + 限流
 * @module server/services/ai/llmService
 */

import { createHash } from 'node:crypto'
import { aiConfig } from '../../config/ai.js'
import { routeWithFallback, type ProviderRegistry } from './providers/index.js'
import type { ChatMessage, ChatOpts, ChatResponse } from './providers/types.js'

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttl?: number): Promise<void>
}

export class LlmService {
  constructor(
    private registry: ProviderRegistry,
    private cache: CacheAdapter
  ) {}

  async chat(messages: ChatMessage[], opts: ChatOpts = {}): Promise<ChatResponse> {
    const cacheKey = this.cacheKey(messages, opts)
    // 尝试缓存
    const cached = await this.cache.get<ChatResponse>(cacheKey).catch(() => null)
    if (cached) return cached

    // 调用 provider(带降级)
    const chain = [aiConfig.routing.chat.primary, ...aiConfig.routing.chat.fallback]
    const result = await routeWithFallback(this.registry, chain, (provider) =>
      provider.chat(messages, { ...opts, model: opts.model || aiConfig.models.chat })
    )

    // 写入缓存(失败不影响主流程)
    await this.cache.set(cacheKey, result, aiConfig.cacheTtl).catch(() => {})

    return result
  }

  async *chatStream(messages: ChatMessage[], opts: ChatOpts = {}): AsyncGenerator<string, void, unknown> {
    // 流式不缓存(无法缓存 stream)
    const chain = [aiConfig.routing.chatStream.primary, ...aiConfig.routing.chatStream.fallback]
    const generator = await routeWithFallback(this.registry, chain, (provider) =>
      Promise.resolve(provider.chatStream(messages, { ...opts, model: opts.model || aiConfig.models.chatStream }))
    )
    yield* generator
  }

  private cacheKey(messages: ChatMessage[], opts: ChatOpts): string {
    const model = opts.model || aiConfig.models.chat
    const content = messages.map((m) => `${m.role}:${m.content}`).join('|')
    // temperature/maxTokens/routingHint 会影响 LLM 输出,必须参与 cacheKey
    // signal 不参与(不影响结果且不可序列化)
    const extra = `${opts.temperature ?? ''}:${opts.maxTokens ?? ''}:${opts.routingHint ?? ''}`
    const hash = createHash('sha256').update(`${model}:${content}:${extra}`).digest('hex').slice(0, 32)
    return `llm:chat:${model}:${hash}`
  }
}
