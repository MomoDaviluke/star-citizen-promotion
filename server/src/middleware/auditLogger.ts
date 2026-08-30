/**
 * @file 审计日志中间件
 * @description 自动记录管理操作的审计日志到 activity_logs 表
 * @module server/middleware/auditLogger
 */

import { v4 as uuidv4 } from 'uuid'
import { Response, NextFunction } from 'express'
import { query } from '../database/pool.js'
import logger from '../utils/logger.js'
import { sanitizeBody } from '../utils/sanitizeBody.js'
import { AuthenticatedRequest } from './auth.js'
import { ResultSetHeader } from 'mysql2/promise'

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const ENTITY_MAP: Record<string, string> = {
  '/api/members': 'member',
  '/api/pilots': 'pilot',
  '/api/projects': 'project',
  '/api/applications': 'application',
  '/api/auth': 'user',
  '/api/stats': 'stat'
}

function getAction(method: string, path: string): string {
  if (method === 'POST') return 'create'
  if (method === 'DELETE') return 'delete'
  if (method === 'PUT' || method === 'PATCH') {
    if (path.includes('/password')) return 'password_change'
    if (path.includes('/profile')) return 'profile_update'
    return 'update'
  }
  return 'unknown'
}

function getEntityType(path: string): string | null {
  for (const [prefix, type] of Object.entries(ENTITY_MAP)) {
    if (path.startsWith(prefix)) return type
  }
  return null
}

function getEntityId(path: string, params?: Record<string, string>): string | null {
  if (params?.id) return params.id
  const uuidMatch = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (uuidMatch) return uuidMatch[0]
  return null
}

const AUDIT_LOG_RETENTION_DAYS = 90

export async function cleanupAuditLogs(): Promise<number> {
  try {
    const result = await query<ResultSetHeader>(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [AUDIT_LOG_RETENTION_DAYS]
    )
    if (result.affectedRows > 0) {
      logger.info('审计日志清理完成', {
        retentionDays: AUDIT_LOG_RETENTION_DAYS,
        deletedRows: result.affectedRows
      })
    }
    return result.affectedRows
  } catch (err) {
    logger.error('审计日志清理失败', { error: (err as Error).message })
    return 0
  }
}

export function startAuditCleanupJob(): void {
  const now = new Date()
  const next3am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 3, 0, 0)
  const msUntil3am = next3am.getTime() - now.getTime()

  setTimeout(() => {
    cleanupAuditLogs()
    setInterval(cleanupAuditLogs, 24 * 60 * 60 * 1000)
  }, msUntil3am)

  logger.info('审计日志定时清理任务已启动', { firstRun: next3am.toISOString() })
}

export function auditLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!AUDITED_METHODS.includes(req.method)) {
    next()
    return
  }

  const entityType = getEntityType(req.url)
  if (!entityType) {
    next()
    return
  }

  const originalJson = res.json.bind(res)
  const capturedEntityType = entityType
  res.json = function (data: unknown) {
    writeAuditLog(req, res.statusCode, data, capturedEntityType).catch((err) => {
      logger.error('审计日志写入失败', { error: (err as Error).message })
    })

    return originalJson(data)
  }

  next()
}

interface AuditDetails {
  method: string
  path: string
  statusCode: number
  success: boolean
  body?: unknown
}

async function writeAuditLog(
  req: AuthenticatedRequest,
  statusCode: number,
  responseData: unknown,
  entityType: string
): Promise<void> {
  try {
    const action = getAction(req.method, req.url)
    const entityId = getEntityId(req.url, req.params as Record<string, string>)
    const details: AuditDetails = {
      method: req.method,
      path: req.url,
      statusCode,
      success: (responseData as { success?: boolean })?.success ?? (statusCode < 400)
    }

    if (req.body && !req.url.includes('/password') && !req.url.includes('/login')) {
      details.body = sanitizeBody(req.body)
    }

    await query(
      `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user?.id || null,
        action,
        entityType,
        entityId,
        JSON.stringify(details),
        req.ip || null,
        req.get('User-Agent') || null
      ]
    )
  } catch (err) {
    logger.error('审计日志写入失败', { error: (err as Error).message })
  }
}

export default auditLogger
