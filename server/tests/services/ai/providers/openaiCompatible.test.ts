/**
 * @file OpenAICompatibleProvider 单元测试
 * @description 测试 OpenAI 兼容协议 Provider 的 chat/chatStream/embed 方法
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { OpenAICompatibleProvider } from '../../../../src/services/ai/providers/openaiCompatible.js'
import { ProviderError } from '../../../../src/services/ai/providers/types.js'

describe('OpenAICompatibleProvider', () => {
  let provider: OpenAICompatibleProvider
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    provider = new OpenAICompatibleProvider('doubao', 'https://api.test.com/v1', 'sk-test')
  })

  it('chat 应返回内容和 usage', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '你好' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    })

    const result = await provider.chat(
      [{ role: 'user', content: 'hello' }],
      { model: 'doubao-pro' }
    )

    expect(result.content).toBe('你好')
    expect(result.usage.totalTokens).toBe(15)
    expect(result.provider).toBe('doubao')
  })

  it('chat 应在 4xx 错误时抛出不可重试的 ProviderError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    })

    await expect(
      provider.chat([{ role: 'user', content: 'hi' }], { model: 'doubao-pro' })
    ).rejects.toThrow(/Invalid API key/)
  })

  it('embed 应返回二维向量数组', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.4, 0.5, 0.6] },
        ],
      }),
    })

    const vectors = await provider.embed(['text1', 'text2'])
    expect(vectors).toHaveLength(2)
    expect(vectors[0]).toEqual([0.1, 0.2, 0.3])
  })

  it('chatStream 应逐 token 产出', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      'data: {"choices":[{"delta":{"content":"你"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
      'data: [DONE]\n\n',
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          chunks.forEach(c => controller.enqueue(encoder.encode(c)))
          controller.close()
        },
      }),
    })

    const tokens: string[] = []
    for await (const token of provider.chatStream(
      [{ role: 'user', content: 'hi' }],
      { model: 'doubao-pro' }
    )) {
      tokens.push(token)
    }
    expect(tokens).toEqual(['你', '好'])
  })
})