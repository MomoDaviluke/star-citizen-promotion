/**
 * @file 站点设置路由
 * @description 站点配置的读取与更新
 * @module server/routes/settings
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { getAllSettings, updateSettings } from '../services/settingsService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getAllSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
})

router.put(
  '/',
  authenticate,
  requireAdmin,
  validate([body().isObject().withMessage('请求体必须是一个 JSON 对象')]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedSettings = await updateSettings(req.body)
      res.json({ success: true, message: '站点设置更新成功', data: updatedSettings })
    } catch (error) {
      next(error)
    }
  }
)

export default router
