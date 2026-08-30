/**
 * @file 数据库迁移脚本
 * @description 创建数据库和表结构（DDL 统一引用 schema.ts，消除重复）
 * @module server/database/migrate
 */

import mysql from 'mysql2/promise'
import { config } from '../config/index.js'
import { TABLE_SCHEMAS } from './schema.js'

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

    for (const table of TABLE_SCHEMAS) {
      await connection.query(table.sql)
      console.log(`   ✓ ${table.name} 表`)
    }

    await connection.end()

    console.log('\n✅ 数据库迁移完成!')
  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', (error as Error).message)
    process.exit(1)
  }
}

runMigration()