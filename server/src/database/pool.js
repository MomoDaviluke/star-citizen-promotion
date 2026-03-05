/**
 * @file MySQL 数据库连接池
 * @description 管理 MySQL 连接池，提供统一的数据库访问接口
 * @module server/database/pool
 */

import mysql from 'mysql2/promise'
import { config } from '../config/index.js'

let pool = null

/**
 * 创建数据库连接池
 * @returns {Promise<mysql.Pool>} MySQL 连接池实例
 */
export async function createPool() {
  if (pool) {
    return pool
  }

  pool = mysql.createPool(config.database)

  console.log('📦 MySQL 连接池创建成功')
  console.log(`   主机: ${config.database.host}:${config.database.port}`)
  console.log(`   数据库: ${config.database.database}`)

  return pool
}

/**
 * 获取数据库连接池
 * @returns {mysql.Pool} MySQL 连接池实例
 */
export function getPool() {
  if (!pool) {
    throw new Error('数据库连接池未初始化，请先调用 createPool()')
  }
  return pool
}

/**
 * 执行 SQL 查询
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
export async function query(sql, params = []) {
  const connection = getPool()
  const [rows] = await connection.execute(sql, params)
  return rows
}

/**
 * 执行单条查询
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Object|null>} 单条查询结果
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * 插入数据并返回插入 ID
 * @param {string} sql - INSERT SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<string>} 插入的 ID
 */
export async function insert(sql, params = []) {
  const result = await query(sql, params)
  return result.insertId
}

/**
 * 更新数据并返回影响行数
 * @param {string} sql - UPDATE SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<number>} 影响的行数
 */
export async function update(sql, params = []) {
  const result = await query(sql, params)
  return result.affectedRows
}

/**
 * 删除数据并返回影响行数
 * @param {string} sql - DELETE SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<number>} 影响的行数
 */
export async function remove(sql, params = []) {
  const result = await query(sql, params)
  return result.affectedRows
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数
 * @returns {Promise<any>} 事务结果
 */
export async function transaction(callback) {
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
export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('📦 MySQL 连接池已关闭')
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
export async function testConnection() {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ MySQL 数据库连接测试成功')
    return true
  } catch (error) {
    console.error('❌ MySQL 数据库连接测试失败:', error.message)
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
