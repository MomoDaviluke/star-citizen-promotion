/**
 * @file 申请业务服务层
 * @description 封装入队申请业务逻辑，支持事务保护
 * @module server/services/applicationService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface Application {
  id: string
  name: string
  email: string
  discord: string | null
  experience: string | null
  availability: string | null
  reason: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  note: string | null
  reviewerName?: string | null
  createdAt?: string
}

export interface GetApplicationsOptions {
  status?: string
  limit: number
  offset: number
}

export interface PaginatedApplications {
  applications: Application[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * 获取申请列表
 */
export async function getApplications({ status, limit, offset }: GetApplicationsOptions): Promise<PaginatedApplications> {
  let sql = `
    SELECT a.*, u.username as reviewer_name
    FROM applications a
    LEFT JOIN users u ON a.reviewed_by = u.id
  `
  const params: unknown[] = []

  if (status) {
    sql += ' WHERE a.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const applications = await query<Application[]>(sql, params)

  const countSql = status
    ? 'SELECT COUNT(*) as total FROM applications WHERE status = ?'
    : 'SELECT COUNT(*) as total FROM applications'
  const countParams = status ? [status] : []
  const result = await queryOne<{ total: number }>(countSql, countParams)
  const total = result?.total ?? 0

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
 */
export async function getApplicationById(id: string): Promise<Application | null> {
  return queryOne<Application>(
    `SELECT a.*, u.username as reviewer_name
     FROM applications a
     LEFT JOIN users u ON a.reviewed_by = u.id
     WHERE a.id = ?`,
    [id]
  )
}

/**
 * 提交入队申请
 */
export async function submitApplication(data: {
  name: string
  email: string
  discord?: string
  experience?: string
  availability?: string
  reason?: string
}): Promise<Application> {
  return transaction<Application>(async (conn: PoolConnection) => {
    const { name, email, discord, experience, availability, reason } = data

    const [recentRows] = await conn.execute<RowDataPacket[]>(
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
      [id, name, email, discord ?? null, experience ?? null, availability ?? null, reason ?? null, 'pending']
    )

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM applications WHERE id = ?', [id])
    return rows[0] as Application
  })
}

/**
 * 更新申请状态
 */
export async function updateApplicationStatus(
  id: string,
  status: string,
  reviewerId: string,
  note?: string
): Promise<Application> {
  return transaction<Application>(async (conn: PoolConnection) => {
    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM applications WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('申请不存在')
    }

    await conn.execute(
      `UPDATE applications
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), note = ?
       WHERE id = ?`,
      [status, reviewerId, note ?? null, id]
    )

    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT a.*, u.username as reviewer_name
       FROM applications a
       LEFT JOIN users u ON a.reviewed_by = u.id
       WHERE a.id = ?`,
      [id]
    )

    return rows[0] as Application
  })
}

/**
 * 删除申请
 */
export async function deleteApplication(id: string): Promise<void> {
  const existingApplication = await queryOne<Application>('SELECT * FROM applications WHERE id = ?', [id])

  if (!existingApplication) {
    throw ApiError.notFound('申请不存在')
  }

  await query('DELETE FROM applications WHERE id = ?', [id])
}
