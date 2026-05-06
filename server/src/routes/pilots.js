/**
 * @file 王牌飞行员路由
 * @description 王牌飞行员 CRUD 操作
 * @module server/routes/pilots
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { paginate } from '../middleware/pagination.js'
import {
  getPilots,
  getPilotById,
  createPilot,
  updatePilot,
  deletePilot
} from '../services/pilotService.js'

const router = Router()

/**
 * GET /api/pilots
 * 获取所有飞行员列表
 */
router.get('/', paginate(50, 200), async (req, res, next) => {
  try {
    const { status } = req.query
    const { limit, offset } = req.pagination

    const result = await getPilots({ status, limit, offset })

    res.json({
      success: true,
      data: result.pilots,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/pilots/:id
 * 获取单个飞行员详情
 */
router.get('/:id', [param('id').notEmpty().withMessage('飞行员 ID 不能为空')], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const pilot = await getPilotById(req.params.id)

    if (!pilot) {
      throw ApiError.notFound('飞行员不存在')
    }

    res.json({
      success: true,
      data: pilot
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/pilots
 * 创建新飞行员（需要管理员权限）
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('飞行员名称不能为空'),
    body('callsign').trim().notEmpty().withMessage('呼号不能为空'),
    body('ship').trim().notEmpty().withMessage('驾驶飞船不能为空'),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('missions').optional().isInt({ min: 0 }).withMessage('任务数不能为负数'),
    body('kills').optional().isInt({ min: 0 }).withMessage('击杀数不能为负数')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newPilot = await createPilot(req.body)

      res.status(201).json({
        success: true,
        message: '飞行员创建成功',
        data: newPilot
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/pilots/:id
 * 更新飞行员信息（需要管理员权限）
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').notEmpty().withMessage('飞行员 ID 不能为空'),
    body('name').optional().trim().notEmpty().withMessage('飞行员名称不能为空'),
    body('callsign').optional().trim().notEmpty().withMessage('呼号不能为空'),
    body('ship').optional().trim().notEmpty().withMessage('驾驶飞船不能为空'),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('missions').optional().isInt({ min: 0 }).withMessage('任务数不能为负数'),
    body('kills').optional().isInt({ min: 0 }).withMessage('击杀数不能为负数'),
    body('status').optional().isIn(['active', 'inactive', 'kia']).withMessage('状态值无效')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedPilot = await updatePilot(req.params.id, req.body)

      res.json({
        success: true,
        message: '飞行员信息更新成功',
        data: updatedPilot
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/pilots/:id
 * 删除飞行员（需要管理员权限）
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('飞行员 ID 不能为空')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deletePilot(req.params.id)

      res.json({
        success: true,
        message: '飞行员删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
