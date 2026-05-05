/**
 * @file 成员业务服务层
 * @description 封装成员 CRUD 业务逻辑，支持事务保护
 * @module server/services/memberService
 */

import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

/**
 * 获取成员列表
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态筛选
 * @param {number} options.limit - 分页大小
 * @param {number} options.offset - 分页偏移
 * @returns {Promise<Object>} 成员列表和分页信息
 */
export async function getMembers({ status, limit, offset }) {
  let sql = 'SELECT * FROM members'
  const params = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const members = await query(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM members WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM members'
  const countParams = status ? [status] : []
  const { total } = await queryOne(countSql, countParams)

  return {
    members,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + members.length < total
    }
  }
}

/**
 * 通过 ID 获取成员
 * @param {string} id - 成员 ID
 * @returns {Promise<Object|null>} 成员信息
 */
export async function getMemberById(id) {
  return queryOne('SELECT * FROM members WHERE id = ?', [id])
}

/**
 * 创建成员
 * @param {Object} data - 成员数据
 * @returns {Promise<Object>} 新成员信息
 */
export async function createMember(data) {
  const { name, role, intro, avatar, joinDate } = data
  const id = uuidv4()

  await query(
    'INSERT INTO members (id, name, role, intro, avatar, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, role, intro || null, avatar || null, joinDate || null, 'active']
  )

  return queryOne('SELECT * FROM members WHERE id = ?', [id])
}

/**
 * 更新成员
 * @param {string} id - 成员 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的成员信息
 */
export async function updateMember(id, data) {
  return transaction(async (conn) => {
    const [existingRows] = await conn.execute('SELECT * FROM members WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('成员不存在')
    }

    const { name, role, intro, avatar, status } = data
    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (role !== undefined) {
      updates.push('role = ?')
      values.push(role)
    }
    if (intro !== undefined) {
      updates.push('intro = ?')
      values.push(intro)
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }

    if (updates.length === 0) {
      throw ApiError.badRequest('没有要更新的内容')
    }

    values.push(id)

    await conn.execute(
      `UPDATE members SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    const [rows] = await conn.execute('SELECT * FROM members WHERE id = ?', [id])
    return rows[0]
  })
}

/**
 * 删除成员
 * @param {string} id - 成员 ID
 */
export async function deleteMember(id) {
  const existingMember = await queryOne('SELECT * FROM members WHERE id = ?', [id])

  if (!existingMember) {
    throw ApiError.notFound('成员不存在')
  }

  await query('DELETE FROM members WHERE id = ?', [id])
}
