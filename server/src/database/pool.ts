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
    waitForConnections: config.database.waitForConnections,
    connectionLimit,
    // 从统一配置读取 queueLimit，保持单一配置源
    queueLimit: config.database.queueLimit,
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
 * 规范化 SQL 参数：把 ISO 8601 时间字符串转为 Date 对象
 * @description MySQL datetime 列在严格模式（STRICT_TRANS_TABLES）下不接受
 *              'YYYY-MM-DDTHH:mm:ssZ' 格式字符串。mysql2 的 escape 会把 Date 对象
 *              正确序列化为 'YYYY-MM-DD HH:mm:ss'。在 query 入口统一转换，
 *              所有 service 无需逐个处理时间格式。
 */
const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/
function normalizeParams(params: unknown[]): unknown[] {
  return params.map((p) => {
    if (typeof p === 'string' && ISO_8601_PATTERN.test(p)) {
      return new Date(p)
    }
    return p
  })
}

/**
 * 执行 SQL 查询
 * @param sql - SQL 语句
 * @param params - 参数数组
 * @returns 查询结果
 */
export async function query<T = RowDataPacket[]>(sql: string, params: unknown[] = []): Promise<T> {
  const connection = getPool()
  // 使用 query 而非 execute：mysql2 的 execute（预处理语句）对 LIMIT ? OFFSET ? 占位符
  // 会触发 "Incorrect arguments to mysqld_stmt_execute" 错误（驱动层参数类型推断问题）。
  // query 仍为参数化查询（客户端转义），不存在 SQL 注入风险。
  const [rows] = await connection.query<RowDataPacket[]>(sql, normalizeParams(params) as never)
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
/**
 * 带计时监控的查询包装器
 * @description 执行查询并记录慢查询（>500ms），用于性能监控和诊断
 * @param sql - SQL 语句
 * @param params - 参数数组
 * @param options.slowThreshold - 慢查询阈值（ms），默认 500
 * @returns 查询结果
 */
export async function queryWithTiming<T = RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
  options: { slowThreshold?: number } = {}
): Promise<{ rows: T; durationMs: number }> {
  const { slowThreshold = 500 } = options
  const start = Date.now()

  try {
    const connection = getPool()
    // 同 query：使用 query 避免 execute 对 LIMIT 占位符的不兼容；normalizeParams 转换 ISO 8601 时间
    const [rows] = await connection.query<RowDataPacket[]>(sql, normalizeParams(params) as never)
    const durationMs = Date.now() - start

    if (durationMs > slowThreshold) {
      logger.warn('慢查询', {
        sql: sql.length > 300 ? sql.substring(0, 300) + '...' : sql,
        durationMs,
        rowCount: rows.length
      })
    }

    return { rows: rows as unknown as T, durationMs }
  } catch (error) {
    const durationMs = Date.now() - start
    logger.error('查询失败', {
      sql: sql.length > 300 ? sql.substring(0, 300) + '...' : sql,
      durationMs,
      error: (error as Error).message
    })
    throw error
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

/**
 * 获取连接池状态指标
 * @description 暴露连接池核心指标，用于监控和告警
 * @returns 连接池状态对象
 */
export function getPoolStatus(): {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  connectionLimit: number
} {
  if (!pool) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      connectionLimit: 0
    }
  }

  // mysql2/promise 内部 pool 属性类型为 Pool，但 _connectionQueue 等属性不在类型定义中
  // 使用类型断言访问内部状态
  const internalPool = pool as Pool & {
    _connectionQueue?: unknown[]
    _freeConnections?: unknown[]
    _allConnections?: unknown[]
    _connectionLimit?: number
  }

  const totalConnections = internalPool._allConnections?.length || 0
  const freeConnections = internalPool._freeConnections?.length || 0
  const waitingRequests = internalPool._connectionQueue?.length || 0
  const connectionLimit = internalPool._connectionLimit || config.database.connectionLimit

  return {
    totalConnections,
    activeConnections: totalConnections - freeConnections,
    idleConnections: freeConnections,
    waitingRequests,
    connectionLimit
  }
}

/**
 * 关闭连接池
 * @description 优雅释放连接池资源，用于进程退出或测试清理
 * @returns {Promise<void>}
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export default {
  createPool,
  getPool,
  query,
  queryOne,
  queryWithTiming,
  insert,
  update,
  remove,
  transaction,
  closePool,
  testConnection,
  getPoolStatus
}
