/**
 * @file RUM 指标接收路由
 * @description 接收前端上报的真实用户性能监控数据（LCP/CLS/INP/FCP/TTFB 等），
 *              经基础校验后写入结构化日志，供后续聚合分析
 * @module server/routes/rum
 */

import { Router, Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

const router = Router()

/**
 * 允许接收的 Web Vitals 指标名称白名单
 * @description 防止任意字符串污染日志和指标系统
 */
const ALLOWED_METRICS = new Set([
  'LCP',
  'CLS',
  'INP',
  'FCP',
  'TTFB',
  'FID'
])

/**
 * 验证单条指标对象
 * @param {unknown} item - 待验证的指标对象
 * @returns {boolean}
 */
function isValidMetric(item: unknown): item is Record<string, unknown> {
  if (typeof item !== 'object' || item === null) {
    return false
  }

  const metric = item as Record<string, unknown>

  if (typeof metric.metric !== 'string' || !ALLOWED_METRICS.has(metric.metric)) {
    return false
  }

  if (typeof metric.value !== 'number' || Number.isNaN(metric.value)) {
    return false
  }

  return true
}

/**
 * 将请求体规范化为指标数组
 * @param {unknown} body - 请求体
 * @returns {Array<Record<string, unknown>>|null} 规范化后的指标数组，无效时返回 null
 */
function normalizeMetrics(body: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(body)) {
    return body
  }

  if (typeof body === 'object' && body !== null) {
    return [body as Record<string, unknown>]
  }

  return null
}

/**
 * POST /api/rum
 * @description 接收单条或批量 RUM 指标，校验后写入日志
 */
router.post('/', (req: Request, res: Response, _next: NextFunction) => {
  const metrics = normalizeMetrics(req.body)

  if (metrics === null) {
    res.status(400).json({
      success: false,
      error: '请求体必须是对象或数组'
    })
    return
  }

  const invalidIndex = metrics.findIndex((item) => !isValidMetric(item))
  if (invalidIndex !== -1) {
    res.status(400).json({
      success: false,
      error: `第 ${invalidIndex + 1} 条指标格式无效：缺少 metric 或 value`
    })
    return
  }

  // 写入结构化日志，便于后续通过日志聚合生成 RUM 报表
  logger.info('RUM metric received', {
    count: metrics.length,
    metrics: metrics.map((m) => ({
      metric: m.metric,
      value: m.value,
      rating: m.rating,
      url: m.url,
      userAgent: m.userAgent
    })),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })

  // 返回 204 No Content，前端无需处理响应体
  res.status(204).send()
})

export default router
