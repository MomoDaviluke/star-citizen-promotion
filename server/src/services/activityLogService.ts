/**
 * @file 活动日志业务服务层
 * @description 查询 activity_logs 表，供管理员仪表盘展示近期操作记录
 * @module server/services/activityLogService
 */

import { RowDataPacket } from 'mysql2/promise'
import { query, queryOne } from '../database/pool.js'

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: unknown
  ip_address: string | null
  user_agent: string | null
  created_at: string
  /** JOIN users 表得到的操作人用户名（可能为空） */
  username?: string | null
}

export interface GetActivityLogsOptions {
  action?: string
  userId?: string
  limit: number
  offset: number
}

export interface PaginatedActivityLogs {
  logs: ActivityLog[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * 分页查询活动日志
 * @description LEFT JOIN users 表获取操作人用户名，user_id 可能为空（如未认证操作）
 */
export async function getActivityLogs({
  action,
  userId,
  limit,
  offset
}: GetActivityLogsOptions): Promise<PaginatedActivityLogs> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (action) {
    conditions.push('a.action = ?')
    params.push(action)
  }

  if (userId) {
    conditions.push('a.user_id = ?')
    params.push(userId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT a.*, u.username
    FROM activity_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `
  const queryParams = [...params, limit, offset]
  const logs = await query<ActivityLog[]>(sql, queryParams)

  const countSql = conditions.length > 0
    ? `SELECT COUNT(*) as total FROM activity_logs WHERE ${conditions.join(' AND ')}`
    : 'SELECT COUNT(*) as total FROM activity_logs'
  const countResult = await queryOne<{ total: number }>(countSql, params)
  const total = countResult?.total ?? 0

  return {
    logs,
    pagination: { total, limit, offset, hasMore: offset + logs.length < total }
  }
}

/**
 * 记录活动日志
 * @description 供 auditLogger 等中间件调用，写入一条活动日志
 */
export async function logActivity(data: {
  userId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  details?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  const { v4: uuidv4 } = await import('uuid')
  const id = uuidv4()

  await query(
    `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId ?? null,
      data.action,
      data.entityType ?? null,
      data.entityId ?? null,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress ?? null,
      data.userAgent ?? null
    ]
  )
}

// 避免 RowDataPacket 未使用警告（类型在 query 泛型中使用）
export type _RowDataPacketRef = RowDataPacket
