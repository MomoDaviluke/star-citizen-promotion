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
import logger from '../utils/logger.js'

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
 * @description 从 Authorization header 提取并验证 Bearer token，将用户信息注入 req.user
 */
export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null)

  if (!token) {
    next(ApiError.unauthorized('缺少认证令牌'))
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string }

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
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      next(ApiError.unauthorized('认证令牌已过期'))
      return
    }
    if ((err as Error).name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('无效的认证令牌'))
      return
    }
    logger.error('认证验证失败', { error: (err as Error).message })
    next(ApiError.internal('认证验证失败'))
  }
}

/**
 * 可选认证中间件
 * @description 即使未携带令牌也不报错，用于公开接口的增强验证
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null)

  if (!token) {
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string }
    const user = await queryOne<{ id: string; role: string }>(
      'SELECT id, role FROM users WHERE id = ?',
      [decoded.userId]
    )
    if (user) {
      req.user = { id: user.id, role: user.role }
    }
  } catch (err) {
    logger.debug('可选认证令牌无效', {
      error: (err as Error).message,
      ip: req.ip
    })
  }

  next()
}

/**
 * 角色鉴权中间件工厂
 * @param allowedRoles - 允许的角色列表
 * @returns Express 中间件函数
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.id) {
      next(ApiError.unauthorized('请先登录'))
      return
    }

    try {
      const user = await queryOne<{ role: string }>(
        'SELECT role FROM users WHERE id = ?',
        [req.user.id]
      )

      if (!user) {
        next(ApiError.unauthorized('用户不存在'))
        return
      }

      if (!allowedRoles.includes(user.role)) {
        next(ApiError.forbidden('权限不足，无权访问此资源'))
        return
      }

      req.user.role = user.role
      next()
    } catch {
      next(ApiError.internal('权限验证失败'))
    }
  }
}

/**
 * 管理员鉴权中间件
 * @description requireRole('admin') 的快捷方式
 */
export const requireAdmin = requireRole('admin')
