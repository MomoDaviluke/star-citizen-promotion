/**
 * @file 认证路由
 * @description 用户注册、登录和令牌管理
 * @module server/routes/auth
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js'
import { COOKIE_OPTIONS } from '../config/index.js'
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changePassword,
  refreshUserToken
} from '../services/authService.js'

const router = Router()

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

const loginValidation = [
  body('email').trim().isEmail().withMessage('请输入有效的邮箱地址').normalizeEmail(),
  body('password').notEmpty().withMessage('请输入密码')
]

router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('输入验证失败', errors.array())
    }

    const result = await registerUser(req.body)

    res.cookie('auth_token', result.token, COOKIE_OPTIONS)

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('输入验证失败', errors.array())
    }

    const { email, password } = req.body as { email: string; password: string }
    const result = await loginUser(email, password)

    res.cookie('auth_token', result.token, COOKIE_OPTIONS)

    res.json({
      success: true,
      message: '登录成功',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.id)

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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedUser = await updateUserProfile(req.user!.id, req.body)

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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string }
      await changePassword(req.user!.id, currentPassword, newPassword)

      res.json({
        success: true,
        message: '密码修改成功'
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null)

    if (!token) {
      throw ApiError.unauthorized('缺少认证令牌')
    }

    const result = await refreshUserToken(token)

    res.cookie('auth_token', result.token, COOKIE_OPTIONS)

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: result
    })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.clearCookie('auth_token', COOKIE_OPTIONS)
  res.json({ success: true, message: '登出成功' })
})

export default router
