/**
 * @file Provider 工厂与路由
 * @description 根据 aiConfig 创建 provider 实例,提供降级链路由
 * @module server/services/ai/providers/index
 */

import { aiConfig } from '../../../config/ai.js'
import { OpenAICompatibleProvider } from './openaiCompatible.js'
import { AnthropicProvider } from './anthropic.js'
import type { LLMProvider } from './types.js'
import { ProviderError } from './types.js'

export type ProviderRegistry = Record<string, LLMProvider>

/**
 * 创建所有已配置 provider 的实例
 */
export function createProviders(): { providers: ProviderRegistry; registry: ProviderRegistry } {
  const registry: ProviderRegistry = {}
  for (const [name, cfg] of Object.entries(aiConfig.providers)) {
    if (!cfg.enabled) continue
    if (cfg.type === 'openai-compatible') {
      registry[name] = new OpenAICompatibleProvider(name, cfg.baseURL, cfg.apiKey)
    } else if (cfg.type === 'anthropic') {
      registry[name] = new AnthropicProvider(name, cfg.baseURL, cfg.apiKey)
    }
  }
  return { providers: registry, registry }
}

/**
 * 按顺序尝试 provider 列表,主 provider 失败(可重试)时切换到 fallback
 * 不可重试错误(4xx)立即抛出,不切换
 * @param chain provider 名称数组,如 ['doubao', 'deepseek', 'claude']
 * @param fn 要执行的调用函数
 */
export async function routeWithFallback<T>(
  registry: ProviderRegistry,
  chain: string[],
  fn: (provider: LLMProvider) => Promise<T>
): Promise<T> {
  let lastError: Error | null = null
  for (const name of chain) {
    const provider = registry[name]
    if (!provider) continue
    try {
      return await fn(provider)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // 不可重试错误(如 401/403)立即抛出,不切换
      if (err instanceof ProviderError && !err.retryable) {
        throw err
      }
      // 可重试错误,切换到下一个 provider
    }
  }
  throw lastError || new Error('No provider available in chain')
}

// 单例 registry(懒加载)
let _registry: ProviderRegistry | null = null
export function getRegistry(): ProviderRegistry {
  if (!_registry) {
    _registry = createProviders().registry
  }
  return _registry
}
