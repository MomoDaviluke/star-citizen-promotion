import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Retriever } from '../../../../src/services/ai/rag/retriever.js'

describe('Retriever', () => {
  let mockEmbedder: any
  let mockPgQuery: ReturnType<typeof jest.fn>
  let retriever: Retriever

  beforeEach(() => {
    mockEmbedder = { embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]) }
    mockPgQuery = jest.fn()
    retriever = new Retriever(mockEmbedder, mockPgQuery)
  })

  it('search 应返回 top-k 相关 chunk', async () => {
    mockPgQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, content: '内容1', source_type: 'faq', source_id: '1', metadata: {}, similarity: 0.95 },
        { id: 2, content: '内容2', source_type: 'ship', source_id: '5', metadata: {}, similarity: 0.87 },
      ],
    })

    const results = await retriever.search('如何加入', { topK: 2 })
    expect(results).toHaveLength(2)
    expect(results[0].content).toBe('内容1')
    expect(results[0].similarity).toBe(0.95)
  })

  it('search 带 sourceType 过滤应生成 WHERE 子句', async () => {
    mockPgQuery.mockResolvedValueOnce({ rows: [] })
    await retriever.search('问题', { sourceType: 'faq', topK: 5 })
    const sql = mockPgQuery.mock.calls[0][0]
    expect(sql).toContain('source_type = $2')
    expect(mockPgQuery.mock.calls[0][1]).toEqual([expect.any(String), 'faq', 5])
  })

  it('search 在 pgvector 不可用时应返回空数组', async () => {
    mockPgQuery.mockRejectedValueOnce(new Error('connection refused'))
    const results = await retriever.search('问题')
    expect(results).toEqual([])
  })

  it('search 带 metadata 过滤应生成 JSONB 路径查询', async () => {
    mockPgQuery.mockResolvedValueOnce({ rows: [] })
    await retriever.search('问题', { metadata: { category: 'guide' }, topK: 5 })
    const sql = mockPgQuery.mock.calls[0][0]
    expect(sql).toContain('metadata->>$2 = $3')
    expect(mockPgQuery.mock.calls[0][1]).toEqual([expect.any(String), 'category', 'guide', 5])
  })

  it('search 带多个 metadata 键应正确递增占位符', async () => {
    mockPgQuery.mockResolvedValueOnce({ rows: [] })
    await retriever.search('问题', { metadata: { category: 'guide', lang: 'zh' }, topK: 3 })
    const sql = mockPgQuery.mock.calls[0][0]
    // 第一个 metadata: $2 = $3
    expect(sql).toContain('metadata->>$2 = $3')
    // 第二个 metadata: $4 = $5
    expect(sql).toContain('metadata->>$4 = $5')
    // LIMIT 用 $6
    expect(sql).toContain('LIMIT $6')
    const params = mockPgQuery.mock.calls[0][1]
    expect(params).toEqual([expect.any(String), 'category', 'guide', 'lang', 'zh', 3])
  })
})
