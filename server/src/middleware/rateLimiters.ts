/**
 * @file 速率限制中间件集合
 * @description 集中定义所有 rate limiters，便于路由文件显式引用
 *   - apiLimiter: 全局 API 限流（在 index.ts 中通过 app.use('/api/', apiLimiter) 应用）
 *   - authLimiter: 认证端点严格限流
 *   - refreshLimiter: 令牌刷新端点限流
 *   - adminLimiter: 管理员路由专用限流（更严格，供管理员路由显式应用）
 * @module server/middleware/rateLimiters
 *
 * @note CodeQL 检测单文件时无法识别跨文件的全局中间件应用，因此管理员路由
 *   应显式应用 adminLimiter 以满足静态分析要求。
 */

import { Request } from 'express'
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import { config } from '../config/index.js'

/**
 * 全局 API 速率限制
 * @description 应用于所有 /api/ 路径，防止 API 滥用
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * 认证端点严格速率限制
 * @description 登录/注册端点，15 分钟内最多 10 次
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * 令牌刷新端点速率限制
 * @description 防止对刷新端点的滥用和暴力探测
 */
export const refreshLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 60,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: { error: '令牌刷新过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * 管理员路由专用速率限制
 * @description 比全局 API 更严格，1 分钟内最多 30 次请求
 *   供管理员专用路由（如 activity-logs）显式应用，既满足 CodeQL 静态分析
 *   又提供更细粒度的安全控制
 */
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 30,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: { error: '管理员操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
