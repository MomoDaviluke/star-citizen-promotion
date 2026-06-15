/**
 * @file 认证授权中间件
 * @description JWT 令牌验证、角色鉴权
 * @module server/middleware/auth
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { ApiError } from './errorHandler.js'
import { queryOne } from '../database/pool.js'

export interface AuthenticatedUser {
  id: string
  role?: string
  email?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser
}

/**
 * 验证 JWT 令牌
 * @description 从 cookie 或 Authorization header 提取并验证 JWT token
 *              解码后查询数据库验证用户是否仍然存在，防止已删除用户的 Token 继续有效
 *              将用户信息（id, role）注入 req.user
 */
export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null)

  if (!token) {
    next(ApiError.unauthorized('缺少认证令牌'))
    return
  }

  // 验证 JWT 签名和有效期
  let decoded: { userId: string }
  try {
    decoded = jwt.verify(token, config.jwt.secret) as { userId: string }
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      next(ApiError.unauthorized('认证令牌已过期'))
      return
    }
    next(ApiError.unauthorized('无效的认证令牌'))
    return
  }

  // 验证用户是否仍然存在且未被禁用，防止已删除用户的 Token 继续有效
  try {
    const user = await queryOne<{ id: string; role: string }>(
      'SELECT id, role FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (!user) {
      next(ApiError.unauthorized('用户不存在或已被禁用'))
      return
    }

    req.user = {
      id: user.id,
      role: user.role
    }
    next()
  } catch {
    next(ApiError.internal('认证验证失败'))
  }
}

/**
 * 可选认证中间件
 * @description 即使未携带令牌也不报错，用于公开接口的增强验证
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null)

  if (!token) {
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string }
    req.user = { id: decoded.userId }
  } catch {
    // Token 无效或过期，继续处理但不带用户信息
  }

  next()
}

/**
 * 角色鉴权中间件工厂
 * @param allowedRoles - 允许的角色列表
 * @returns Express 中间件函数
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.id) {
      next(ApiError.unauthorized('请先登录'))
      return
    }

    // authenticate 已将 role 注入 req.user，无需重复查库
    const userRole = req.user.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      next(ApiError.forbidden('权限不足，无权访问此资源'))
      return
    }

    next()
  }
}

/**
 * 管理员鉴权中间件
 * @description requireRole('admin') 的快捷方式
 */
export const requireAdmin = requireRole('admin')
