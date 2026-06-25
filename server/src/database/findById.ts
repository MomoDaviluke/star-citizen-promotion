/**
 * @file 通用按 ID 查询工具
 * @description 为后端服务层提供统一的「按主键 ID 查询单条记录」和「事务内查询」逻辑，
 *              消除各 Service 中重复的 'SELECT * FROM xxx WHERE id = ?' 模式（TD-7）
 * @module server/database/findById
 */

import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { queryOne } from './pool.js'

/**
 * 按主键 ID 查询单条记录（使用连接池）
 * @description 统一替代各 Service 中的 `queryOne<T>('SELECT * FROM xxx WHERE id = ?', [id])`
 * @param table 表名（如 'members'、'projects'）
 * @param id 主键值
 * @returns 查询到的记录，未找到返回 null
 *
 * @example
 * const member = await findById<Member>('members', id)
 */
export async function findById<T = RowDataPacket>(table: string, id: string): Promise<T | null> {
  return queryOne<T>(`SELECT * FROM ${table} WHERE id = ?`, [id])
}

/**
 * 按主键 ID 在事务连接内查询单条记录
 * @description 统一替代事务回调中的 `conn.execute<RowDataPacket[]>('SELECT * FROM xxx WHERE id = ?', [id])`
 *              并返回首行（无需在 Service 中再取 rows[0]）
 * @param conn 事务连接
 * @param table 表名
 * @param id 主键值
 * @returns 查询到的记录，未找到返回 null
 *
 * @example
 * return transaction(async (conn) => {
 *   const existing = await findByIdInTx<Member>(conn, 'members', id)
 *   if (!existing) throw ApiError.notFound('成员不存在')
 *   // ... UPDATE ...
 *   return findByIdInTx<Member>(conn, 'members', id)
 * })
 */
export async function findByIdInTx<T = RowDataPacket>(
  conn: PoolConnection,
  table: string,
  id: string
): Promise<T | null> {
  const [rows] = await conn.execute<RowDataPacket[]>(`SELECT * FROM ${table} WHERE id = ?`, [id])
  return (rows.length > 0 ? rows[0] : null) as T | null
}

/**
 * 按主键 ID 在事务连接内查询，未找到则抛出指定错误
 * @description 事务内「存在性校验 + 取记录」的便捷封装，消除各 Service 中重复的
 *              `const [existingRows] = await conn.execute(...); if (existingRows.length === 0) throw ...` 模式
 * @param conn 事务连接
 * @param table 表名
 * @param id 主键值
 * @param notFoundError 未找到时抛出的错误
 * @returns 查询到的记录
 */
export async function requireByIdInTx<T = RowDataPacket>(
  conn: PoolConnection,
  table: string,
  id: string,
  notFoundError: Error
): Promise<T> {
  const row = await findByIdInTx<T>(conn, table, id)
  if (!row) throw notFoundError
  return row
}
