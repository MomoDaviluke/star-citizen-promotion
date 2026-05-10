/**
 * @file 分页中间件测试
 * @description 测试 paginate 中间件的分页参数解析逻辑
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { paginate } from '../../src/middleware/pagination.js'

describe('paginate', () => {
  let req: any, res: any, next: any

  beforeEach(() => {
    jest.clearAllMocks()
    req = { query: {} }
    res = {}
    next = jest.fn()
  })

  describe('默认参数', () => {
    it('无查询参数时应使用默认值', () => {
      const middleware = paginate(20, 100)

      middleware(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.pagination).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
        skip: 0,
        take: 20
      })
    })

    it('应支持自定义默认值', () => {
      const middleware = paginate(10, 50)

      middleware(req, res, next)

      expect(req.pagination.limit).toBe(10)
      expect(req.pagination.take).toBe(10)
    })
  })

  describe('查询参数解析', () => {
    it('应正确解析 page 和 limit 参数', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '3', limit: '30' }

      middleware(req, res, next)

      expect(req.pagination.page).toBe(3)
      expect(req.pagination.limit).toBe(30)
      expect(req.pagination.offset).toBe(60)
      expect(req.pagination.skip).toBe(60)
    })

    it('page=1 时 offset 应为 0', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '1', limit: '10' }

      middleware(req, res, next)

      expect(req.pagination.offset).toBe(0)
    })

    it('page=2 limit=10 时 offset 应为 10', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '2', limit: '10' }

      middleware(req, res, next)

      expect(req.pagination.offset).toBe(10)
    })
  })

  describe('边界值处理', () => {
    it('page 为 0 或负数时应修正为 1', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '0', limit: '10' }

      middleware(req, res, next)

      expect(req.pagination.page).toBe(1)
    })

    it('page 为负数时应修正为 1', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '-5', limit: '10' }

      middleware(req, res, next)

      expect(req.pagination.page).toBe(1)
    })

    it('limit 超过最大值时应限制为 maxLimit', () => {
      const middleware = paginate(20, 100)
      req.query = { limit: '500' }

      middleware(req, res, next)

      expect(req.pagination.limit).toBe(100)
    })

    it('limit 为 0 或负数时应修正为默认值', () => {
      const middleware = paginate(20, 100)
      req.query = { limit: '0' }

      middleware(req, res, next)

      expect(req.pagination.limit).toBe(20)
    })

    it('非数字参数应使用默认值', () => {
      const middleware = paginate(20, 100)
      req.query = { page: 'abc', limit: 'xyz' }

      middleware(req, res, next)

      expect(req.pagination.page).toBe(1)
      expect(req.pagination.limit).toBe(20)
    })
  })

  describe('路由集成场景', () => {
    it('应正确计算大页码的 offset', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '100', limit: '50' }

      middleware(req, res, next)

      expect(req.pagination.offset).toBe(4950)
      expect(req.pagination.skip).toBe(4950)
    })

    it('skip 和 offset 应始终相等', () => {
      const middleware = paginate(20, 100)
      req.query = { page: '5', limit: '25' }

      middleware(req, res, next)

      expect(req.pagination.skip).toBe(req.pagination.offset)
    })
  })
})