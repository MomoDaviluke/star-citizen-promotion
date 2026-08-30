import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Embedder } from '../../../../src/services/ai/rag/embedder.js'
import { ProviderError } from '../../../../src/services/ai/providers/types.js'

describe('Embedder', () => {
  let mockRegistry: any
  let embedder: Embedder

  beforeEach(() => {
    // 槽位制(AI-SLOT): 路由链 = ['embed', 'fallback']
    const mockProvider = {
      name: 'embed',
      embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    }
    mockRegistry = { embed: mockProvider, fallback: { name: 'fallback', embed: jest.fn().mockResolvedValue([[0.4, 0.5, 0.6]]) } }
    embedder = new Embedder(mockRegistry)
  })

  it('embed 应调用主 provider', async () => {
    const result = await embedder.embed('text')
    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(mockRegistry.embed.embed).toHaveBeenCalledWith(['text'])
  })

  it('embedBatch 应批量调用', async () => {
    mockRegistry.embed.embed.mockResolvedValueOnce([[0.1], [0.2]])
    const result = await embedder.embedBatch(['a', 'b'])
    expect(result).toEqual([[0.1], [0.2]])
  })

  it('主 provider 失败应切换到 fallback', async () => {
    mockRegistry.embed.embed.mockRejectedValueOnce(new ProviderError('fail', 'embed', 500, true))
    const result = await embedder.embed('text')
    expect(result).toEqual([0.4, 0.5, 0.6])
    expect(mockRegistry.fallback.embed).toHaveBeenCalled()
  })

  it('所有 provider 失败应抛出 ProviderError', async () => {
    mockRegistry.embed.embed.mockRejectedValue(new ProviderError('fail', 'embed', 500, true))
    mockRegistry.fallback.embed.mockRejectedValue(new ProviderError('fail', 'fallback', 500, true))
    await expect(embedder.embed('text')).rejects.toThrow(ProviderError)
    await expect(embedder.embed('text')).rejects.toThrow(/Embedding 失败/)
  })

  it('错误应保留原始 retryable 语义', async () => {
    mockRegistry.embed.embed.mockRejectedValue(new ProviderError('rate limited', 'embed', 429, true))
    mockRegistry.fallback.embed.mockRejectedValue(new ProviderError('rate limited', 'fallback', 429, true))
    expect.assertions(3)
    try {
      await embedder.embed('text')
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError)
      expect((err as ProviderError).retryable).toBe(true)
      expect((err as ProviderError).statusCode).toBe(429)
    }
  })
})
