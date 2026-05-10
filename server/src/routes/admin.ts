import { Router, Response, NextFunction } from 'express'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { initDatabase } from '../database/init.js'

const router = Router()

router.post('/reset-db', authenticate, requireAdmin, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await initDatabase()

    res.json({
      success: true,
      message: '数据库重置成功'
    })
  } catch (error) {
    next(error)
  }
})

router.post('/clear-cache', authenticate, requireAdmin, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: '缓存已清除'
    })
  } catch (error) {
    next(error)
  }
})

export default router
