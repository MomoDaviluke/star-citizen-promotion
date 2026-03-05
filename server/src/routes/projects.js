/**
 * @file 项目路由
 * @description 活动/项目 CRUD 操作
 * @module server/routes/projects
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, update } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/projects
 * 获取所有项目列表
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let sql = 'SELECT * FROM projects'
    const params = []

    if (status) {
      sql += ' WHERE status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const projects = await query(sql, params)

    const countSql = status
      ? 'SELECT COUNT(*) as total FROM projects WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM projects'
    const countParams = status ? [status] : []
    const { total } = await queryOne(countSql, countParams)

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + projects.length < total
      }
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

    const project = await queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id])

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

      const { name, period, description, status, progress, participants } = req.body
      const id = uuidv4()

      await query(
        'INSERT INTO projects (id, name, period, description, status, progress, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, period || null, description || null, status || 'planning', progress || 0, participants || 0]
      )

      const newProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id])

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

      const { id } = req.params
      const existingProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id])

      if (!existingProject) {
        throw ApiError.notFound('项目不存在')
      }

      const { name, period, description, status, progress, participants } = req.body
      const updates = []
      const values = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (period !== undefined) {
        updates.push('period = ?')
        values.push(period)
      }
      if (description !== undefined) {
        updates.push('description = ?')
        values.push(description)
      }
      if (status !== undefined) {
        updates.push('status = ?')
        values.push(status)
      }
      if (progress !== undefined) {
        updates.push('progress = ?')
        values.push(progress)
      }
      if (participants !== undefined) {
        updates.push('participants = ?')
        values.push(participants)
      }

      if (updates.length === 0) {
        throw ApiError.badRequest('没有要更新的内容')
      }

      values.push(id)

      await update(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        values
      )

      const updatedProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id])

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

      const { id } = req.params
      const existingProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id])

      if (!existingProject) {
        throw ApiError.notFound('项目不存在')
      }

      await query('DELETE FROM projects WHERE id = ?', [id])

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
