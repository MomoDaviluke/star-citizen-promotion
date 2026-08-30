/**
 * @file 缓存中间件测试
 * @description 覆盖 TTL 缓存、ETag 条件请求、缓存失效、容量控制
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

// ---- Helpers -------------------------------------------------------
function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    path: '/api/members',
    headers: {} as Record<string, string | string[] | undefined>,
    ...overrides,
  }
}

function createMockRes() {
  const headers: Record<string, string> = {}
  const res = {
    statusCode: 200,
    headers,
    _body: null as unknown,
    set: function (key: string, value: string) {
      headers[key] = value
      return res
    },
    json: function (body: unknown) {
      res._body = body
      return res
    },
    send: function (body: unknown) {
      res._body = body
      return res
    },
    end: function () {
      return res
    },
    status: function (code: number) {
      res.statusCode = code
      return res
    },
  }
  return res
}

function createNextFn() {
  return jest.fn()
}

const {
  memoryCache,
  cacheMiddleware,
  cacheInvalidationMiddleware,
  clearAllCache,
  getCacheStats,
  setCacheRules,
} = await import('../../src/middleware/cache.js')

describe('MemoryCache', () => {
  beforeEach(() => {
    clearAllCache()
  })

  describe('get / set / delete', () => {
    it('未设置的 key 应返回 undefined', () => {
      expect(memoryCache.get('test')).toBeUndefined()
    })

    it('set 后 get 应返回相同值', () => {
      memoryCache.set('test', { body: 'hello', contentType: 'text/plain', timestamp: Date.now(), etag: 'abc', hits: 0 })
      const entry = memoryCache.get('test')
      expect(entry?.body).toBe('hello')
    })

    it('delete 应移除条目', () => {
      memoryCache.set('test', { body: 'x', contentType: 'text/plain', timestamp: Date.now(), etag: 'abc', hits: 0 })
      expect(memoryCache.delete('test')).toBe(true)
      expect(memoryCache.get('test')).toBeUndefined()
    })
  })

  describe('deleteByPrefix', () => {
    it('应按前缀删除多条', () => {
      const now = Date.now()
      memoryCache.set('GET:/api/members', { body: 'a', contentType: 'application/json', timestamp: now, etag: 'a', hits: 0 })
      memoryCache.set('GET:/api/members/123', { body: 'b', contentType: 'application/json', timestamp: now, etag: 'b', hits: 0 })
      memoryCache.set('GET:/api/pilots', { body: 'c', contentType: 'application/json', timestamp: now, etag: 'c', hits: 0 })

      const deleted = memoryCache.deleteByPrefix('GET:/api/members')
      expect(deleted).toBe(2)
      expect(memoryCache.get('GET:/api/pilots')).toBeDefined()
    })
  })

  describe('clear', () => {
    it('应清空所有条目', () => {
      memoryCache.set('a', { body: '1', contentType: 'text/plain', timestamp: Date.now(), etag: '1', hits: 0 })
      memoryCache.set('b', { body: '2', contentType: 'text/plain', timestamp: Date.now(), etag: '2', hits: 0 })
      const count = clearAllCache()
      expect(count).toBe(2)
      expect(memoryCache.get('a')).toBeUndefined()
    })
  })

  describe('getStats', () => {
    it('应返回缓存统计', () => {
      memoryCache.set('test', { body: 'x', contentType: 'text/plain', timestamp: Date.now(), etag: 'abc', hits: 5 })
      const stats = getCacheStats()
      expect(stats.size).toBeGreaterThanOrEqual(1)
      expect(stats.totalHits).toBeGreaterThanOrEqual(5)
    })
  })
})

describe('cacheMiddleware', () => {
  const middleware = cacheMiddleware({ skipAuthRoutes: true })

  beforeEach(() => {
    clearAllCache()
  })

  describe('非 GET 请求', () => {
    it('POST 应直接 next', () => {
      const req = createMockReq({ method: 'POST', path: '/api/members' })
      const next = createNextFn()
      middleware(req as any, createMockRes() as any, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('认证路由跳过', () => {
    it('/api/auth/login 应跳过缓存', () => {
      const req = createMockReq({ method: 'GET', path: '/api/auth/login' })
      const next = createNextFn()
      middleware(req as any, createMockRes() as any, next)
      expect(next).toHaveBeenCalled()
    })

    it('/api/admin 应跳过缓存', () => {
      const req = createMockReq({ method: 'GET', path: '/api/admin/reset-db' })
      const next = createNextFn()
      middleware(req as any, createMockRes() as any, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('缓存命中', () => {
    it('命中时应返回 X-Cache: HIT', () => {
      const req1 = createMockReq({ method: 'GET', path: '/api/members' })
      const res1 = createMockRes()
      const next1 = createNextFn()
      middleware(req1 as any, res1 as any, next1)
      // 执行 next 回调以触发 res.json 拦截
      const nextCallback = next1.mock.calls[0]?.[0]
      if (typeof nextCallback === 'function') nextCallback()
      res1.json({ data: [{ id: 1 }] })

      const req2 = createMockReq({ method: 'GET', path: '/api/members' })
      const res2 = createMockRes()
      const next2 = createNextFn()
      middleware(req2 as any, res2 as any, next2)

      expect(res2.headers['X-Cache']).toBe('HIT')
    })

    it('ETag 匹配应返回 304', () => {
      const req1 = createMockReq({ method: 'GET', path: '/api/members' })
      const res1 = createMockRes()
      const next1 = createNextFn()
      middleware(req1 as any, res1 as any, next1)
      const nextCallback = next1.mock.calls[0]?.[0]
      if (typeof nextCallback === 'function') nextCallback()
      res1.json({ data: [{ id: 1 }] })

      const etag = res1.headers['ETag']

      const req2 = createMockReq({
        method: 'GET',
        path: '/api/members',
        headers: { 'if-none-match': etag }
      })
      const res2 = createMockRes()
      const next2 = createNextFn()
      middleware(req2 as any, res2 as any, next2)

      expect(res2.statusCode).toBe(304)
    })
  })

  describe('缓存未命中', () => {
    it('未命中时调用 next，后续 res.json 写入缓存', () => {
      const req = createMockReq({ method: 'GET', path: '/api/members' })
      const res = createMockRes()
      const next = createNextFn()

      middleware(req as any, res as any, next)
      expect(next).toHaveBeenCalled()

      // 模拟后续中间件返回
      res.json({ data: [] })

      const entry = memoryCache.get('GET:/api/members')
      expect(entry).toBeDefined()
      expect(JSON.parse(entry!.body)).toEqual({ data: [] })
      expect(res.headers['X-Cache']).toBe('MISS')
    })
  })
})

describe('cacheInvalidationMiddleware', () => {
  beforeEach(() => {
    clearAllCache()
  })

  it('POST 写操作应清除相关 GET 缓存', () => {
    memoryCache.set('GET:/api/members', { body: '[]', contentType: 'application/json', timestamp: Date.now(), etag: 'abc', hits: 0 })

    const req = createMockReq({ method: 'POST', path: '/api/members' })
    const res = createMockRes()
    const next = createNextFn()

    cacheInvalidationMiddleware(req as any, res as any, next)

    expect(next).toHaveBeenCalled()
    expect(memoryCache.get('GET:/api/members')).toBeUndefined()
  })

  it('GET 请求应跳过失效', () => {
    memoryCache.set('GET:/api/members', { body: '[]', contentType: 'application/json', timestamp: Date.now(), etag: 'abc', hits: 0 })

    const req = createMockReq({ method: 'GET', path: '/api/members' })
    const res = createMockRes()
    const next = createNextFn()

    cacheInvalidationMiddleware(req as any, res as any, next)

    expect(next).toHaveBeenCalled()
    expect(memoryCache.get('GET:/api/members')).toBeDefined()
  })
})

describe('setCacheRules', () => {
  beforeEach(() => {
    clearAllCache()
  })

  it('应支持自定义缓存规则', () => {
    setCacheRules([
      { path: '/api/custom', ttl: 120, maxAge: 60, public: false }
    ])

    const middleware = cacheMiddleware()
    const req = createMockReq({ method: 'GET', path: '/api/custom' })
    const res = createMockRes()
    const next = createNextFn()

    middleware(req as any, res as any, next)
    expect(next).toHaveBeenCalled()

    res.json({ result: 'ok' })
    const entry = memoryCache.get('GET:/api/custom')
    expect(entry).toBeDefined()
  })
})
