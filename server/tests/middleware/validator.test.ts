/**
 * @file 验证器中间件测试
 * @description 测试 validate 中间件的验证逻辑
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    nodeEnv: 'test',
    jwt: { secret: 'test-secret' },
    port: 3000,
    db: { host: 'localhost', port: 3306, user: 'test', password: 'test', database: 'test' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, max: 100 }
  }
}))

const { validate } = await import('../../src/middleware/validator.js')
const { ApiError } = await import('../../src/middleware/errorHandler.js')
const { body } = await import('express-validator')

describe('validate', () => {
  let req: any, res: any, next: any

  beforeEach(() => {
    jest.clearAllMocks()
    req = { body: {} }
    res = {}
    next = jest.fn()
  })

  describe('空验证规则', () => {
    it('无验证规则时应直接通过', async () => {
      const middleware = validate([])
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('null 验证规则时应直接通过', async () => {
      const middleware = validate(null as unknown as any[])
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('验证通过', () => {
    it('所有验证规则通过时应调用 next()', async () => {
      const validations = [body('name').trim().notEmpty().withMessage('名称不能为空')]
      req.body = { name: '测试名称' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('多个验证规则全部通过时应调用 next()', async () => {
      const validations = [
        body('name').trim().notEmpty().withMessage('名称不能为空'),
        body('email').isEmail().withMessage('邮箱格式无效')
      ]
      req.body = { name: '测试', email: 'test@example.com' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('验证失败', () => {
    it('必填字段为空时应返回 ApiError', async () => {
      const validations = [body('name').trim().notEmpty().withMessage('名称不能为空')]
      req.body = { name: '' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('输入验证失败')
    })

    it('邮箱格式无效时应返回 ApiError', async () => {
      const validations = [body('email').isEmail().withMessage('邮箱格式无效')]
      req.body = { email: 'invalid-email' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(400)
    })

    it('多个字段验证失败时应返回所有错误', async () => {
      const validations = [
        body('name').trim().notEmpty().withMessage('名称不能为空'),
        body('email').isEmail().withMessage('邮箱格式无效')
      ]
      req.body = { name: '', email: 'bad' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.errors).toBeDefined()
      expect(Array.isArray(error.errors)).toBe(true)
      expect(error.errors.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('可选字段', () => {
    it('可选字段为空时应通过验证', async () => {
      const validations = [
        body('name').trim().notEmpty().withMessage('名称不能为空'),
        body('description').optional().trim()
      ]
      req.body = { name: '测试' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('可选字段有值且合法时应通过验证', async () => {
      const validations = [
        body('name').trim().notEmpty().withMessage('名称不能为空'),
        body('description').optional().trim()
      ]
      req.body = { name: '测试', description: '描述内容' }
      const middleware = validate(validations)
      await middleware(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })
})