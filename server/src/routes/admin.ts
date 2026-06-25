/**
 * @file 管理员路由
 * @description 高风险管理员操作（数据库重置、缓存清除、缓存统计）
 * @module server/routes/admin
 */

import { Router, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { initDatabase } from '../database/init.js'
import { ApiError } from '../middleware/errorHandler.js'
import { queryOne } from '../database/pool.js'
import { clearAllCache, getCacheStats } from '../middleware/cache.js'
import logger from '../utils/logger.js'

const router = Router()

const adminActionValidation = [
  body('confirmPassword').notEmpty().withMessage('请提供确认密码以执行此操作')
]

/** 验证管理员确认密码，防止仅通过身份认证即可执行高危操作 */
async function verifyAdminPassword(userId: string, plainPassword: string): Promise<boolean> {
  const user = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  )
  if (!user || !user.password_hash) return false
  return bcrypt.compare(plainPassword, user.password_hash)
}

router.post(
  '/reset-db',
  authenticate,
  requireAdmin,
  validate(adminActionValidation),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { confirmPassword } = req.body as { confirmPassword: string }
      const isPasswordValid = await verifyAdminPassword(req.user!.id, confirmPassword)
      if (!isPasswordValid) {
        logger.warn('管理员操作密码验证失败', { userId: req.user!.id, action: 'reset-db' })
        throw ApiError.forbidden('确认密码错误，操作被拒绝')
      }

      logger.warn(`[SECURITY] 管理员 ${req.user!.id} 正在执行数据库重置操作`)
      await initDatabase()
      res.json({ success: true, message: '数据库重置成功' })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/clear-cache',
  authenticate,
  requireAdmin,
  validate(adminActionValidation),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { confirmPassword } = req.body as { confirmPassword: string }
      const isPasswordValid = await verifyAdminPassword(req.user!.id, confirmPassword)
      if (!isPasswordValid) {
        logger.warn('管理员操作密码验证失败', { userId: req.user!.id, action: 'clear-cache' })
        throw ApiError.forbidden('确认密码错误，操作被拒绝')
      }

      logger.warn(`[SECURITY] 管理员 ${req.user!.id} 正在执行缓存清除操作`)
      const clearedCount = clearAllCache()
      res.json({ success: true, message: '缓存已清除', cleared: clearedCount })
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  '/cache-stats',
  authenticate,
  requireAdmin,
  (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = getCacheStats()
      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }
)

export default router
