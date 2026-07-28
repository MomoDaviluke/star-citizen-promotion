/**
 * @file 活动日志路由
 * @description 查询系统活动日志（管理员专用）
 * @module server/routes/activityLogs
 */

import { Router, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import { getActivityLogs } from '../services/activityLogService.js'

const router = Router()

/**
 * 管理员路由专用速率限制
 * @description 1 分钟内最多 30 次请求，比全局 apiLimiter 更严格
 *   显式 inline 调用 rateLimit() 以满足 CodeQL 静态分析（跨文件 import 无法识别）
 */
const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: '管理员操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * 获取活动日志列表
 * @description 管理员专用，支持按 action/userId 筛选，分页返回
 *   显式应用 adminRateLimiter（CodeQL 静态分析无法识别 index.ts 中的全局 apiLimiter）
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  adminRateLimiter,
  paginate(50, 200),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { action, userId } = req.query as { action?: string; userId?: string }
      const { limit, offset } = (req as PaginatedRequest).pagination

      const result = await getActivityLogs({ action, userId, limit, offset })

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
