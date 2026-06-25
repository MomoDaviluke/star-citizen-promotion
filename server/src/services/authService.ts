/**
 * @file 认证业务服务层
 * @description 封装用户注册、登录、资料管理等业务逻辑，支持事务保护
 * @module server/services/authService
 */

import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { config } from '../config/index.js'
import { generateToken, verifyToken } from '../utils/jwt.js'
import { queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string | null
  createdAt?: string
}

export interface AuthResult {
  user: User
  token: string
}

/**
 * 用户注册
 */
export async function registerUser({ username, email, password }: {
  username: string
  email: string
  password: string
}): Promise<AuthResult> {
  return transaction<AuthResult>(async (conn: PoolConnection) => {
    const [existingUsers] = await conn.execute<RowDataPacket[]>(
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

    const token = generateToken({ userId })

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
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = await queryOne<{
    id: string
    username: string
    email: string
    role: string
    avatar: string | null
    password_hash: string
  }>('SELECT id, username, email, role, avatar, password_hash FROM users WHERE email = ?', [email])

  if (!user) {
    throw ApiError.unauthorized('邮箱或密码错误')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    throw ApiError.unauthorized('邮箱或密码错误')
  }

  const token = generateToken({ userId: user.id })

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
 */
export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<
    { id: string; username: string; email: string; role: string; avatar: string | null; created_at: string }
  >(
    'SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?',
    [userId]
  )
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(userId: string, { username, avatar }: {
  username?: string
  avatar?: string
}): Promise<User> {
  return transaction<User>(async (conn: PoolConnection) => {
    const updates: string[] = []
    const values: unknown[] = []

    if (username) {
      const [existing] = await conn.execute<RowDataPacket[]>(
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
      values as never
    )

    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?',
      [userId]
    )

    return rows[0] as User
  })
}

/**
 * 修改密码
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  return transaction<void>(async (conn: PoolConnection) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    )

    if (rows.length === 0) {
      throw ApiError.notFound('用户不存在')
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, (rows[0] as { password_hash: string }).password_hash)
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
 */
export async function refreshUserToken(token: string): Promise<{ token: string }> {
  let decoded: { userId: string }
  try {
    decoded = verifyToken(token) as { userId: string }
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      throw ApiError.unauthorized('令牌已过期，请重新登录')
    }
    throw ApiError.unauthorized('无效的认证令牌')
  }

  const user = await queryOne<{ id: string; role: string }>(
    'SELECT id, role FROM users WHERE id = ?',
    [decoded.userId]
  )
  if (!user) {
    throw ApiError.unauthorized('用户不存在')
  }

  const newToken = generateToken({ userId: user.id })

  return { token: newToken }
}
