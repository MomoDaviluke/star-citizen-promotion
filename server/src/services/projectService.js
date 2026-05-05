/**
 * @file 项目业务服务层
 * @description 封装项目 CRUD 业务逻辑，支持事务保护
 * @module server/services/projectService
 */

import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

/**
 * 获取项目列表
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态筛选
 * @param {number} options.limit - 分页大小
 * @param {number} options.offset - 分页偏移
 * @returns {Promise<Object>} 项目列表和分页信息
 */
export async function getProjects({ status, limit, offset }) {
  let sql = 'SELECT * FROM projects'
  const params = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const projects = await query(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM projects WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM projects'
  const countParams = status ? [status] : []
  const { total } = await queryOne(countSql, countParams)

  return {
    projects,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + projects.length < total
    }
  }
}

/**
 * 通过 ID 获取项目
 * @param {string} id - 项目 ID
 * @returns {Promise<Object|null>} 项目信息
 */
export async function getProjectById(id) {
  return queryOne('SELECT * FROM projects WHERE id = ?', [id])
}

/**
 * 创建项目
 * @param {Object} data - 项目数据
 * @returns {Promise<Object>} 新项目信息
 */
export async function createProject(data) {
  const { name, period, description, status, progress, participants } = data
  const id = uuidv4()

  await query(
    'INSERT INTO projects (id, name, period, description, status, progress, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, period || null, description || null, status || 'planning', progress || 0, participants || 0]
  )

  return queryOne('SELECT * FROM projects WHERE id = ?', [id])
}

/**
 * 更新项目
 * @param {string} id - 项目 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的项目信息
 */
export async function updateProject(id, data) {
  return transaction(async (conn) => {
    const [existingRows] = await conn.execute('SELECT * FROM projects WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('项目不存在')
    }

    const { name, period, description, status, progress, participants } = data
    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (period !== undefined) {
      updates.push('period = ?')
      values.push(period)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (progress !== undefined) {
      updates.push('progress = ?')
      values.push(progress)
    }
    if (participants !== undefined) {
      updates.push('participants = ?')
      values.push(participants)
    }

    if (updates.length === 0) {
      throw ApiError.badRequest('没有要更新的内容')
    }

    values.push(id)

    await conn.execute(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    const [rows] = await conn.execute('SELECT * FROM projects WHERE id = ?', [id])
    return rows[0]
  })
}

/**
 * 删除项目
 * @param {string} id - 项目 ID
 */
export async function deleteProject(id) {
  const existingProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id])

  if (!existingProject) {
    throw ApiError.notFound('项目不存在')
  }

  await query('DELETE FROM projects WHERE id = ?', [id])
}
