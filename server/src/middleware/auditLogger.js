/**
 * @file 审计日志中间件
 * @description 自动记录管理操作的审计日志到 activity_logs 表
 * @module server/middleware/auditLogger
 */

import { v4 as uuidv4 } from 'uuid'
import { query } from '../database/pool.js'
import logger from '../utils/logger.js'

/**
 * 需要审计记录的 HTTP 方法
 */
const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * 实体类型映射：从路由路径提取实体名称
 */
const ENTITY_MAP = {
  '/api/members': 'member',
  '/api/pilots': 'pilot',
  '/api/projects': 'project',
  '/api/applications': 'application',
  '/api/auth': 'user',
  '/api/stats': 'stat'
}

/**
 * 操作类型映射
 */
function getAction(method, path) {
  if (method === 'POST') return 'create'
  if (method === 'DELETE') return 'delete'
  if (method === 'PUT' || method === 'PATCH') {
    // 包含 /password 路径视为密码修改
    if (path.includes('/password')) return 'password_change'
    // 包含 /profile 路径视为资料更新
    if (path.includes('/profile')) return 'profile_update'
    return 'update'
  }
  return 'unknown'
}

/**
 * 从请求路径提取实体类型
 */
function getEntityType(path) {
  for (const [prefix, type] of Object.entries(ENTITY_MAP)) {
    if (path.startsWith(prefix)) return type
  }
  return null
}

/**
 * 从请求路径提取实体 ID
 */
function getEntityId(path, params) {
  // 优先从 params 获取
  if (params?.id) return params.id
  // 尝试从路径提取 UUID
  const uuidMatch = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (uuidMatch) return uuidMatch[0]
  return null
}

/**
 * 审计日志中间件
 * @description 对写操作（POST/PUT/PATCH/DELETE）自动记录审计日志
 */
export function auditLogger(req, res, next) {
  // 仅审计写操作
  if (!AUDITED_METHODS.includes(req.method)) {
    return next()
  }

  const entityType = getEntityType(req.url)
  if (!entityType) return next()

  // 捕获原始 res.json 以便在响应后记录
  const originalJson = res.json.bind(res)
  const capturedEntityType = entityType
  res.json = function (data) {
    // 异步写入审计日志，不阻塞响应
    writeAuditLog(req, res.statusCode, data, capturedEntityType).catch((err) => {
      logger.error('审计日志写入失败', { error: err.message })
    })

    return originalJson(data)
  }

  next()
}

/**
 * 写入审计日志
 */
async function writeAuditLog(req, statusCode, responseData, entityType) {
  try {
    const action = getAction(req.method, req.url)
    const entityId = getEntityId(req.url, req.params)
    const details = {
      method: req.method,
      path: req.url,
      statusCode,
      success: responseData?.success ?? (statusCode < 400)
    }

    // 对于非敏感操作，记录请求体（排除密码字段）
    if (req.body && !req.url.includes('/password') && !req.url.includes('/login')) {
      const { password: _pw, currentPassword: _cpw, newPassword: _npw, password_hash: _ph, ...safeBody } = req.body
      details.body = safeBody
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
        req.ip || req.connection?.remoteAddress || null,
        req.get('User-Agent') || null
      ]
    )
  } catch (err) {
    logger.error('审计日志写入失败', { error: err.message })
  }
}

export default auditLogger
