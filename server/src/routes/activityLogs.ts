/**
 * @file 活动日志路由
 * @description 查询系统活动日志（管理员专用）
 * @module server/routes/activityLogs
 */

import { Router, Response, NextFunction } from 'express'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import { getActivityLogs } from '../services/activityLogService.js'

const router = Router()

/**
 * 获取活动日志列表
 * @description 管理员专用，支持按 action/userId 筛选，分页返回
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
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
