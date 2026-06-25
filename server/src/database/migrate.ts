/**
 * @file 数据库迁移脚本
 * @description 创建数据库和表结构
 * @module server/database/migrate
 */

import mysql from 'mysql2/promise'
import { config } from '../config/index.js'
import { SCHEMA_STATEMENTS, TABLE_NAMES } from './schema.js'

async function createDatabase(): Promise<void> {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password
  })

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database.name}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )

  console.log(`✅ 数据库 '${config.database.name}' 已创建或已存在`)
  await connection.end()
}

async function runMigration(): Promise<void> {
  console.log('🚀 开始数据库迁移...\n')

  try {
    await createDatabase()

    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      multipleStatements: true
    })

    console.log('📋 创建数据表...')

    // 按 SCHEMA_STATEMENTS 顺序执行 DDL（已按外键依赖排序）
    for (let i = 0; i < SCHEMA_STATEMENTS.length; i++) {
      await connection.query(SCHEMA_STATEMENTS[i])
      console.log(`   ✓ ${TABLE_NAMES[i]} 表`)
    }

    await connection.end()

    console.log('\n✅ 数据库迁移完成!')
  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', (error as Error).message)
    process.exit(1)
  }
}

runMigration()
