/**
 * @file 认证路由
 * @description 用户注册、登录和令牌管理
 * @module server/routes/auth
 */

import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config/index.js'
import { db } from '../database/init.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

/**
 * 用户注册验证规则
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度需在 3-20 个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少 8 个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码需包含大小写字母和数字')
]

/**
 * 用户登录验证规则
 */
const loginValidation = [
  body('email').trim().isEmail().withMessage('请输入有效的邮箱地址').normalizeEmail(),
  body('password').notEmpty().withMessage('请输入密码')
]

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('输入验证失败', errors.array())
    }

    const { username, email, password } = req.body

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username)
    if (existingUser) {
      throw ApiError.conflict('用户名或邮箱已被注册')
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds)
    const userId = uuidv4()

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'member')
    `).run(userId, username, email, passwordHash)

    const token = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: userId,
          username,
          email,
          role: 'member'
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('输入验证失败', errors.array())
    }

    const { email, password } = req.body

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
      throw ApiError.unauthorized('邮箱或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw ApiError.unauthorized('邮箱或密码错误')
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id)

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/auth/profile
 * 更新用户资料
 */
router.put(
  '/profile',
  authenticate,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度需在 3-20 个字符之间'),
    body('avatar').optional().trim().isURL().withMessage('头像必须是有效的 URL')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { username, avatar } = req.body
      const updates = []
      const values = []

      if (username) {
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id)
        if (existingUser) {
          throw ApiError.conflict('用户名已被使用')
        }
        updates.push('username = ?')
        values.push(username)
      }

      if (avatar !== undefined) {
        updates.push('avatar = ?')
        values.push(avatar)
      }

      if (updates.length === 0) {
        throw ApiError.badRequest('没有要更新的内容')
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(req.user.id)

      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

      const updatedUser = db.prepare('SELECT id, username, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id)

      res.json({
        success: true,
        message: '资料更新成功',
        data: updatedUser
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/auth/password
 * 修改密码
 */
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('请输入当前密码'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('新密码长度至少 8 个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('新密码需包含大小写字母和数字')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { currentPassword, newPassword } = req.body

      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id)

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isPasswordValid) {
        throw ApiError.unauthorized('当前密码错误')
      }

      const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds)

      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPasswordHash, req.user.id)

      res.json({
        success: true,
        message: '密码修改成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
