/**
 * @file MySQL 数据库连接池
 * @description 管理 MySQL 连接池，提供统一的数据库访问接口
 * @module server/database/pool
 */

import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

let pool: Pool | null = null

export async function createPool(): Promise<Pool> {
  if (pool) {
    return pool
  }

  const connectionLimit = process.env.DB_CONNECTION_LIMIT
    ? parseInt(process.env.DB_CONNECTION_LIMIT, 10)
    : (process.env.NODE_ENV === 'production' ? 20 : 10)

  const dbConfig = {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 50,
    maxIdleTime: 300000,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: config.database.timezone,
    charset: config.database.charset
  }

  pool = mysql.createPool(dbConfig)
  return pool
}

/**
 * 获取数据库连接池
 * @returns MySQL 连接池实例
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('数据库连接池未初始化，请先调用 createPool()')
  }
  return pool
}

/**
 * 执行 SQL 查询
 * @param sql - SQL 语句
 * @param params - 参数数组
 * @returns 查询结果
 */
export async function query<T = RowDataPacket[]>(sql: string, params: unknown[] = []): Promise<T> {
  const connection = getPool()
  const [rows] = await connection.execute<RowDataPacket[]>(sql, params as never)
  return rows as unknown as T
}

/**
 * 执行单条查询
 * @param sql - SQL 语句
 * @param params - 参数数组
 * @returns 单条查询结果
 */
export async function queryOne<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<RowDataPacket[]>(sql, params)
  return (rows.length > 0 ? rows[0] : null) as T | null
}

/**
 * 插入数据并返回插入 ID
 * @param sql - INSERT SQL 语句
 * @param params - 参数数组
 * @returns 插入的 ID
 */
export async function insert(sql: string, params: unknown[] = []): Promise<number> {
  const result = await query<ResultSetHeader>(sql, params)
  return result.insertId
}

/**
 * 更新数据并返回影响行数
 * @param sql - UPDATE SQL 语句
 * @param params - 参数数组
 * @returns 影响的行数
 */
export async function update(sql: string, params: unknown[] = []): Promise<number> {
  const result = await query<ResultSetHeader>(sql, params)
  return result.affectedRows
}

/**
 * 删除数据并返回影响行数
 * @param sql - DELETE SQL 语句
 * @param params - 参数数组
 * @returns 影响的行数
 */
export async function remove(sql: string, params: unknown[] = []): Promise<number> {
  const result = await query<ResultSetHeader>(sql, params)
  return result.affectedRows
}

/**
 * 执行事务
 * @param callback - 事务回调函数
 * @returns 事务结果
 */
export async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * 关闭数据库连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('📦 MySQL 连接池已关闭')
  }
}

/**
 * 测试数据库连接
 * @returns 连接是否成功
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    logger.info('✅ MySQL 数据库连接测试成功')
    return true
  } catch (error) {
    logger.error('❌ MySQL 数据库连接测试失败:', { error: (error as Error).message })
    return false
  }
}

export default {
  createPool,
  getPool,
  query,
  queryOne,
  insert,
  update,
  remove,
  transaction,
  closePool,
  testConnection
}
