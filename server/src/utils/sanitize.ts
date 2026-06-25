/**
 * @file 请求体脱敏共享工具
 * @description 提供敏感字段识别和递归脱敏功能，统一 requestLogger 与 auditLogger 的脱敏行为。
 *              键名归一化（转小写、移除下划线和连字符）后匹配，脱敏值统一为 [REDACTED]。
 * @module server/utils/sanitize
 * @version 1.0
 */

/**
 * 敏感字段列表（已归一化：小写、无下划线/连字符）
 * @description 合并自原 requestLogger 与 auditLogger 的列表，去重后保留更完整的版本
 */
const SENSITIVE_FIELDS = [
  'password',
  'currentpassword',
  'newpassword',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authtoken',
  'secret',
  'apikey',
  'credential',
  'creditcard',
  'ssn',
  'phone',
  'authorization',
  'cookie'
]

/**
 * 判断字段名是否为敏感字段
 * @description 将键名归一化（转小写、移除下划线和连字符）后与 SENSITIVE_FIELDS 列表匹配。
 *              归一化确保 password_hash、passwordHash、password-hash 均能匹配 passwordhash。
 * @param {string} key - 待检查的字段名
 * @returns {boolean} 若为敏感字段返回 true
 */
export function isSensitiveField(key: string): boolean {
  const normalizedKey = key.toLowerCase().replace(/[_-]/g, '')
  return SENSITIVE_FIELDS.some((field) => normalizedKey.includes(field))
}

/**
 * 递归脱敏对象中的敏感字段
 * @description 深度遍历对象/数组，将敏感字段的值替换为 '[REDACTED]'。
 *              非对象原值返回，null 返回 null。
 * @param {unknown} body - 待脱敏的请求体
 * @returns {unknown} 脱敏后的副本（原对象不被修改）
 */
export function sanitizeBody(body: unknown): unknown {
  if (body === null || typeof body !== 'object') {
    return body
  }

  if (Array.isArray(body)) {
    return body.map((item) =>
      typeof item === 'object' && item !== null ? sanitizeBody(item) : item
    )
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
