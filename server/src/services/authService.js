/**
 * @file 认证业务服务层
 * @description 封装用户注册、登录、资料管理等业务逻辑，支持事务保护
 * @module server/services/authService
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config/index.js'
import { queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @param {string} userData.username - 用户名
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 * @returns {Promise<Object>} 新用户信息和令牌
 */
export async function registerUser({ username, email, password }) {
  return transaction(async (conn) => {
    // 检查用户名或邮箱是否已存在
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    )

    if (existingUsers.length > 0) {
      throw ApiError.conflict('用户名或邮箱已被注册')
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds)
    const userId = uuidv4()

    await conn.execute(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, username, email, passwordHash, 'member']
    )

    const token = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    return {
      user: {
        id: userId,
        username,
        email,
        role: 'member'
      },
      token
    }
  })
}

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<Object>} 用户信息和令牌
 */
export async function loginUser(email, password) {
  const user = await queryOne('SELECT * FROM users WHERE email = ?', [email])

  if (!user) {
    throw ApiError.unauthorized('邮箱或密码错误')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    throw ApiError.unauthorized('邮箱或密码错误')
  }

  const token = jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    },
    token
  }
}

/**
 * 通过 ID 获取用户信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object|null>} 用户信息
 */
export async function getUserById(userId) {
  return queryOne(
    'SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?',
    [userId]
  )
}

/**
 * 更新用户资料
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的用户信息
 */
export async function updateUserProfile(userId, { username, avatar }) {
  return transaction(async (conn) => {
    const updates = []
    const values = []

    if (username) {
      const [existing] = await conn.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      )
      if (existing.length > 0) {
        throw ApiError.conflict('用户名已被使用')
      }
      updates.push('username = ?')
      values.push(username)
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }

    if (updates.length === 0) {
      throw ApiError.badRequest('没有要更新的内容')
    }

    values.push(userId)

    await conn.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    )

    const [rows] = await conn.execute(
      'SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?',
      [userId]
    )

    return rows[0]
  })
}

/**
 * 修改密码
 * @param {string} userId - 用户 ID
 * @param {string} currentPassword - 当前密码
 * @param {string} newPassword - 新密码
 */
export async function changePassword(userId, currentPassword, newPassword) {
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    )

    if (rows.length === 0) {
      throw ApiError.notFound('用户不存在')
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash)
    if (!isPasswordValid) {
      throw ApiError.unauthorized('当前密码错误')
    }

    const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds)

    await conn.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    )
  })
}

/**
 * 刷新访问令牌
 * @param {string} token - 当前令牌
 * @returns {Promise<Object>} 新令牌
 */
export async function refreshUserToken(token) {
  let decoded
  try {
    decoded = jwt.verify(token, config.jwt.secret)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('令牌已过期，请重新登录')
    }
    throw ApiError.unauthorized('无效的认证令牌')
  }

  const user = await queryOne('SELECT id, role FROM users WHERE id = ?', [decoded.userId])
  if (!user) {
    throw ApiError.unauthorized('用户不存在')
  }

  const newToken = jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  return { token: newToken }
}
