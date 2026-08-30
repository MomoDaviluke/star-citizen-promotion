/**
 * @file Provider 工厂与路由单元测试
 * @description 测试 createProviders 和 routeWithFallback
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import { ProviderError } from '../../../../src/services/ai/providers/types.js'

// aiConfig 在模块加载时读取 process.env,必须在动态 import 之前设置 env vars。
// (jest.unstable_mockModule 与 tsx 加载器不兼容,改用 env vars 预设方式)
//
// 槽位制(AI-SLOT): registry 键 = chat / embed / fallback / claude
// - chat 槽位配置 → 应出现在 registry
// - embed 槽位故意不配置 → 测试 enabled=false 的 provider 被跳过
// - CI/本地可能带真实 key(M1 验证用),测试前显式清掉防止意外 enabled
process.env.LLM_CHAT_API_KEY = 'sk-chat-slot'
process.env.LLM_CHAT_BASE_URL = 'https://chat.test/v1'
process.env.ANTHROPIC_API_KEY = 'sk-claude'
process.env.ANTHROPIC_BASE_URL = 'https://claude.test'
delete process.env.LLM_EMBED_API_KEY
delete process.env.LLM_EMBED_BASE_URL
delete process.env.LLM_FALLBACK_API_KEY
delete process.env.LLM_FALLBACK_BASE_URL
delete process.env.DEEPSEEK_API_KEY
delete process.env.OLLAMA_API_KEY

let createProviders: typeof import('../../../../src/services/ai/providers/index.js').createProviders
let routeWithFallback: typeof import('../../../../src/services/ai/providers/index.js').routeWithFallback

beforeAll(async () => {
  const mod = await import('../../../../src/services/ai/providers/index.js')
  createProviders = mod.createProviders
  routeWithFallback = mod.routeWithFallback
})

describe('Provider 工厂与路由', () => {
  it('createProviders 应为每个已配置的 provider 创建实例', () => {
    const { providers, registry } = createProviders()
    expect(providers.chat).toBeDefined()
    expect(providers.claude).toBeDefined()
    expect(providers.chat.name).toBe('chat')
    // embed 槽位未配置 API key,不应出现在 registry 中
    expect(providers.embed).toBeUndefined()
    expect(providers.fallback).toBeUndefined()
  })

  it('routeWithFallback 应在主 provider 失败时切换到 fallback', async () => {
    const primary = { name: 'primary', chat: jest.fn().mockRejectedValue(new ProviderError('fail', 'primary', 500, true)) }
    const fallback = { name: 'fallback', chat: jest.fn().mockResolvedValue({ content: 'ok', provider: 'fallback' }) }
    const registry = { primary: primary as any, fallback: fallback as any }

    const result = await routeWithFallback(registry, ['primary', 'fallback'], (p) => p.chat([]))
    expect(result.content).toBe('ok')
    expect(fallback.chat).toHaveBeenCalled()
  })

  it('routeWithFallback 应在不可重试错误时立即抛出', async () => {
    const primary = { name: 'primary', chat: jest.fn().mockRejectedValue(new ProviderError('auth fail', 'primary', 401, false)) }
    const fallback = { name: 'fallback', chat: jest.fn() }
    const registry = { primary: primary as any, fallback: fallback as any }

    await expect(
      routeWithFallback(registry, ['primary', 'fallback'], (p) => p.chat([]))
    ).rejects.toThrow(/auth fail/)
    expect(fallback.chat).not.toHaveBeenCalled()
  })

  it('routeWithFallback 所有 provider 失败时应抛出最后一个错误', async () => {
    const primary = { name: 'primary', chat: jest.fn().mockRejectedValue(new ProviderError('err1', 'primary', 500, true)) }
    const fallback = { name: 'fallback', chat: jest.fn().mockRejectedValue(new ProviderError('err2', 'fallback', 500, true)) }
    const registry = { primary: primary as any, fallback: fallback as any }

    await expect(
      routeWithFallback(registry, ['primary', 'fallback'], (p) => p.chat([]))
    ).rejects.toThrow(/err2/)
  })
})
