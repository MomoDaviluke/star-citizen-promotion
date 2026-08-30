/**
 * @file 请求体脱敏工具
 * @description 递归脱敏请求体中的敏感字段（密码/令牌/密钥/凭据/联系方式等），
 *              auditLogger 与 requestLogger 统一复用，消除重复实现。
 *              匹配规则：字段名小写并去除 `-`/`_` 后，检查是否包含任一敏感词。
 * @module server/utils/sanitizeBody
 */

const SENSITIVE_FIELDS = [
  'password', // 覆盖 password / currentPassword / password_hash / newPassword
  'token', // 覆盖 token / accessToken / refreshToken / auth_token
  'secret',
  'apikey', // 覆盖 apiKey / api_key
  'credential',
  'ssn',
  'creditcard', // 覆盖 creditCard / credit_card
  'phone',
  'authorization',
  'cookie'
]

/** 归一化字段名：小写 + 去除 `-`/`_` */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '')
}

/**
 * 判断字段名是否命中敏感字段
 * @param {string} key - 字段名
 * @returns {boolean} 命中返回 true
 */
export function isSensitiveField(key: string): boolean {
  const lowerKey = normalizeKey(key)
  return SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))
}

/**
 * 递归脱敏请求体
 * @param {unknown} body - 原始请求体（对象 / 数组 / 基本类型）
 * @returns {unknown} 脱敏后的副本；非对象值原样返回
 */
export function sanitizeBody(body: unknown): unknown {
  if (body === null || typeof body !== 'object') {
    return body
  }

  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export default sanitizeBody