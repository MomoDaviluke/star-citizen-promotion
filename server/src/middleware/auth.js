/**
 * @file 认证中间件
 * @description JWT 令牌验证和用户身份确认
 * @module server/middleware/auth
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { ApiError } from './errorHandler.js'
import { queryOne } from '../database/pool.js'

/**
 * 验证 JWT 令牌中间件
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('缺少认证令牌')
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, config.jwt.secret)

    const user = await queryOne(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (!user) {
      throw ApiError.unauthorized('用户不存在')
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof ApiError) {
      next(error)
    } else if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('无效的认证令牌'))
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('认证令牌已过期'))
    } else {
      next(error)
    }
  }
}

/**
 * 可选认证中间件 - 不强制要求登录
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null
      return next()
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, config.jwt.secret)

    const user = await queryOne(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    )

    req.user = user || null
    next()
  } catch {
    req.user = null
    next()
  }
}

/**
 * 角色权限验证中间件
 * @param {...string} roles - 允许的角色列表
 * @returns {Function} Express 中间件
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('需要登录'))
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('权限不足'))
    }

    next()
  }
}

/**
 * 管理员权限中间件
 */
export const requireAdmin = requireRole('admin')

export default authenticate
