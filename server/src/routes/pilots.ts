/**
 * @file 王牌飞行员路由
 * @description 王牌飞行员 CRUD 操作
 * @module server/routes/pilots
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import { validate } from '../middleware/validator.js'
import {
  getPilots,
  getPilotById,
  createPilot,
  updatePilot,
  deletePilot
} from '../services/pilotService.js'

const router = Router()

router.get('/', paginate(50, 200), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string }
    const { limit, offset } = (req as PaginatedRequest).pagination
    const result = await getPilots({ status, limit, offset })
    res.json({ success: true, data: result.pilots, pagination: result.pagination })
  } catch (error) {
    next(error)
  }
})

router.get(
  '/:id',
  validate([param('id').notEmpty().withMessage('飞行员 ID 不能为空')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pilot = await getPilotById(req.params.id as string)
      if (!pilot) throw ApiError.notFound('飞行员不存在')
      res.json({ success: true, data: pilot })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('飞行员名称不能为空'),
    body('callsign').trim().notEmpty().withMessage('呼号不能为空'),
    body('ship').trim().notEmpty().withMessage('驾驶飞船不能为空'),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('missions').optional().isInt({ min: 0 }).withMessage('任务数不能为负数'),
    body('kills').optional().isInt({ min: 0 }).withMessage('击杀数不能为负数')
  ]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const newPilot = await createPilot(req.body)
      res.status(201).json({ success: true, message: '飞行员创建成功', data: newPilot })
    } catch (error) {
      next(error)
    }
  }
)

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    param('id').notEmpty().withMessage('飞行员 ID 不能为空'),
    body('name').optional().trim().notEmpty().withMessage('飞行员名称不能为空'),
    body('callsign').optional().trim().notEmpty().withMessage('呼号不能为空'),
    body('ship').optional().trim().notEmpty().withMessage('驾驶飞船不能为空'),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('missions').optional().isInt({ min: 0 }).withMessage('任务数不能为负数'),
    body('kills').optional().isInt({ min: 0 }).withMessage('击杀数不能为负数'),
    body('status').optional().isIn(['active', 'inactive', 'kia']).withMessage('状态值无效')
  ]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedPilot = await updatePilot(req.params.id as string, req.body)
      res.json({ success: true, message: '飞行员信息更新成功', data: updatedPilot })
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate([param('id').notEmpty().withMessage('飞行员 ID 不能为空')]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deletePilot(req.params.id as string)
      res.json({ success: true, message: '飞行员删除成功' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
