/**
 * @file 王牌飞行员路由
 * @description 王牌飞行员 CRUD 操作
 * @module server/routes/pilots
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../database/init.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/pilots
 * 获取所有飞行员列表
 */
router.get('/', (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let query = 'SELECT * FROM pilots'
    const params = []

    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    query += ' ORDER BY missions DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const pilots = db.prepare(query).all(...params)

    const countQuery = status ? 'SELECT COUNT(*) as total FROM pilots WHERE status = ?' : 'SELECT COUNT(*) as total FROM pilots'
    const countParams = status ? [status] : []
    const { total } = db.prepare(countQuery).get(...countParams)

    res.json({
      success: true,
      data: pilots,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + pilots.length < total
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/pilots/:id
 * 获取单个飞行员详情
 */
router.get('/:id', [param('id').notEmpty().withMessage('飞行员 ID 不能为空')], (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const pilot = db.prepare('SELECT * FROM pilots WHERE id = ?').get(req.params.id)

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
  (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { name, callsign, ship, description, image, missions, kills } = req.body
      const id = uuidv4()

      db.prepare(`
        INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(id, name, callsign, ship, description || null, image || null, missions || 0, kills || 0)

      const newPilot = db.prepare('SELECT * FROM pilots WHERE id = ?').get(id)

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
    body('status').optional().isIn(['active', 'inactive']).withMessage('状态值无效')
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { id } = req.params
      const existingPilot = db.prepare('SELECT * FROM pilots WHERE id = ?').get(id)

      if (!existingPilot) {
        throw ApiError.notFound('飞行员不存在')
      }

      const { name, callsign, ship, description, image, missions, kills, status } = req.body
      const updates = []
      const values = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (callsign !== undefined) {
        updates.push('callsign = ?')
        values.push(callsign)
      }
      if (ship !== undefined) {
        updates.push('ship = ?')
        values.push(ship)
      }
      if (description !== undefined) {
        updates.push('description = ?')
        values.push(description)
      }
      if (image !== undefined) {
        updates.push('image = ?')
        values.push(image)
      }
      if (missions !== undefined) {
        updates.push('missions = ?')
        values.push(missions)
      }
      if (kills !== undefined) {
        updates.push('kills = ?')
        values.push(kills)
      }
      if (status !== undefined) {
        updates.push('status = ?')
        values.push(status)
      }

      if (updates.length === 0) {
        throw ApiError.badRequest('没有要更新的内容')
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)

      db.prepare(`UPDATE pilots SET ${updates.join(', ')} WHERE id = ?`).run(...values)

      const updatedPilot = db.prepare('SELECT * FROM pilots WHERE id = ?').get(id)

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
router.delete('/:id', authenticate, requireAdmin, [param('id').notEmpty().withMessage('飞行员 ID 不能为空')], (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const { id } = req.params
    const existingPilot = db.prepare('SELECT * FROM pilots WHERE id = ?').get(id)

    if (!existingPilot) {
      throw ApiError.notFound('飞行员不存在')
    }

    db.prepare('DELETE FROM pilots WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '飞行员删除成功'
    })
  } catch (error) {
    next(error)
  }
})

export default router
