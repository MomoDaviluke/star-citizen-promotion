/**
 * @file 成员路由
 * @description 团队成员 CRUD 操作
 * @module server/routes/members
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { paginate } from '../middleware/pagination.js'
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from '../services/memberService.js'

const router = Router()

/**
 * GET /api/members
 * 获取所有成员列表
 */
router.get('/', paginate(50, 200), async (req, res, next) => {
  try {
    const { status } = req.query
    const { limit, offset } = req.pagination

    const result = await getMembers({ status, limit, offset })

    res.json({
      success: true,
      data: result.members,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/members/:id
 * 获取单个成员详情
 */
router.get('/:id', [param('id').notEmpty().withMessage('成员 ID 不能为空')], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const member = await getMemberById(req.params.id)

    if (!member) {
      throw ApiError.notFound('成员不存在')
    }

    res.json({
      success: true,
      data: member
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/members
 * 创建新成员（需要管理员权限）
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('成员名称不能为空'),
    body('role').trim().notEmpty().withMessage('成员角色不能为空'),
    body('intro').optional().trim(),
    body('avatar').optional().trim(),
    body('joinDate').optional().isISO8601().withMessage('加入日期格式无效')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newMember = await createMember(req.body)

      res.status(201).json({
        success: true,
        message: '成员创建成功',
        data: newMember
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/members/:id
 * 更新成员信息（需要管理员权限）
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').notEmpty().withMessage('成员 ID 不能为空'),
    body('name').optional().trim().notEmpty().withMessage('成员名称不能为空'),
    body('role').optional().trim().notEmpty().withMessage('成员角色不能为空'),
    body('intro').optional().trim(),
    body('avatar').optional().trim(),
    body('status').optional().isIn(['active', 'inactive', 'retired']).withMessage('状态值无效')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedMember = await updateMember(req.params.id, req.body)

      res.json({
        success: true,
        message: '成员信息更新成功',
        data: updatedMember
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/members/:id
 * 删除成员（需要管理员权限）
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('成员 ID 不能为空')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteMember(req.params.id)

      res.json({
        success: true,
        message: '成员删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
