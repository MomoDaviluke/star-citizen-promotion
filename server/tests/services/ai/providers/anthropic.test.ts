/**
 * @file AnthropicProvider 单元测试
 * @description 测试 Anthropic Claude Provider 的 chat/chatStream/embed 方法
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { AnthropicProvider } from '../../../../src/services/ai/providers/anthropic.js'

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    provider = new AnthropicProvider('claude', 'https://api.anthropic.com', 'sk-test')
  })

  it('chat 应将 messages 转换为 Anthropic 格式并返回内容', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '你好' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    })

    const result = await provider.chat(
      [
        { role: 'system', content: '你是助手' },
        { role: 'user', content: 'hello' },
      ],
      { model: 'claude-sonnet-4-5-20250929' }
    )

    expect(result.content).toBe('你好')
    expect(result.usage.totalTokens).toBe(15)
    expect(result.provider).toBe('claude')

    // 验证请求体格式
    const callBody = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body)
    expect(callBody.system).toBe('你是助手')
    expect(callBody.messages).toEqual([{ role: 'user', content: 'hello' }])
  })

  it('embed 应抛出不支持错误(Anthropic 无 embedding API)', async () => {
    await expect(provider.embed(['text'])).rejects.toThrow(/不支持 embedding/)
  })

  it('chatStream 应逐 token 产出', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"你"}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"好"}}\n\n',
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
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
      { model: 'claude-sonnet-4-5-20250929' }
    )) {
      tokens.push(token)
    }
    expect(tokens).toEqual(['你', '好'])
  })
})
