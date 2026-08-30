/**
 * @file 知识库种子脚本
 * @description 从 MySQL 业务表读取数据,chunking + embed 后写入 pgvector
 * @module server/scripts/ingest
 * @usage npm run ai:ingest
 */

import { createPool, query, closePool } from '../database/pool.js'
import { getRegistry } from '../services/ai/providers/index.js'
import { Embedder } from '../services/ai/rag/embedder.js'
import { Ingester, type IngestItem } from '../services/ai/rag/ingester.js'
import { pgQuery, closePgPool } from '../services/ai/pgPool.js'

/**
 * 从 ships 表加载舰船知识
 * @description 实际表结构:id/name/ship(型号)/category/description
 *              (无 manufacturer/role 列,使用 ship+category 替代)
 */
async function loadShips(): Promise<IngestItem[]> {
  const rows = await query<any[]>(
    'SELECT id, name, ship, category, description FROM ships'
  )
  return rows.map((row) => ({
    sourceType: 'ship',
    sourceId: String(row.id),
    content: `${row.name} (${row.ship})\n类别: ${row.category}\n描述: ${row.description || '无'}`,
    metadata: { name: row.name, ship: row.ship, category: row.category },
  }))
}

/**
 * 从 events 表加载即将开始的活动知识
 */
async function loadEvents(): Promise<IngestItem[]> {
  const rows = await query<any[]>(
    'SELECT id, title, description, start_time FROM events WHERE start_time > NOW()'
  )
  return rows.map((row) => ({
    sourceType: 'event',
    sourceId: String(row.id),
    content: `活动: ${row.title}\n时间: ${row.start_time}\n描述: ${row.description || '无'}`,
    metadata: { title: row.title, startTime: row.start_time },
  }))
}

/**
 * 从 settings 表加载公会信息
 */
async function loadGuildInfo(): Promise<IngestItem[]> {
  const rows = await query<any[]>(
    "SELECT `key`, `value` FROM settings WHERE `key` IN ('guild_name', 'guild_focus', 'guild_intro', 'join_requirements')"
  )
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return [
    {
      sourceType: 'guild_info',
      sourceId: 'main',
      content: `公会名称: ${settings.guild_name || '未设置'}\n公会定位: ${settings.guild_focus || '未设置'}\n公会简介: ${settings.guild_intro || '无'}\n加入要求: ${settings.join_requirements || '无'}`,
      metadata: settings,
    },
  ]
}

/**
 * 从 faq 表加载常见问答
 * @description faq 表在 Phase 0 尚未创建,try/catch 跳过
 */
async function loadFaq(): Promise<IngestItem[]> {
  try {
    const rows = await query<any[]>('SELECT id, question, answer FROM faq')
    return rows.map((row) => ({
      sourceType: 'faq',
      sourceId: String(row.id),
      content: `问: ${row.question}\n答: ${row.answer}`,
      metadata: { question: row.question },
    }))
  } catch {
    console.log('[ingest] faq 表不存在,跳过(Phase 2 会创建)')
    return []
  }
}

async function main(): Promise<void> {
  console.log('[ingest] 开始知识库入库...')

  // 初始化 MySQL 连接池(脚本独立运行,需显式创建)
  await createPool()

  const registry = getRegistry()
  const embedder = new Embedder(registry)
  // pgQuery 返回 pg.QueryResult(rowCount 可为 null),Ingester 的 PgQueryFn 要求 rowCount: number
  // 包装器显式处理 null,保证类型兼容
  const ingester = new Ingester(embedder, async (text: string, params?: unknown[]) => {
    const result = await pgQuery(text, params)
    return { rowCount: result.rowCount ?? 0 }
  })

  const items: IngestItem[] = [
    ...(await loadGuildInfo()),
    ...(await loadShips()),
    ...(await loadEvents()),
    ...(await loadFaq()),
  ]

  console.log(`[ingest] 共加载 ${items.length} 条知识`)

  const result = await ingester.ingestBatch(items)
  console.log(`[ingest] 完成: 成功 ${result.success}, 失败 ${result.failed}`)

  await closePool()
  await closePgPool()
}

main().catch((err) => {
  console.error('[ingest] 失败:', err)
  process.exit(1)
})
