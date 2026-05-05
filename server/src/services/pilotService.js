/**
 * @file 飞行员业务服务层
 * @description 封装飞行员 CRUD 业务逻辑，支持事务保护
 * @module server/services/pilotService
 */

import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

/**
 * 获取飞行员列表
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态筛选
 * @param {number} options.limit - 分页大小
 * @param {number} options.offset - 分页偏移
 * @returns {Promise<Object>} 飞行员列表和分页信息
 */
export async function getPilots({ status, limit, offset }) {
  let sql = 'SELECT * FROM pilots'
  const params = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY missions DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const pilots = await query(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM pilots WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM pilots'
  const countParams = status ? [status] : []
  const { total } = await queryOne(countSql, countParams)

  return {
    pilots,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + pilots.length < total
    }
  }
}

/**
 * 通过 ID 获取飞行员
 * @param {string} id - 飞行员 ID
 * @returns {Promise<Object|null>} 飞行员信息
 */
export async function getPilotById(id) {
  return queryOne('SELECT * FROM pilots WHERE id = ?', [id])
}

/**
 * 创建飞行员
 * @param {Object} data - 飞行员数据
 * @returns {Promise<Object>} 新飞行员信息
 */
export async function createPilot(data) {
  const { name, callsign, ship, description, image, missions, kills } = data
  const id = uuidv4()

  await query(
    `INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, callsign, ship, description || null, image || null, missions || 0, kills || 0, 'active']
  )

  return queryOne('SELECT * FROM pilots WHERE id = ?', [id])
}

/**
 * 更新飞行员
 * @param {string} id - 飞行员 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的飞行员信息
 */
export async function updatePilot(id, data) {
  return transaction(async (conn) => {
    const [existingRows] = await conn.execute('SELECT * FROM pilots WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('飞行员不存在')
    }

    const { name, callsign, ship, description, image, missions, kills, status } = data
    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (callsign !== undefined) {
      updates.push('callsign = ?')
      values.push(callsign)
    }
    if (ship !== undefined) {
      updates.push('ship = ?')
      values.push(ship)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (image !== undefined) {
      updates.push('image = ?')
      values.push(image)
    }
    if (missions !== undefined) {
      updates.push('missions = ?')
      values.push(missions)
    }
    if (kills !== undefined) {
      updates.push('kills = ?')
      values.push(kills)
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
      `UPDATE pilots SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    const [rows] = await conn.execute('SELECT * FROM pilots WHERE id = ?', [id])
    return rows[0]
  })
}

/**
 * 删除飞行员
 * @param {string} id - 飞行员 ID
 */
export async function deletePilot(id) {
  const existingPilot = await queryOne('SELECT * FROM pilots WHERE id = ?', [id])

  if (!existingPilot) {
    throw ApiError.notFound('飞行员不存在')
  }

  await query('DELETE FROM pilots WHERE id = ?', [id])
}
