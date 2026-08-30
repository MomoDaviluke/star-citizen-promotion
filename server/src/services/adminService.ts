/**
 * @file 管理员服务
 * @description 管理员高风险操作的服务层封装（密码验证、审计辅助）
 *              遵循 Routes → Services → Database 分层约束
 * @module server/services/adminService
 */

import bcrypt from 'bcryptjs'
import { queryOne } from '../database/pool.js'

/**
 * 验证管理员确认密码
 * @description 防止仅通过身份认证即可执行高危操作。
 *              通过用户 ID 查询密码哈希并与明文密码比对。
 * @param {string} userId - 用户 ID
 * @param {string} plainPassword - 明文确认密码
 * @returns {Promise<boolean>} 密码匹配返回 true，否则 false
 */
export async function verifyAdminPassword(userId: string, plainPassword: string): Promise<boolean> {
  const user = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  )
  if (!user || !user.password_hash) return false
  return bcrypt.compare(plainPassword, user.password_hash)
}
