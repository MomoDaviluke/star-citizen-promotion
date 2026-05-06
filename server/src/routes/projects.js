/**
 * @file 项目路由
 * @description 活动/项目 CRUD 操作
 * @module server/routes/projects
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { paginate } from '../middleware/pagination.js'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../services/projectService.js'

const router = Router()

/**
 * GET /api/projects
 * 获取所有项目列表
 */
router.get('/', paginate(50, 200), async (req, res, next) => {
  try {
    const { status } = req.query
    const { limit, offset } = req.pagination

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

/**
 * GET /api/projects/:id
 * 获取单个项目详情
 */
router.get('/:id', [param('id').notEmpty().withMessage('项目 ID 不能为空')], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const project = await getProjectById(req.params.id)

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

/**
 * POST /api/projects
 * 创建新项目（需要管理员权限）
 */
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
  async (req, res, next) => {
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

/**
 * PUT /api/projects/:id
 * 更新项目信息（需要管理员权限）
 */
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
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedProject = await updateProject(req.params.id, req.body)

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

/**
 * DELETE /api/projects/:id
 * 删除项目（需要管理员权限）
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('项目 ID 不能为空')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      await deleteProject(req.params.id)

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
