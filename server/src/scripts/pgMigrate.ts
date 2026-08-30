/**
 * @file PostgreSQL 迁移脚本
 * @description 执行 pgvector schema 迁移
 * @module server/scripts/pgMigrate
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// 注意：dotenv 必须先于 config/ai.js 求值（aiConfig 模块加载即消费 env）。
// 静态 import 会被提升到 dotenv.config 之前，故此处用动态 import（本脚本不进测试，无 DBG-21 风险）。
import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: join(process.cwd(), envFile) })

const { pgPool, closePgPool } = await import('../services/ai/pgPool.js')

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
