/**
 * @file PostgreSQL 连接池
 * @description 独立于 MySQL pool,专用于 pgvector 向量库
 * @module server/services/ai/pgPool
 */

import pg from 'pg'
import { aiConfig } from '../../config/ai.js'

const { Pool } = pg

export const pgPool = new Pool({
  connectionString: aiConfig.pgvectorUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pgPool.on('error', (err) => {
  console.error('[pgPool] Unexpected error on idle client', err)
})

/**
 * 执行查询(参数化)
 */
export async function pgQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pgPool.query<T>(text, params)
}

export async function closePgPool(): Promise<void> {
  await pgPool.end()
}
