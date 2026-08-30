/**
 * @file LlmService 单元测试
 * @description 验证缓存命中/未命中、流式不缓存、cacheKey 生成逻辑
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { LlmService } from '../../../src/services/ai/llmService.js'

describe('LlmService', () => {
  let mockRegistry: any
  let mockCacheGet: ReturnType<typeof jest.fn>
  let mockCacheSet: ReturnType<typeof jest.fn>
  let service: LlmService

  beforeEach(() => {
    mockCacheGet = jest.fn().mockResolvedValue(null)
    mockCacheSet = jest.fn().mockResolvedValue(undefined)
    mockRegistry = {
      doubao: {
        name: 'doubao',
        chat: jest.fn().mockResolvedValue({ content: '回答', usage: { totalTokens: 10 }, provider: 'doubao', model: 'm' }),
        chatStream: async function* () {
          yield '回'
          yield '答'
        },
      },
    }
    service = new LlmService(mockRegistry, { get: mockCacheGet, set: mockCacheSet })
  })

  it('chat 应在缓存未命中时调用 provider 并写入缓存', async () => {
    const result = await service.chat([{ role: 'user', content: 'hi' }], { model: 'm' })
    expect(result.content).toBe('回答')
    expect(mockRegistry.doubao.chat).toHaveBeenCalled()
    expect(mockCacheSet).toHaveBeenCalled()
  })

  it('chat 应在缓存命中时直接返回,不调用 provider', async () => {
    mockCacheGet.mockResolvedValueOnce({ content: '缓存回答', usage: { totalTokens: 5 }, provider: 'cache', model: 'm' })
    const result = await service.chat([{ role: 'user', content: 'hi' }], { model: 'm' })
    expect(result.content).toBe('缓存回答')
    expect(mockRegistry.doubao.chat).not.toHaveBeenCalled()
  })

  it('chatStream 不应使用缓存(流式不缓存)', async () => {
    const tokens: string[] = []
    for await (const t of service.chatStream([{ role: 'user', content: 'hi' }], { model: 'm' })) {
      tokens.push(t)
    }
    expect(tokens).toEqual(['回', '答'])
    expect(mockCacheGet).not.toHaveBeenCalled()
  })

  it('缓存 key 应基于消息内容和 model', async () => {
    // 第一次调用
    await service.chat([{ role: 'user', content: 'hello' }], { model: 'model-a' })
    const key1 = mockCacheSet.mock.calls[0][0]
    expect(key1).toContain('model-a')
    expect(key1).toMatch(/^llm:chat:model-a:/) // 验证 key 格式

    // 不同内容应生成不同 key
    mockCacheSet.mockClear()
    await service.chat([{ role: 'user', content: 'world' }], { model: 'model-a' })
    const key2 = mockCacheSet.mock.calls[0][0]
    expect(key1).not.toBe(key2) // 不同内容 → 不同 key

    // 不同 model 应生成不同 key
    mockCacheSet.mockClear()
    await service.chat([{ role: 'user', content: 'hello' }], { model: 'model-b' })
    const key3 = mockCacheSet.mock.calls[0][0]
    expect(key1).not.toBe(key3) // 不同 model → 不同 key

    // 相同内容和 model 应生成相同 key
    mockCacheSet.mockClear()
    await service.chat([{ role: 'user', content: 'hello' }], { model: 'model-a' })
    const key4 = mockCacheSet.mock.calls[0][0]
    expect(key1).toBe(key4) // 相同输入 → 相同 key
  })

  it('不同 temperature 应生成不同 cacheKey', async () => {
    await service.chat([{ role: 'user', content: 'hi' }], { model: 'm', temperature: 0.3 })
    const key1 = mockCacheSet.mock.calls[0][0]
    mockCacheSet.mockClear()

    await service.chat([{ role: 'user', content: 'hi' }], { model: 'm', temperature: 0.9 })
    const key2 = mockCacheSet.mock.calls[0][0]

    expect(key1).not.toBe(key2)
  })

  it('不同 maxTokens 应生成不同 cacheKey', async () => {
    await service.chat([{ role: 'user', content: 'hi' }], { model: 'm', maxTokens: 100 })
    const key1 = mockCacheSet.mock.calls[0][0]
    mockCacheSet.mockClear()

    await service.chat([{ role: 'user', content: 'hi' }], { model: 'm', maxTokens: 2000 })
    const key2 = mockCacheSet.mock.calls[0][0]

    expect(key1).not.toBe(key2)
  })

  it('chat 主 provider 失败应切换到 fallback', async () => {
    // 添加 fallback provider (chat 降级链: doubao -> deepseek -> claude)
    mockRegistry.deepseek = {
      name: 'deepseek',
      chat: jest
        .fn()
        .mockResolvedValue({ content: 'fallback 回答', usage: { totalTokens: 8 }, provider: 'deepseek', model: 'm' }),
      chatStream: async function* () {
        yield 'fallback'
      },
    }
    // 主 provider doubao 失败(可重试错误)
    mockRegistry.doubao.chat.mockRejectedValueOnce(new Error('provider down'))

    const result = await service.chat([{ role: 'user', content: 'hi' }], { model: 'm' })
    expect(result.content).toBe('fallback 回答')
    expect(mockRegistry.deepseek.chat).toHaveBeenCalled()
  })

  it('缓存写入失败不影响主流程', async () => {
    mockCacheSet.mockRejectedValueOnce(new Error('redis down'))
    const result = await service.chat([{ role: 'user', content: 'hi' }], { model: 'm' })
    expect(result.content).toBe('回答') // 仍返回 provider 的结果
  })
})
