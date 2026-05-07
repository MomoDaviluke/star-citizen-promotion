/**
 * @file 项目业务服务层
 * @description 封装项目 CRUD 业务逻辑，支持事务保护
 * @module server/services/projectService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface Project {
  id: string
  name: string
  period: string | null
  description: string | null
  status: string
  progress: number
  participants: number
  createdAt?: string
}

export interface GetProjectsOptions {
  status?: string
  limit: number
  offset: number
}

export interface PaginatedProjects {
  projects: Project[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * 获取项目列表
 */
export async function getProjects({ status, limit, offset }: GetProjectsOptions): Promise<PaginatedProjects> {
  let sql = 'SELECT * FROM projects'
  const params: unknown[] = []

  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const projects = await query<Project[]>(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM projects WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM projects'
  const countParams = status ? [status] : []
  const result = await queryOne<{ total: number }>(countSql, countParams)
  const total = result?.total ?? 0

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
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return queryOne<Project>('SELECT * FROM projects WHERE id = ?', [id])
}

/**
 * 创建项目
 */
export async function createProject(data: Partial<Project>): Promise<Project | null> {
  const { name, period, description, status, progress, participants } = data
  const id = uuidv4()

  await query(
    'INSERT INTO projects (id, name, period, description, status, progress, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, period ?? null, description ?? null, status ?? 'planning', progress ?? 0, participants ?? 0]
  )

  return queryOne<Project>('SELECT * FROM projects WHERE id = ?', [id])
}

/**
 * 更新项目
 */
export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return transaction<Project>(async (conn: PoolConnection) => {
    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('项目不存在')
    }

    const { name, period, description, status, progress, participants } = data
    const updates: string[] = []
    const values: unknown[] = []

    const allowedColumns = ['name', 'period', 'description', 'status', 'progress', 'participants']
    const columnMap: Record<string, unknown> = { name, period, description, status, progress, participants }

    for (const col of allowedColumns) {
      if (columnMap[col] !== undefined) {
        updates.push(col)
        values.push(columnMap[col])
      }
    }

    if (updates.length === 0) {
      throw ApiError.badRequest('没有要更新的内容')
    }

    values.push(id)

    const setClause = updates.map((col) => `${col} = ?`).join(', ')

    await conn.execute(
      `UPDATE projects SET ${setClause} WHERE id = ?`,
      values as never
    )

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [id])
    return rows[0] as Project
  })
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<void> {
  const existingProject = await queryOne<Project>('SELECT * FROM projects WHERE id = ?', [id])

  if (!existingProject) {
    throw ApiError.notFound('项目不存在')
  }

  await query('DELETE FROM projects WHERE id = ?', [id])
}
