import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
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
  [
    body().isObject().withMessage('请求体必须是一个 JSON 对象')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedSettings = await updateSettings(req.body)

      res.json({
        success: true,
        message: '站点设置更新成功',
        data: updatedSettings
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
