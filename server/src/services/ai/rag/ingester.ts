/**
 * @file Ingester 服务
 * @description 知识入库:chunking → embed → 写 pgvector(幂等)
 * @module server/services/ai/rag/ingester
 */

export interface IngestItem {
  sourceType: string
  sourceId: string
  content: string
  metadata?: Record<string, unknown>
}

export interface ChunkOpts {
  maxChars?: number
  overlap?: number
}

/**
 * 按字符切分文本(简单实现,第一期不用 tokenizer)
 */
export function chunkText(text: string, opts: ChunkOpts = {}): string[] {
  const maxChars = opts.maxChars ?? 512
  const overlap = opts.overlap ?? 50
  if (maxChars <= 0) throw new Error('maxChars 必须大于 0')
  if (overlap < 0) throw new Error('overlap 不能为负数')
  if (overlap >= maxChars) throw new Error('overlap 必须小于 maxChars')
  if (text.length <= maxChars) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length)
    chunks.push(text.slice(start, end))
    if (end >= text.length) break
    start = end - overlap
    if (start < 0) start = 0
  }
  return chunks
}

export type PgQueryFn = (
  text: string,
  params?: unknown[]
) => Promise<{ rowCount: number }>

export class Ingester {
  constructor(
    private embedder: { embedBatch: (texts: string[]) => Promise<number[][]> },
    private pgQuery: PgQueryFn
  ) {}

  /**
   * 入库单个来源(幂等:先删后插)
   */
  async ingestSource(item: IngestItem, chunkOpts?: ChunkOpts): Promise<void> {
    const chunks = chunkText(item.content, chunkOpts)

    // 先生成 embeddings(失败时直接返回,旧数据不受影响)
    let embeddings: number[][]
    try {
      embeddings = await this.embedder.embedBatch(chunks)
    } catch (err) {
      console.error(
        `[Ingester] source=${item.sourceType}:${item.sourceId} embedding 失败,跳过(保留旧数据):`,
        (err as Error).message
      )
      return
    }

    // 删除该 source 的旧 chunks(embedding 成功后才删除)
    // 注意: Phase 0 不使用事务,若 INSERT 失败可能导致部分数据不一致,
    // 可通过重新入库修复。未来迭代可引入事务支持(pgPool.connect + BEGIN/COMMIT)。
    await this.pgQuery(
      'DELETE FROM knowledge_chunks WHERE source_type = $1 AND source_id = $2',
      [item.sourceType, item.sourceId]
    )

    // 批量插入
    for (let i = 0; i < chunks.length; i++) {
      const vectorStr = embeddings[i] ? `[${embeddings[i].join(',')}]` : null
      await this.pgQuery(
        `INSERT INTO knowledge_chunks (source_type, source_id, chunk_index, content, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)`,
        [
          item.sourceType,
          item.sourceId,
          i,
          chunks[i],
          JSON.stringify(item.metadata || {}),
          vectorStr,
        ]
      )
    }
  }

  /**
   * 批量入库
   */
  async ingestBatch(items: IngestItem[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    for (const item of items) {
      try {
        await this.ingestSource(item)
        success++
      } catch (err) {
        console.error(`[Ingester] ${item.sourceType}:${item.sourceId} 失败:`, (err as Error).message)
        failed++
      }
    }
    return { success, failed }
  }
}
