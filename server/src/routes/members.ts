/**
 * @file 成员路由
 * @description 团队成员 CRUD 操作
 * @module server/routes/members
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from '../services/memberService.js'

const router = Router()

router.get('/', paginate(50, 200), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string }
    const { limit, offset } = (req as PaginatedRequest).pagination

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

router.get('/:id', [param('id').notEmpty().withMessage('成员 ID 不能为空')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const member = await getMemberById(req.params.id as string)

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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedMember = await updateMember(req.params.id as string, req.body)

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

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('成员 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteMember(req.params.id as string)

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
