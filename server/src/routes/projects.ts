/**
 * @file 项目路由
 * @description 活动/项目 CRUD 操作
 * @module server/routes/projects
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../services/projectService.js'

const router = Router()

router.get('/', paginate(50, 200), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string }
    const { limit, offset } = (req as PaginatedRequest).pagination

    const result = await getProjects({ status, limit, offset })

    res.json({
      success: true,
      data: result.projects,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', [param('id').notEmpty().withMessage('项目 ID 不能为空')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const project = await getProjectById(req.params.id as string)

    if (!project) {
      throw ApiError.notFound('项目不存在')
    }

    res.json({
      success: true,
      data: project
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
    body('name').trim().notEmpty().withMessage('项目名称不能为空'),
    body('period').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['planning', 'active', 'completed', 'cancelled']).withMessage('状态值无效'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('进度值需在 0-100 之间'),
    body('participants').optional().isInt({ min: 0 }).withMessage('参与人数不能为负数')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newProject = await createProject(req.body)

      res.status(201).json({
        success: true,
        message: '项目创建成功',
        data: newProject
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
    param('id').notEmpty().withMessage('项目 ID 不能为空'),
    body('name').optional().trim().notEmpty().withMessage('项目名称不能为空'),
    body('period').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['planning', 'active', 'completed', 'cancelled']).withMessage('状态值无效'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('进度值需在 0-100 之间'),
    body('participants').optional().isInt({ min: 0 }).withMessage('参与人数不能为负数')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedProject = await updateProject(req.params.id as string, req.body)

      res.json({
        success: true,
        message: '项目信息更新成功',
        data: updatedProject
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
  [param('id').notEmpty().withMessage('项目 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteProject(req.params.id as string)

      res.json({
        success: true,
        message: '项目删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
