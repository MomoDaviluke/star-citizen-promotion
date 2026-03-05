/**
 * @file 成员路由
 * @description 团队成员 CRUD 操作
 * @module server/routes/members
 */

import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, update } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/members
 * 获取所有成员列表
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let sql = 'SELECT * FROM members'
    const params = []

    if (status) {
      sql += ' WHERE status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const members = await query(sql, params)

    const countSql = status
      ? 'SELECT COUNT(*) as total FROM members WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM members'
    const countParams = status ? [status] : []
    const { total } = await queryOne(countSql, countParams)

    res.json({
      success: true,
      data: members,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + members.length < total
      }
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

    const member = await queryOne('SELECT * FROM members WHERE id = ?', [req.params.id])

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

      const { name, role, intro, avatar, joinDate } = req.body
      const id = uuidv4()

      await query(
        'INSERT INTO members (id, name, role, intro, avatar, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, role, intro || null, avatar || null, joinDate || null, 'active']
      )

      const newMember = await queryOne('SELECT * FROM members WHERE id = ?', [id])

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

      const { id } = req.params
      const existingMember = await queryOne('SELECT * FROM members WHERE id = ?', [id])

      if (!existingMember) {
        throw ApiError.notFound('成员不存在')
      }

      const { name, role, intro, avatar, status } = req.body
      const updates = []
      const values = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (role !== undefined) {
        updates.push('role = ?')
        values.push(role)
      }
      if (intro !== undefined) {
        updates.push('intro = ?')
        values.push(intro)
      }
      if (avatar !== undefined) {
        updates.push('avatar = ?')
        values.push(avatar)
      }
      if (status !== undefined) {
        updates.push('status = ?')
        values.push(status)
      }

      if (updates.length === 0) {
        throw ApiError.badRequest('没有要更新的内容')
      }

      values.push(id)

      await update(
        `UPDATE members SET ${updates.join(', ')} WHERE id = ?`,
        values
      )

      const updatedMember = await queryOne('SELECT * FROM members WHERE id = ?', [id])

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

      const { id } = req.params
      const existingMember = await queryOne('SELECT * FROM members WHERE id = ?', [id])

      if (!existingMember) {
        throw ApiError.notFound('成员不存在')
      }

      await query('DELETE FROM members WHERE id = ?', [id])

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
