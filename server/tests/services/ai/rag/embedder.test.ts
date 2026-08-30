import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Embedder } from '../../../../src/services/ai/rag/embedder.js'
import { ProviderError } from '../../../../src/services/ai/providers/types.js'

describe('Embedder', () => {
  let mockRegistry: any
  let embedder: Embedder

  beforeEach(() => {
    const mockProvider = {
      name: 'doubao',
      embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    }
    mockRegistry = { doubao: mockProvider, deepseek: { name: 'deepseek', embed: jest.fn().mockResolvedValue([[0.4, 0.5, 0.6]]) } }
    embedder = new Embedder(mockRegistry)
  })

  it('embed 应调用主 provider', async () => {
    const result = await embedder.embed('text')
    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(mockRegistry.doubao.embed).toHaveBeenCalledWith(['text'])
  })

  it('embedBatch 应批量调用', async () => {
    mockRegistry.doubao.embed.mockResolvedValueOnce([[0.1], [0.2]])
    const result = await embedder.embedBatch(['a', 'b'])
    expect(result).toEqual([[0.1], [0.2]])
  })

  it('主 provider 失败应切换到 fallback', async () => {
    mockRegistry.doubao.embed.mockRejectedValueOnce(new ProviderError('fail', 'doubao', 500, true))
    const result = await embedder.embed('text')
    expect(result).toEqual([0.4, 0.5, 0.6])
    expect(mockRegistry.deepseek.embed).toHaveBeenCalled()
  })

  it('所有 provider 失败应抛出 ProviderError', async () => {
    mockRegistry.doubao.embed.mockRejectedValue(new ProviderError('fail', 'doubao', 500, true))
    mockRegistry.deepseek.embed.mockRejectedValue(new ProviderError('fail', 'deepseek', 500, true))
    await expect(embedder.embed('text')).rejects.toThrow(ProviderError)
    await expect(embedder.embed('text')).rejects.toThrow(/Embedding 失败/)
  })

  it('错误应保留原始 retryable 语义', async () => {
    mockRegistry.doubao.embed.mockRejectedValue(new ProviderError('rate limited', 'doubao', 429, true))
    mockRegistry.deepseek.embed.mockRejectedValue(new ProviderError('rate limited', 'deepseek', 429, true))
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
