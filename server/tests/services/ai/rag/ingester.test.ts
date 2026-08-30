import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Ingester, chunkText } from '../../../../src/services/ai/rag/ingester.js'

describe('chunkText', () => {
  it('应按 maxChars 切分文本', () => {
    const text = 'a'.repeat(1500)
    const chunks = chunkText(text, { maxChars: 512, overlap: 50 })
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].length).toBe(512)
  })

  it('短文本应返回单个 chunk', () => {
    const chunks = chunkText('短文本', { maxChars: 512, overlap: 50 })
    expect(chunks).toEqual(['短文本'])
  })

  it('maxChars=0 应抛出错误', () => {
    expect(() => chunkText('text', { maxChars: 0 })).toThrow('maxChars 必须大于 0')
  })

  it('overlap >= maxChars 应抛出错误', () => {
    expect(() => chunkText('text', { maxChars: 100, overlap: 100 })).toThrow(
      'overlap 必须小于 maxChars'
    )
  })

  it('空文本应返回单个空字符串 chunk', () => {
    const chunks = chunkText('', { maxChars: 512, overlap: 50 })
    expect(chunks).toEqual([''])
  })
})

describe('Ingester', () => {
  let mockEmbedder: any
  let mockPgQuery: ReturnType<typeof jest.fn>
  let ingester: Ingester

  beforeEach(() => {
    mockEmbedder = { embedBatch: jest.fn().mockResolvedValue([[0.1], [0.2]]) }
    mockPgQuery = jest.fn().mockResolvedValue({ rows: [] })
    ingester = new Ingester(mockEmbedder, mockPgQuery)
  })

  it('ingestSource 应删除旧 chunks 后插入新 chunks(幂等)', async () => {
    await ingester.ingestSource({
      sourceType: 'faq',
      sourceId: '1',
      content: 'a'.repeat(600),
      metadata: { category: 'join' },
    })

    // 应先 DELETE 再 INSERT
    const deleteCall = mockPgQuery.mock.calls.find(c => c[0].includes('DELETE'))
    const insertCall = mockPgQuery.mock.calls.find(c => c[0].includes('INSERT'))
    expect(deleteCall).toBeDefined()
    expect(insertCall).toBeDefined()
    expect(mockEmbedder.embedBatch).toHaveBeenCalled()
  })

  it('embedBatch 失败应跳过该 source 不抛出异常', async () => {
    mockEmbedder.embedBatch.mockRejectedValueOnce(new Error('embed fail'))
    await expect(
      ingester.ingestSource({ sourceType: 'faq', sourceId: '1', content: 'text', metadata: {} })
    ).resolves.not.toThrow()
  })

  it('ingestBatch 应返回成功和失败计数', async () => {
    // 第一条成功,第二条 embedding 失败(被 ingestSource 内部 catch,算成功)
    mockEmbedder.embedBatch.mockResolvedValue([[0.1]])
    const result = await ingester.ingestBatch([
      { sourceType: 'faq', sourceId: '1', content: 'text1', metadata: {} },
      { sourceType: 'faq', sourceId: '2', content: 'text2', metadata: {} },
    ])
    expect(result.success).toBe(2)
    expect(result.failed).toBe(0)
  })

  it('ingestBatch 在 INSERT 失败时应计入 failed', async () => {
    mockEmbedder.embedBatch.mockResolvedValue([[0.1]])
    // 执行顺序(修复后): embedBatch → DELETE → INSERT
    mockPgQuery
      .mockResolvedValueOnce({ rowCount: 1 }) // DELETE 成功
      .mockRejectedValueOnce(new Error('insert fail')) // INSERT 失败
      .mockResolvedValue({ rowCount: 1 }) // 后续成功
    const result = await ingester.ingestBatch([
      { sourceType: 'faq', sourceId: '1', content: 'text1', metadata: {} },
    ])
    expect(result.failed).toBe(1)
  })
})
