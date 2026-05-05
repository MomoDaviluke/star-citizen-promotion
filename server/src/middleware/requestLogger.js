/**
 * @file 请求日志中间件
 * @description 记录 HTTP 请求详情，使用 Winston 结构化日志，自动脱敏敏感字段
 * @module server/middleware/requestLogger
 */

import logger from '../utils/logger.js'

/**
 * 敏感字段列表
 * @type {string[]}
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'auth_token',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'ssn',
  'phone',
  'authorization',
  'cookie'
]

/**
 * 检查字段名是否敏感
 * @param {string} key - 字段名
 * @returns {boolean}
 */
function isSensitiveField(key) {
  const lowerKey = key.toLowerCase()
  return SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))
}

/**
 * 递归脱敏对象中的敏感字段
 * @param {Object} body - 请求体对象
 * @returns {Object} 脱敏后的对象
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sanitized = {}
  for (const [key, value] of Object.entries(body)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '***REDACTED***'
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === 'object' && item !== null ? sanitizeBody(item) : item))
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * 请求日志中间件
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now()

  const originalEnd = res.end
  res.end = function (...args) {
    const responseTime = Date.now() - startTime

    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent') || '-',
      contentLength: res.get('Content-Length') || 0,
      requestId: req.id || '-'
    }

    // 仅在开发环境记录请求体，且脱敏处理
    if (process.env.NODE_ENV === 'development' && req.body) {
      logData.body = sanitizeBody(req.body)
    }

    if (res.statusCode >= 400) {
      logger.error('请求失败', logData)
    } else {
      logger.info('请求', logData)
    }

    originalEnd.apply(res, args)
  }

  next()
}

export default requestLogger
