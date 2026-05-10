import { Router, Request, Response, NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import {
  getShips,
  getShipById,
  createShip,
  updateShip,
  deleteShip,
  getFleetStats
} from '../services/fleetService.js'

const router = Router()

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getFleetStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    next(error)
  }
})

router.get('/', paginate(50, 200), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, sortBy, order } = req.query as { category?: string; status?: string; sortBy?: string; order?: string }
    const { limit, offset } = (req as PaginatedRequest).pagination

    const result = await getShips({ category, status, sortBy, order, limit, offset })

    res.json({
      success: true,
      data: result.ships,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', [param('id').notEmpty().withMessage('飞船 ID 不能为空')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const ship = await getShipById(req.params.id as string)

    if (!ship) {
      throw ApiError.notFound('飞船不存在')
    }

    res.json({ success: true, data: ship })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('飞船名称不能为空'),
    body('ship').trim().notEmpty().withMessage('飞船型号不能为空'),
    body('callsign').optional().trim(),
    body('category').optional().isIn(['combat', 'transport', 'explore', 'support']).withMessage('类别值无效'),
    body('status').optional().isIn(['available', 'borrowed', 'inMission', 'maintenance']).withMessage('状态值无效'),
    body('value').optional().isInt({ min: 0 }).withMessage('价值不能为负数'),
    body('image').optional().trim(),
    body('description').optional().trim()
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newShip = await createShip(req.body)

      res.status(201).json({
        success: true,
        message: '飞船创建成功',
        data: newShip
      })
    } catch (error) {
      next(error)
    }
  }
)

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').notEmpty().withMessage('飞船 ID 不能为空'),
    body('name').optional().trim().notEmpty().withMessage('飞船名称不能为空'),
    body('ship').optional().trim().notEmpty().withMessage('飞船型号不能为空'),
    body('callsign').optional().trim(),
    body('category').optional().isIn(['combat', 'transport', 'explore', 'support']).withMessage('类别值无效'),
    body('status').optional().isIn(['available', 'borrowed', 'inMission', 'maintenance']).withMessage('状态值无效'),
    body('value').optional().isInt({ min: 0 }).withMessage('价值不能为负数'),
    body('image').optional().trim(),
    body('description').optional().trim()
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedShip = await updateShip(req.params.id as string, req.body)

      res.json({
        success: true,
        message: '飞船信息更新成功',
        data: updatedShip
      })
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('飞船 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteShip(req.params.id as string)

      res.json({ success: true, message: '飞船删除成功' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
