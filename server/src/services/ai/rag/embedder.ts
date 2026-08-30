/**
 * @file Embedder 服务
 * @description 调用 LLM Provider 生成文本向量,带降级链
 * @module server/services/ai/rag/embedder
 */

import { aiConfig } from '../../../config/ai.js'
import { routeWithFallback, type ProviderRegistry } from '../providers/index.js'
import { ProviderError } from '../providers/types.js'

export class Embedder {
  constructor(private registry: ProviderRegistry) {}

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text])
    return vectors[0]
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    const chain = [aiConfig.routing.embed.primary, ...aiConfig.routing.embed.fallback]
    try {
      return await routeWithFallback(this.registry, chain, async (provider) => {
        return provider.embed(texts)
      })
    } catch (err) {
      if (err instanceof ProviderError) {
        throw new ProviderError(
          `Embedding 失败: ${err.message}`,
          'embedder',
          err.statusCode,
          err.retryable
        )
      }
      throw new ProviderError(
        `Embedding 失败: ${(err as Error).message}`,
        'embedder',
        undefined,
        false
      )
    }
  }
}
