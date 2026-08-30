/**
 * @file Retriever 服务
 * @description pgvector 语义检索,top-k + metadata 过滤
 * @module server/services/ai/rag/retriever
 */

import type { Embedder } from './embedder.js'

export interface RetrievedChunk {
  id: number
  content: string
  sourceType: string
  sourceId: string
  metadata: Record<string, unknown>
  similarity: number
}

export interface SearchOpts {
  topK?: number
  sourceType?: string
  metadata?: Record<string, unknown>
}

export type PgQueryFn = (
  text: string,
  params?: unknown[]
) => Promise<{ rows: any[] }>

export class Retriever {
  constructor(
    private embedder: Embedder,
    private pgQuery: PgQueryFn
  ) {}

  async search(question: string, opts: SearchOpts = {}): Promise<RetrievedChunk[]> {
    const topK = opts.topK ?? 5
    try {
      const queryVector = await this.embedder.embed(question)
      const vectorStr = `[${queryVector.join(',')}]`

      let sql = `
        SELECT id, content, source_type, source_id, metadata,
               1 - (embedding <=> $1) AS similarity
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
      `
      const params: unknown[] = [vectorStr]
      let paramIdx = 2

      if (opts.sourceType) {
        sql += ` AND source_type = $${paramIdx}`
        params.push(opts.sourceType)
        paramIdx++
      }

      if (opts.metadata) {
        for (const [key, value] of Object.entries(opts.metadata)) {
          sql += ` AND metadata->>$${paramIdx} = $${paramIdx + 1}`
          params.push(key, String(value))
          paramIdx += 2
        }
      }

      sql += ` ORDER BY embedding <=> $1 LIMIT $${paramIdx}`
      params.push(topK)

      const result = await this.pgQuery(sql, params)
      return result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        sourceType: row.source_type,
        sourceId: row.source_id,
        metadata: row.metadata,
        similarity: Number(row.similarity),
      }))
    } catch (err) {
      // pgvector 不可用时降级为空结果(让上层用无 RAG 上下文回答)
      console.error('[Retriever] 检索失败,降级为空结果:', (err as Error).message)
      return []
    }
  }
}
