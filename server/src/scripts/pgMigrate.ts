/**
 * @file PostgreSQL 迁移脚本
 * @description 执行 pgvector schema 迁移
 * @module server/scripts/pgMigrate
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pgPool, closePgPool } from '../services/ai/pgPool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate(): Promise<void> {
  const migrationsDir = join(__dirname, '../../migrations/pg')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(`[pgMigrate] 执行 ${file}`)
    await pgPool.query(sql)
    console.log(`[pgMigrate] ${file} 完成`)
  }

  await closePgPool()
  console.log('[pgMigrate] 全部迁移完成')
}

migrate().catch((err) => {
  console.error('[pgMigrate] 迁移失败:', err)
  process.exit(1)
})
