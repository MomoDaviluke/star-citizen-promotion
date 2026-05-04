/**
 * @file 认证授权中间件
 * @description JWT 令牌验证、角色鉴权
 * @module server/middleware/auth
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { ApiError } from './errorHandler.js'
import { queryOne } from '../database/pool.js'

/**
 * 验证 JWT 令牌
 * @description 从 Authorization header 提取并验证 Bearer token，将用户信息注入 req.user
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('缺少认证令牌')
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = {
      id: decoded.userId
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('认证令牌已过期')
    }
    throw ApiError.unauthorized('无效的认证令牌')
  }
}

/**
 * 可选认证中间件
 * @description 即使未携带令牌也不报错，用于公开接口的增强验证
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = { id: decoded.userId }
  } catch {
    // Token 无效或过期，继续处理但不带用户信息
  }

  next()
}

/**
 * 角色鉴权中间件工厂
 * @param {string[]} allowedRoles - 允许的角色列表
 * @returns {Function} Express 中间件函数
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      throw ApiError.unauthorized('请先登录')
    }

    const user = await queryOne(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    )

    if (!user) {
      throw ApiError.unauthorized('用户不存在')
    }

    if (!allowedRoles.includes(user.role)) {
      throw ApiError.forbidden('权限不足，无权访问此资源')
    }

    req.user.role = user.role
    next()
  }
}

/**
 * 管理员鉴权中间件
 * @description requireRole('admin') 的快捷方式
 */
export const requireAdmin = requireRole('admin')
