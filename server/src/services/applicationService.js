/**
 * @file 申请业务服务层
 * @description 封装入队申请业务逻辑，支持事务保护
 * @module server/services/applicationService
 */

import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

/**
 * 获取申请列表
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态筛选
 * @param {number} options.limit - 分页大小
 * @param {number} options.offset - 分页偏移
 * @returns {Promise<Object>} 申请列表和分页信息
 */
export async function getApplications({ status, limit, offset }) {
  let sql = `
    SELECT a.*, u.username as reviewer_name
    FROM applications a
    LEFT JOIN users u ON a.reviewed_by = u.id
  `
  const params = []

  if (status) {
    sql += ' WHERE a.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const applications = await query(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM applications WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM applications'
  const countParams = status ? [status] : []
  const { total } = await queryOne(countSql, countParams)

  return {
    applications,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + applications.length < total
    }
  }
}

/**
 * 通过 ID 获取申请
 * @param {string} id - 申请 ID
 * @returns {Promise<Object|null>} 申请信息
 */
export async function getApplicationById(id) {
  return queryOne(
    `SELECT a.*, u.username as reviewer_name
     FROM applications a
     LEFT JOIN users u ON a.reviewed_by = u.id
     WHERE a.id = ?`,
    [id]
  )
}

/**
 * 提交入队申请
 * @param {Object} data - 申请数据
 * @returns {Promise<Object>} 新申请信息
 */
export async function submitApplication(data) {
  return transaction(async (conn) => {
    const { name, email, discord, experience, availability, reason } = data

    // 检查 24 小时内是否已提交
    const [recentRows] = await conn.execute(
      `SELECT id, created_at FROM applications
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [email]
    )

    if (recentRows.length > 0) {
      throw ApiError.conflict('您已提交过申请，请等待审核')
    }

    const id = uuidv4()

    await conn.execute(
      `INSERT INTO applications (id, name, email, discord, experience, availability, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, discord || null, experience || null, availability || null, reason || null, 'pending']
    )

    const [rows] = await conn.execute('SELECT * FROM applications WHERE id = ?', [id])
    return rows[0]
  })
}

/**
 * 更新申请状态
 * @param {string} id - 申请 ID
 * @param {string} status - 新状态
 * @param {string} reviewerId - 审核人 ID
 * @param {string} [note] - 审核备注
 * @returns {Promise<Object>} 更新后的申请信息
 */
export async function updateApplicationStatus(id, status, reviewerId, note) {
  return transaction(async (conn) => {
    const [existingRows] = await conn.execute(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    )

    if (existingRows.length === 0) {
      throw ApiError.notFound('申请不存在')
    }

    await conn.execute(
      `UPDATE applications
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), note = ?
       WHERE id = ?`,
      [status, reviewerId, note || null, id]
    )

    const [rows] = await conn.execute(
      `SELECT a.*, u.username as reviewer_name
       FROM applications a
       LEFT JOIN users u ON a.reviewed_by = u.id
       WHERE a.id = ?`,
      [id]
    )

    return rows[0]
  })
}

/**
 * 删除申请
 * @param {string} id - 申请 ID
 */
export async function deleteApplication(id) {
  const existingApplication = await queryOne('SELECT * FROM applications WHERE id = ?', [id])

  if (!existingApplication) {
    throw ApiError.notFound('申请不存在')
  }

  await query('DELETE FROM applications WHERE id = ?', [id])
}
