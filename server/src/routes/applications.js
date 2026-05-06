/**
 * @file 申请路由
 * @description 入队申请管理
 * @module server/routes/applications
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { paginate } from '../middleware/pagination.js'
import {
  getApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStatus,
  deleteApplication
} from '../services/applicationService.js'

const router = Router()

/**
 * GET /api/applications
 * 获取申请列表（需要管理员权限）
 */
router.get('/', authenticate, requireAdmin, paginate(50, 200), async (req, res, next) => {
  try {
    const { status } = req.query
    const { limit, offset } = req.pagination

    const result = await getApplications({ status, limit, offset })

    res.json({
      success: true,
      data: result.applications,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/applications/:id
 * 获取单个申请详情
 */
router.get('/:id', [param('id').notEmpty().withMessage('申请 ID 不能为空')], optionalAuth, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const application = await getApplicationById(req.params.id)

    if (!application) {
      throw ApiError.notFound('申请不存在')
    }

    // 管理员可查看所有申请；普通用户只能查看自己的申请；未认证用户不可查看
    if (req.user?.role !== 'admin' && application.email !== req.user?.email) {
      if (!req.user) {
        throw ApiError.unauthorized('请先登录后查看申请')
      }
      throw ApiError.forbidden('无权查看此申请')
    }

    res.json({
      success: true,
      data: application
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/applications
 * 提交入队申请（公开）
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('姓名不能为空').isLength({ max: 50 }).withMessage('姓名长度不能超过 50 个字符'),
    body('email').trim().isEmail().withMessage('请输入有效的邮箱地址').normalizeEmail(),
    body('discord').optional().trim().isLength({ max: 50 }),
    body('experience').optional().trim().isLength({ max: 500 }).withMessage('经验描述不能超过 500 个字符'),
    body('availability').optional().trim().isLength({ max: 200 }),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('加入原因不能超过 500 个字符')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newApplication = await submitApplication(req.body)

      res.status(201).json({
        success: true,
        message: '申请提交成功，我们将尽快审核',
        data: {
          id: newApplication.id,
          status: newApplication.status,
          createdAt: newApplication.created_at
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/applications/:id/status
 * 更新申请状态（需要管理员权限）
 */
router.put(
  '/:id/status',
  authenticate,
  requireAdmin,
  [
    param('id').notEmpty().withMessage('申请 ID 不能为空'),
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('状态值无效'),
    body('note').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { status, note } = req.body
      const updatedApplication = await updateApplicationStatus(
        req.params.id,
        status,
        req.user.id,
        note
      )

      res.json({
        success: true,
        message: '申请状态更新成功',
        data: updatedApplication
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/applications/:id
 * 删除申请（需要管理员权限）
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('申请 ID 不能为空')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteApplication(req.params.id)

      res.json({
        success: true,
        message: '申请删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
