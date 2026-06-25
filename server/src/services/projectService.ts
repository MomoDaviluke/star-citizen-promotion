/**
 * @file 项目业务服务层
 * @description 封装项目 CRUD 业务逻辑，支持事务保护
 * @module server/services/projectService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection } from 'mysql2/promise'
import { query, transaction } from '../database/pool.js'
import { paginatedQuery } from '../database/paginatedQuery.js'
import { buildUpdateSet } from '../database/buildUpdateSet.js'
import { findById, findByIdInTx, requireByIdInTx } from '../database/findById.js'
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

/** 获取项目列表（分页） */
export async function getProjects({ status, limit, offset }: GetProjectsOptions): Promise<PaginatedProjects> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const result = await paginatedQuery<Project>({
    from: 'projects',
    conditions,
    params,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit,
    offset
  })

  return {
    projects: result.rows,
    pagination: result.pagination
  }
}

/**
 * 通过 ID 获取项目
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return findById<Project>('projects', id)
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

  return findById<Project>('projects', id)
}

/** 更新项目 */
export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return transaction<Project>(async (conn: PoolConnection) => {
    await requireByIdInTx<Project>(conn, 'projects', id, ApiError.notFound('项目不存在'))

    const allowedColumns = ['name', 'period', 'description', 'status', 'progress', 'participants']
    const { setClause, values } = buildUpdateSet(data as Record<string, unknown>, allowedColumns)
    if (!setClause) throw ApiError.badRequest('没有要更新的内容')

    await conn.execute(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, id] as never)

    return findByIdInTx<Project>(conn, 'projects', id) as Promise<Project>
  })
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<void> {
  const existingProject = await findById<Project>('projects', id)

  if (!existingProject) {
    throw ApiError.notFound('项目不存在')
  }

  await query('DELETE FROM projects WHERE id = ?', [id])
}
