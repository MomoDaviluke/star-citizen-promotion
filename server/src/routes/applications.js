/**
 * @file 申请路由
 * @description 入队申请管理
 * @module server/routes/applications
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, update } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/applications
 * 获取申请列表（需要管理员权限）
 */
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let sql = `
      SELECT a.*, u.username as reviewer_name 
      FROM applications a 
      LEFT JOIN users u ON a.reviewed_by = u.id
    `
    const params = []

    if (status) {
      sql += ' WHERE a.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const applications = await query(sql, params)

    const countSql = status
      ? 'SELECT COUNT(*) as total FROM applications WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM applications'
    const countParams = status ? [status] : []
    const { total } = await queryOne(countSql, countParams)

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + applications.length < total
      }
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

    const application = await queryOne(
      `SELECT a.*, u.username as reviewer_name 
       FROM applications a 
       LEFT JOIN users u ON a.reviewed_by = u.id
       WHERE a.id = ?`,
      [req.params.id]
    )

    if (!application) {
      throw ApiError.notFound('申请不存在')
    }

    if (req.user?.role !== 'admin' && application.email !== req.user?.email) {
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

      const { name, email, discord, experience, availability, reason } = req.body

      const recentApplication = await queryOne(
        `SELECT id, created_at FROM applications 
         WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [email]
      )

      if (recentApplication) {
        throw ApiError.conflict('您已提交过申请，请等待审核')
      }

      const id = uuidv4()

      await query(
        `INSERT INTO applications (id, name, email, discord, experience, availability, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, discord || null, experience || null, availability || null, reason || null, 'pending']
      )

      const newApplication = await queryOne('SELECT * FROM applications WHERE id = ?', [id])

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

      const { id } = req.params
      const { status } = req.body

      const existingApplication = await queryOne('SELECT * FROM applications WHERE id = ?', [id])

      if (!existingApplication) {
        throw ApiError.notFound('申请不存在')
      }

      await update(
        `UPDATE applications 
         SET status = ?, reviewed_by = ?, reviewed_at = NOW() 
         WHERE id = ?`,
        [status, req.user.id, id]
      )

      const updatedApplication = await queryOne(
        `SELECT a.*, u.username as reviewer_name 
         FROM applications a 
         LEFT JOIN users u ON a.reviewed_by = u.id
         WHERE a.id = ?`,
        [id]
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

      const { id } = req.params
      const existingApplication = await queryOne('SELECT * FROM applications WHERE id = ?', [id])

      if (!existingApplication) {
        throw ApiError.notFound('申请不存在')
      }

      await query('DELETE FROM applications WHERE id = ?', [id])

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
