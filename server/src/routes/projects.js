/**
 * @file 项目路由
 * @description 活动/项目 CRUD 操作
 * @module server/routes/projects
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../database/init.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/projects
 * 获取所有项目列表
 */
router.get('/', (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let query = 'SELECT * FROM projects'
    const params = []

    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const projects = db.prepare(query).all(...params)

    const countQuery = status ? 'SELECT COUNT(*) as total FROM projects WHERE status = ?' : 'SELECT COUNT(*) as total FROM projects'
    const countParams = status ? [status] : []
    const { total } = db.prepare(countQuery).get(...countParams)

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
router.get('/:id', [param('id').notEmpty().withMessage('项目 ID 不能为空')], (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)

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
  (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { name, period, description, status, progress, participants } = req.body
      const id = uuidv4()

      db.prepare(`
        INSERT INTO projects (id, name, period, description, status, progress, participants)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, period || null, description || null, status || 'planning', progress || 0, participants || 0)

      const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)

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
  (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { id } = req.params
      const existingProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)

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

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)

      db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)

      const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)

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
router.delete('/:id', authenticate, requireAdmin, [param('id').notEmpty().withMessage('项目 ID 不能为空')], (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const { id } = req.params
    const existingProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)

    if (!existingProject) {
      throw ApiError.notFound('项目不存在')
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '项目删除成功'
    })
  } catch (error) {
    next(error)
  }
})

export default router
