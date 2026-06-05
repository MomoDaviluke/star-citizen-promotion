/**
 * @file HTTP 缓存中间件
 * @description TTL 内存缓存 + ETag 条件请求 + Cache-Control 分层策略
 * @module server/middleware/cache
 */

import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'
import logger from '../utils/logger.js'

/** 单个缓存条目 */
interface CacheEntry {
  /** 缓存的响应体（JSON 字符串） */
  body: string
  /** 缓存的 Content-Type */
  contentType: string
  /** 写入时间戳 (ms) */
  timestamp: number
  /** 预计算的 ETag */
  etag: string
  /** 命中次数 */
  hits: number
}

/** 缓存配置（按路由模式匹配） */
export interface CacheRule {
  /** 路径前缀或精确路径 */
  path: string
  /** 缓存 TTL（秒） */
  ttl: number
  /** Cache-Control max-age（秒），默认等于 ttl */
  maxAge?: number
  /** 是否为公开缓存（CDN 可缓存），默认 true */
  public?: boolean
}

/** 默认缓存规则 */
const DEFAULT_RULES: CacheRule[] = [
  { path: '/api/stats', ttl: 60, maxAge: 60, public: true },
  { path: '/api/fleet', ttl: 30, maxAge: 30, public: true },
  { path: '/api/members', ttl: 30, maxAge: 30, public: true },
  { path: '/api/pilots', ttl: 30, maxAge: 30, public: true },
  { path: '/api/projects', ttl: 30, maxAge: 30, public: true },
  { path: '/api/events', ttl: 30, maxAge: 30, public: true },
  { path: '/api/settings', ttl: 60, maxAge: 60, public: true },
]

/**
 * 缓存存储
 * key = `${method}:${path}`（忽略查询参数以保证命中率）
 */
class MemoryCache {
  private store = new Map<string, CacheEntry>()
  private maxEntries: number
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries
  }

  get(key: string): CacheEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, entry: CacheEntry): void {
    // 容量控制：超出上限时淘汰最旧的 20%
    if (this.store.size >= this.maxEntries) {
      const toDelete = Math.floor(this.maxEntries * 0.2)
      const entries = Array.from(this.store.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      for (let i = 0; i < toDelete; i++) {
        this.store.delete(entries[i][0])
      }
      logger.warn('缓存容量达上限，淘汰条目', { deleted: toDelete, remaining: this.store.size })
    }
    this.store.set(key, entry)
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * 按前缀删除（用于写操作后的缓存失效）
   */
  deleteByPrefix(prefix: string): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  /** 清空所有缓存 */
  clear(): number {
    const count = this.store.size
    this.store.clear()
    return count
  }

  /** 获取缓存统计 */
  getStats(): { size: number; maxEntries: number; totalHits: number; entries: Array<{ key: string; age: number; hits: number }> } {
    let totalHits = 0
    const entries: Array<{ key: string; age: number; hits: number }> = []
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      totalHits += entry.hits
      entries.push({ key, age: Math.round((now - entry.timestamp) / 1000), hits: entry.hits })
    }
    return { size: this.store.size, maxEntries: this.maxEntries, totalHits, entries }
  }

  /** 启动定期清理过期条目 */
  startCleanup(intervalMs = 60000): void {
    if (this.cleanupInterval) return
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      let cleaned = 0
      for (const [key, entry] of this.store.entries()) {
        // 检查是否过期（由外部 TTL 规则决定，这里清理超过 10 分钟的孤儿条目）
        if (now - entry.timestamp > 600000) {
          this.store.delete(key)
          cleaned++
        }
      }
      if (cleaned > 0) {
        logger.info('缓存定期清理', { cleaned })
      }
    }, intervalMs)
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

/** 全局缓存实例 */
export const memoryCache = new MemoryCache()

/** 缓存规则 */
let cacheRules: CacheRule[] = [...DEFAULT_RULES]

/** 设置缓存规则 */
export function setCacheRules(rules: CacheRule[]): void {
  cacheRules = rules
}

/** 匹配缓存规则 */
function matchRule(method: string, path: string): CacheRule | null {
  if (method !== 'GET') return null
  for (const rule of cacheRules) {
    if (path.startsWith(rule.path)) {
      return rule
    }
  }
  return null
}

/** 构建缓存键 */
function buildCacheKey(req: Request): string {
  // GET 请求忽略查询参数（分页参数变化时命中同一缓存不够精确，但简化了实现）
  return `GET:${req.path}`
}

/** 计算 ETag */
function computeETag(body: string): string {
  return createHash('md5').update(body).digest('hex')
}

/**
 * 缓存中间件工厂
 * @param skipAuthRoutes 是否跳过认证路由（默认 true）
 */
export function cacheMiddleware(options?: { skipAuthRoutes?: boolean }) {
  const { skipAuthRoutes = true } = options || {}

  return function cacheHandler(req: Request, res: Response, next: NextFunction): void {
    // 非 GET 不缓存
    if (req.method !== 'GET') {
      return next()
    }

    // 跳过认证路由（用户特定数据）
    if (skipAuthRoutes && (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin'))) {
      return next()
    }

    const rule = matchRule(req.method, req.path)
    if (!rule) {
      return next()
    }

    const cacheKey = buildCacheKey(req)
    const entry = memoryCache.get(cacheKey)
    const now = Date.now()

    // 检查缓存是否有效
    if (entry && (now - entry.timestamp) < rule.ttl * 1000) {
      // ETag 条件请求
      const ifNoneMatch = req.headers['if-none-match']
      if (ifNoneMatch === entry.etag) {
        res.status(304).end()
        return
      }

      // 命中缓存
      entry.hits++
      res.set('Content-Type', entry.contentType)
      res.set('ETag', entry.etag)
      res.set('Cache-Control', `${rule.public !== false ? 'public' : 'private'}, max-age=${rule.maxAge ?? rule.ttl}`)
      res.set('X-Cache', 'HIT')
      res.send(entry.body)
      return
    }

    // 未命中：拦截 res.json / res.send 以缓存响应
    const originalJson = res.json.bind(res)
    const originalSend = res.send.bind(res)

    res.json = function (body: unknown): Response {
      cacheResponse(body, 'application/json; charset=utf-8')
      return originalJson(body)
    }

    res.send = function (body: unknown): Response {
      if (typeof body === 'string') {
        cacheResponse(body, res.get('Content-Type') || 'text/html; charset=utf-8')
      }
      return originalSend(body)
    }

    function cacheResponse(body: unknown, contentType: string): void {
      try {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
        const etag = computeETag(bodyStr)
        const entry: CacheEntry = {
          body: bodyStr,
          contentType,
          timestamp: now,
          etag,
          hits: 0,
        }
        memoryCache.set(cacheKey, entry)
        res.set('ETag', etag)
        res.set('Cache-Control', `${rule!.public !== false ? 'public' : 'private'}, max-age=${rule!.maxAge ?? rule!.ttl}`)
        res.set('X-Cache', 'MISS')
      } catch {
        // 缓存写入失败不影响正常响应
        logger.warn('缓存写入失败', { key: cacheKey })
      }
    }

    next()
  }
}

/**
 * 缓存失效中间件
 * @description 在 POST/PUT/DELETE 操作后清除相关缓存
 */
export function cacheInvalidationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // 只对写操作做失效
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next()
  }

  // 根据路径前缀匹配要失效的缓存
  const pathPrefixes = extractCachePrefixes(req.path)
  let totalCleared = 0
  for (const prefix of pathPrefixes) {
    totalCleared += memoryCache.deleteByPrefix(prefix)
  }

  if (totalCleared > 0) {
    logger.info('缓存已失效', { method: req.method, path: req.path, cleared: totalCleared })
  }

  next()
}

/** 从路径提取缓存前缀 */
function extractCachePrefixes(path: string): string[] {
  const prefixes: string[] = []

  // 精确匹配：/api/members/123 → 失效 GET:/api/members
  const match = path.match(/^(\/api\/\w+)/)
  if (match) {
    prefixes.push(`GET:${match[1]}`)
  }

  return prefixes
}

/**
 * 清空所有缓存（供 admin 端点调用）
 */
export function clearAllCache(): number {
  return memoryCache.clear()
}

/**
 * 获取缓存统计（供监控使用）
 */
export function getCacheStats() {
  return memoryCache.getStats()
}

export default cacheMiddleware
